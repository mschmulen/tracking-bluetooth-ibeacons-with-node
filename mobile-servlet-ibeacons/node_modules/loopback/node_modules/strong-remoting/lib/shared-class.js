/**
 * Expose `SharedClass`.
 */

module.exports = SharedClass;

/**
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-class')
  , util = require('util')
  , inherits = util.inherits
  , SharedMethod = require('./shared-method')
  , assert = require('assert');
  
/**
 * Create a new `SharedClass` with the given `options`.
 *
 * @param {Object} options
 * @return {SharedClass}
 */

function SharedClass(name, ctor) {
  this.name = name || ctor.remoteNamespace;
  this.ctor = ctor;

  if (typeof ctor === 'function') {
    // TODO(schoon) - Can we fall back to using the ctor as a method directly?
    // Without that, all remote methods have to be two levels deep, e.g.
    // `/meta/routes`.
    assert(ctor.sharedCtor, 'must define a sharedCtor');
    this.sharedCtor = new SharedMethod(ctor.sharedCtor, 'sharedCtor');
  }
  
  assert(this.name, 'must include a remoteNamespace when creating a SharedClass');
}

/**
 * Get all shared methods.
 */

SharedClass.prototype.methods = function () {
  var ctor = this.ctor;
  var methods = [];
  var sc = this;
  
  // static methods
  eachRemoteFunctionInObject(ctor, function (fn, name) {
    methods.push(new SharedMethod(fn, name, sc, true));
  });
  
  // instance methods
  eachRemoteFunctionInObject(ctor.prototype, function (fn, name) {
    methods.push(new SharedMethod(fn, name, sc));
  });
  
  return methods;
}

function eachRemoteFunctionInObject(obj, f) {
  if(!obj) return;
    
  for(var key in obj) {
    var fn;
     
    try {
      fn = obj[key];
    } catch(e) {
    }
    
    if(typeof fn === 'function' && fn.shared) {
      f(fn, key);
    }
  }
}