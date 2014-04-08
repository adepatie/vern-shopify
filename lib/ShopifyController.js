/**
* Connector with Shopify
*
* @class ShopifyController
* @constructor
*/
function ShopifyController($parent) {
  var shopifyObj     = require('shopify-node'),
    validator = require('validator');

  var $scope = new $parent.controller(ShopifyController);
  
  $scope.getLoginURL = function(req, res, next) {
    var resp = res.resp;
    var shopify = new shopifyObj({
      shop_name: $parent.localConfig.shopify_shop_name,
      id: $parent.localConfig.shopify_client_id,
      secret: $parent.localConfig.shopify_client_secret,
      redirect: $parent.localConfig.shopify_redirect
    });
    
    var url = shopify.createURL();

    resp.data({
      url: url
    });
    resp.send();
  };
  
  $scope.postAuthorizationCode = function(req, res, next) {
    var resp = res.resp;
    var shopify = new shopifyObj({
      shop_name: $parent.localConfig.shopify_shop_name,
      id: $parent.localConfig.shopify_client_id,
      secret: $parent.localConfig.shopify_client_secret,
      redirect: $parent.localConfig.shopify_redirect
    });
    
    if(typeof req.params.code !== 'string') {
      resp.handleError(404, "Code is missing");
      return;
    }
    
    var code = req.params.code;
    
    shopify.getAccessToken(code, function(err, access_token) {
      // This function needs to create a Vern user if not registered already, otherwise on success
      // it should update a user's info.
      if(err) {
        console.log(err);
        resp.handleError(500, 'An error occurred, see payload for details');
        return;
      }

      new $parent.models.UserModel().getByShopifyAccessToken(access_token, function(err, users) {
        if(users.length > 0) {
          // We found the account, return it.
          resp.data(users[0].account());
          resp.send();
          return;        
        }
        
        // No user found, ask for email and password to register.
        console.log("Access Token: " + access_token);
        resp.data({
          access_token: access_token
        });
        resp.send();
      });
    });
  };
  
  $scope.registerShopifyUser = function(req, res, next) {
    var resp = res.resp;

    var error = null;
    if(validator.isNull(req.params.access_token)) {
      error = 'Missing access token';
    }
    if(!validator.isEmail(req.params.email)) {
      error = 'Missing Email';
    }
    if(!validator.isLength(req.params.password, 6)) {
      error = 'Password must be at least 6 characters long.';
    }
    if(error) {
      return resp.handleError(404, error);
    }

    var shopify = new shopifyObj({
      shop_name: $parent.localConfig.shopify_shop_name,
      id: $parent.localConfig.shopify_client_id,
      secret: $parent.localConfig.shopify_client_secret,
      redirect: $parent.localConfig.shopify_redirect,
      access_token: req.params.access_token
    });
    console.log(req.params);

    shopify.get('/admin/orders.json', function(err, orders) {
      if(err) {
        resp.handleError(417, 'An error occurred');
        return;
      }
      
      // check email taken
      new $parent.models.UserModel().getByEmail(req.params.email, function(err, users) {
        if(err) {
          resp.handleError(500, 'Something went wrong');
          return;
        }
        
        if(users.length > 0) {
          resp.handleError(400, 'Email already in use');
          return;
        }
        
        var a = new $parent.controllers.AuthController($parent);
        
        a.createUser({
          email: req.params.email,
          password: req.params.password,
          shopify_access_token: req.params.access_token,
          role: 'admin'
        }, function(err, user) {
          if(err) {
            resp.handleError(500, 'Something went wrong.');
            return;
          }
          resp.data(user.account());
          resp.send();
        });
      })
    });
  };
  
  $scope.shopifyAction = function(req, res, next) {
    var user = req.user;
    var resp = res.resp;
    
    if(typeof user.shopify_access_token !== 'string' || user.shopify_access_token.length <= 0) {
      resp.handleError(400, 'Your account is not connected to Shopify');
      return;
    }
    
    var actions = [
      'get',
      'post',
      'put',
      'delete'
    ];
    
    var action = req.params.action.toLowerCase();
    if(actions.indexOf(action) === -1) {
      resp.handleError(400, 'Invalid request action: ' + action);
      return;
    }
    
    var shopify = new shopifyObj({
      shop_name: $parent.localConfig.shopify_shop_name,
      id: $parent.localConfig.shopify_client_id,
      secret: $parent.localConfig.shopify_client_secret,
      redirect: $parent.localConfig.shopify_redirect,
      access_token: user.shopify_access_token
    });
    
    shopify[action](req.params.path, req.params.data, function(err, json) {
      if(err) {
        resp.handleError(400, 'Shopify error!');
        return;
      }
      
      resp.data(json);
      resp.send();
    });
  };
  
  /**
  * Handles endpoint [GET] `/shopify/login_url`
  * 
  * @method /shopify/login_url [GET]
  */
  $scope.addRoute({
    path: '/shopify/login_url', 
    controller: $scope.getLoginURL
  });
  
  /**
  * Handles endpoint [POST] `/shopify/authorization_code`
  * 
  * @method /shopify/authorization_code [POST]
  * @param {String} code The
  *   code given by the OAuth2 call from Shopify
  */
  $scope.addRoute({
    method: 'post',
    path: '/shopify/authorization_code', 
    controller: $scope.postAuthorizationCode
  });
  
  $scope.addRoute({
    method: 'post',
    path: '/shopify/register',
    controller: $scope.registerShopifyUser
  });
  
  $scope.addRoute({
    method: 'post',
    path: '/shopify/action',
    requiresAuth: true,
    controller: $scope.shopifyAction
  });
  
  return $scope;
}

module.exports = ShopifyController;