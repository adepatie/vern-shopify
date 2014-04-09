####Copyright Notice

VERN is copyright 2014 uh-sem-blee, Co. Built by typefoo.

####License

You may not use, alter, or redistribute this code without permission from uh-sem-blee, Co.

# VERN - Shopify OAuth Authentication

Handles basic OAuth authentication routines for Shopify

## New VERN Controllers

* ShopifyController

## Configuration Requirements

```javascript
      shopify_shop_name: '<SHOP_NAME>',
      shopify_client_id: '<CLIENT_ID>',
      shopify_client_secret: '<CLIENT_SECRET>',
      shopify_redirect: '<HOST_NAME>',
```
## Usage

```javascript
var vern = require('vern-core');
new vern().then(function($vern) {
  $vern = require('vern-shopify')($vern);
});
```
## Authentication Methods

####getLoginURL
- Retrieves a Shopify Login URL which returns an authorization code

```javascript
method: 'GET',
path: '/shopify/login_url'
```

####postAuthorizationCode
- Takes the authorization code and returns with an access_token

```javascript
method: 'POST',
path: '/shopify/authorization_code'
```

####registerShopifyUser
 - Registers a new Shopify user and returns an AuthenticationKey

```javascript
method: 'POST',
path: 'shopify/register'
```

####shopifyAction
 - All Shopify API HTTP requests. ['get', 'post', 'put', 'delete']  (Requires authentication)

```javascript
method: 'post',
path: '/shopify/action'
```




