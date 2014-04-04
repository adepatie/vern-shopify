/**
 * Created by Developer on 4/4/14.
 */


function ShopifyController($parent) {
  var shopifyObj = require('shopify-node'),
    validator = require('validator'),
    UserModel = require('./UserModel');

  $scope.getLoginURL = function(req, res, next) {
    var resp = res.resp;
    var shopify = new shopifyObj({
      shop_name: config.env[process.env.NODE_ENV].shopify_shop_name,
      id: config.env[process.env.NODE_ENV].shopify_client_id,
      secret: config.env[process.env.NODE_ENV].shopify_client_secret,
      redirect: config.env[process.env.NODE_ENV].shopify_redirect
    });

    var url = shopify.createURL();

    resp.data({
      url: url
    });
    res.send(resp.responseCode, resp.output());
  };

  $scope.postAuthorizationCode = function(req, res, next) {
    var resp = res.resp;
    var shopify = new shopifyObj({
      shop_name: config.env[process.env.NODE_ENV].shopify_shop_name,
      id: config.env[process.env.NODE_ENV].shopify_client_id,
      secret: config.env[process.env.NODE_ENV].shopify_client_secret,
      redirect: config.env[process.env.NODE_ENV].shopify_redirect
    });

    if(typeof req.params.code !== 'string') {
      resp.setCode(400);
      resp.errorMessage('Code is invalid');
      res.send(resp.responseCode, resp.output());
      return;
    }

    var code = req.params.code;

    shopify.getAccessToken(code, function(err, access_token) {
      // This function needs to create a Vern user if not registered already, otherwise on success
      // it should update a user's info.
      if(err) {
        console.log(err);
        resp.setCode(500);
        resp.errorMessage('An error occurred, see payload for details');
        resp.data(err);
        res.send(resp.responseCode, resp.output());
        return;
      }

      new UserModel().getByShopifyAccessToken(access_token, function(err, users) {
        if(users.length > 0) {
          // We found the account, return it.
          var user = new UserModel(users[0]);
          resp.data(user.account());
          res.send(resp.responseCode, resp.output());
          return;
        }

        // No user found, ask for email and password to register.
        console.log("Access Token: " + access_token);
        resp.data({
          access_token: access_token
        });
        res.send(resp.responseCode, resp.output());
      });
    });
  };

  $scope.registerShopifyUser = function(req, res, next) {
    var resp = res.resp;

    try {
      check(req.params.access_token, 'Missing access_token').notNull().notEmpty();
      check(req.params.email, 'Missing email').isEmail();
      check(req.params.password, 'Password must have at least 1 number and be at least 6 characters long)').len(6).isAlphanumeric();
    } catch(e) {
      resp.setCode(417);
      resp.errorMessage(e.message);
      res.send(resp.responseCode, resp.output());
      return;
    }

    var shopify = new shopifyObj({
      shop_name: config.env[process.env.NODE_ENV].shopify_shop_name,
      id: config.env[process.env.NODE_ENV].shopify_client_id,
      secret: config.env[process.env.NODE_ENV].shopify_client_secret,
      redirect: config.env[process.env.NODE_ENV].shopify_redirect,
      access_token: req.params.access_token
    });

    shopify.get('/admin/orders.json', function(err, orders) {
      if(err) {
        resp.setCode(417);
        resp.errorMessage('An error occurred');
        resp.data(err);
        res.send(resp.responseCode, resp.output());
        return;
      }

      // check email taken
      new UserModel().getByEmail(req.params.email, function(err, users) {
        if(err) {
          resp.setCode(500);
          resp.errorMessage('Something went wrong');
          res.send(resp.responseCode, resp.output());
          return;
        }

        if(users.length > 0) {
          resp.setCode(400);
          resp.errorMessage('Email already in use');
          res.send(resp.responseCode, resp.output());
          return;
        }

        var a = new AuthController({
          app: app
        });

        a.createUser({
          email: req.params.email,
          password: req.params.password,
          shopify_access_token: req.params.access_token,
          role: 'admin'
        }, function(err, user) {
          if(err) {
            resp.setCode(500);
            resp.errorMessage('Something went wrong.');
            res.send(resp.responseCode, resp.output());
            return;
          }
          resp.data(user.account());
          res.send(resp.responseCode, resp.output());
        });
      })
    });
  };

  $scope.shopifyAction = function(req, res, next) {
    var user = new UserModel(req.user);
    var resp = new res.resp;

    if(typeof user.shopify_access_token !== 'string' || user.shopify_access_token.length <= 0) {
      resp.setCode(400);
      resp.errorMessage('Your account is not connected to Shopify');
      res.send(resp.responseCode, resp.output());
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
      resp.setCode(400);
      resp.errorMessage('Invalid request action: ' + action);
      res.send(resp.responseCode, resp.output());
      return;
    }

    var shopify = new shopifyObj({
      shop_name: config.env[process.env.NODE_ENV].shopify_shop_name,
      id: config.env[process.env.NODE_ENV].shopify_client_id,
      secret: config.env[process.env.NODE_ENV].shopify_client_secret,
      redirect: config.env[process.env.NODE_ENV].shopify_redirect,
      access_token: user.shopify_access_token
    });

    shopify[action](req.params.path, req.params.data, function(err, json) {
      if(err) {
        resp.setCode(400);
        resp.errorMessage('Shopify error!');
        resp.data(err);
        res.send(resp.responseCode, resp.output());
        return;
      }

      resp.data(json);
      res.send(resp.responseCode, resp.output());
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

  var $scope = new $parent.controller(ShopifyController);
}

module.exports = ShopifyController;
