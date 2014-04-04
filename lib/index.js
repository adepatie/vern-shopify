module.exports = function($vern) {
  $vern.controllers.ShopifyController = require('./ShopifyController');
  $vern.models.UserModel = require('./UserModel')($vern);
  return $vern;
}
