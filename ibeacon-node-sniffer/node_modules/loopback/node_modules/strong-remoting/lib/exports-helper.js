/*!
 * Expose `ExportsHelper`.
 */

module.exports = ExportsHelper;

/*!
 * Module dependencies.
 */
var debug = require('debug')('strong-remoting:exports-helper');

/*!
 * Constants
 */
var PASSTHROUGH_OPTIONS = ['http', 'description'];

/**
 * @class A wrapper to make manipulating the exports object easier.
 *
 * @constructor
 * Create a new `ExportsHelper` with the given `options`.
 */

function ExportsHelper(obj) {
  if (!(this instanceof ExportsHelper)) {
    return new ExportsHelper(obj);
  }

  this._obj = obj;
}

/**
 * Sets a value at any path within the exports object.
 */
ExportsHelper.prototype.setPath = setPath;
function setPath(path, value) {
  var self = this;
  var obj = self._obj;
  var split = path.split('.');
  var name = split.pop();

  split.forEach(function (key) {
    if (!obj[key]) {
      obj[key] = {};
    }

    obj = obj[key];
  });

  debug('Setting %s to %s', path, value);
  obj[name] = value;

  return self;
}

/**
 * Exports a constructor ("type") with the provided options.
 */
ExportsHelper.prototype.addType = type;
ExportsHelper.prototype.type = type;
function type(fn, options) {
  var self = this;
  var path = options.path || options.name || fn.name || null;
  var sharedCtor = options.sharedCtor || null;
  var accepts = options.accepts || null;

  if (!path) {
    // TODO: Error.
    return self;
  }

  if (!sharedCtor) {
    // TODO(schoon) - This shouldn't be thought of (or named) as a "shared
    // constructor". Instead, this is the lazy find/create sl-remoting uses when
    // a prototype method is called. `getInstance`? `findOrCreate`? `load`?
    sharedCtor = function () {
      var _args = [].slice.call(arguments);
      _args.pop()(null, fn.apply(null, _args));
    };
  }

  if (!sharedCtor.accepts) {
    sharedCtor.accepts = accepts;
  }

  // This is required because sharedCtors are called just like any other
  // remotable method. However, you always expect the instance and nothing else.
  if (!sharedCtor.returns) {
    sharedCtor.returns = { type: 'object', root: true };
  }

  PASSTHROUGH_OPTIONS.forEach(function (key) {
    if (options[key]) {
      sharedCtor[key] = options[key];
    }
  });

  self.setPath(path, fn);
  fn.shared = true;
  fn.sharedCtor = sharedCtor;

  return new ExportsHelper(fn.prototype);
}

/**
 * Exports a Function with the provided options.
 */
ExportsHelper.prototype.addMethod = method;
ExportsHelper.prototype.method = method;
function method(fn, options) {
  var self = this;
  var path = options.path || options.name || fn.name || null;
  var accepts = options.accepts || null;
  var returns = options.returns || null;

  if (!path) {
    // TODO: Error.
    return self;
  }

  self.setPath(path, fn);
  fn.shared = true;
  fn.accepts = accepts;
  fn.returns = returns;

  PASSTHROUGH_OPTIONS.forEach(function (key) {
    if (options[key]) {
      fn[key] = options[key];
    }
  });

  return self;
}
