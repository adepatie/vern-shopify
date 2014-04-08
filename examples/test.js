/**
 * Created by Alex Depatie on 4/8/14.
 */

var vern = require('vern-core');
var request = require('request');
var prompt = require('prompt');

new vern().then(function($vern) {
  $vern = require('../lib')($vern);
  $vern.controllers.shopify = new $vern.controllers.ShopifyController($vern).init();
  request.get('http://0.0.0.0:3458/shopify/login_url', function(err, response) {
    console.log(response.body);
  });




    prompt.start();
    prompt.get([{
      name: 'code',
      message: 'Enter the code',
      required: true
    }], function (err, result) {

      console.log(result.code);

      request.post('http://0.0.0.0:3458/shopify/authorization_code', {form: {code: result.code}}, function (err, response) {
        console.log(response.body);

        prompt.get(['access_token'], function (err, result) {

          request.post('http://0.0.0.0:3458/shopify/register', {form: {access_token: result.access_token}}, function (err, response) {
            console.log(response.body);
          });

        });
      });
    });






  //request.post('http://0.0.0.0:3458/shopify/action', function(err, response) {
    //console.log(response);
  //});

}).fail(function(err) {
  console.log(err);
  console.log(err.stack);
});
