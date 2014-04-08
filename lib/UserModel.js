var validator = require('validator');

function Model(scope) {
  var UserModel = scope.models.UserModel;
  function NewUserModel() {
    this.shopify_access_token = null;

    return this.update(arguments[0]);
  }

  new scope.model().extend(NewUserModel, {
    exclude: [
      'shopify_access_token'
    ]
  }, UserModel);

  return NewUserModel;
}

module.exports = Model;