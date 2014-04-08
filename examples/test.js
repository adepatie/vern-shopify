/**
 * Created by Alex Depatie on 4/8/14.
 */

var vern = require('vern-core');
var request = require('request');
var prompt = require('prompt');

new vern().then(function($vern) {
  $vern = require('vern-authentication')($vern);
  $vern = require('../lib')($vern);
  $vern.controllers.shopify = new $vern.controllers.ShopifyController($vern).init();
  request.get('http://0.0.0.0:3458/shopify/login_url', function(err, response) {
    console.log(response.body);
  });

  var postData = {
    product: {
      title: 'Burton Custom Freestlye 151',
      body_html: '<strong>Good snowboard!</strong>',
      vendor: 'Burton',
      product_type: 'Snowboard',
      variants: [
        {
          option1: 'First',
          price: '10.00',
          sku: 123
        },
        {
          option1: 'Second',
          price: '20.00',
          sku: '123'
        }
      ]
    }
  };



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

          request.post('http://0.0.0.0:3458/shopify/register', {form: {access_token: result.access_token, email: 'shopify@typefoo.com', password: 'test123'}}, function (err, response) {
            console.log(response.body);

            request.post('http://0.0.0.0:3458/shopify/action', {form: { action: 'get', path: '/admin/orders.json', access_token: result.access_token}}, function (err, response) {
              console.log(response.body);
            });
            request.post('http://0.0.0.0:3458/shopify/action', {form: { action: 'post', path: '/admin/products.json', data: postData, access_token: result.access_token}}, function (err, response) {
              console.log(response.body);
            });
            request.post('http://0.0.0.0:3458/shopify/action', {form: { action: 'put', path: '/admin/products/12345.json', data: postData, access_token: result.access_token}}, function (err, response) {
              console.log(response.body);
            });
            request.post('http://0.0.0.0:3458/shopify/action', {form: { action: 'delete', path: '/admin/products/12345.json', access_token: result.access_token}}, function (err, response) {
              console.log(response.body);
            });

          });
        });
      });
    });



}).fail(function(err) {
  console.log(err);
  console.log(err.stack);
});
