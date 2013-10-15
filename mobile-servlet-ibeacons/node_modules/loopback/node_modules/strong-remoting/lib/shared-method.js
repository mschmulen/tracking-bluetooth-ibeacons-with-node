/**
 * Expose `SharedMethod`.
 */

module.exports = SharedMethod;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:shared-method')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')

/**
 * Create a new `SharedMethod` with the given `fn`.
 *
 * @param {Function} fn
 * @return {SharedMethod}
 */

function SharedMethod(fn, name, sc, isStatic) {
  assert(fn);
  this.fn = fn;
  this.name = name;
  this.isStatic = isStatic;
  this.accepts = fn.accepts || [];
  this.returns = fn.returns || [];
  this.description = fn.description;
  this.http = fn.http || {};
  this.sharedClass = sc;

  if(sc) {
    this.ctor = sc.ctor;
    this.sharedCtor = sc.sharedCtor;
  }
  if(name === 'sharedCtor') {
    this.isSharedCtor = true;
  }

  if(this.accepts && !Array.isArray(this.accepts)) {
    this.accepts = [this.accepts];
  }
  if(this.returns && !Array.isArray(this.returns)) {
    this.returns = [this.returns];
  }

  this.stringName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;
}

/**
 * Execute the remote method using the given arg data.
 *
 * @param args {Object} containing named argument data
 * @param fn {Function} callback `fn(err, result)` containing named result data
 */

SharedMethod.prototype.invoke = function (scope, args, fn) {
  var accepts = this.accepts;
  var returns = this.returns;
  var method = this.fn;
  var sharedMethod = this;
  var formattedArgs = [];
  var result;

  // convert complex types from json
  args = SharedMethod.toArgs(accepts, args);

  // map the given arg data in order they are expected in
  if(accepts) {
    accepts.forEach(function (desc) {
      var name = desc.name || desc.arg;
      var uarg = args[name];
      var actualType = SharedMethod.getType(uarg);

      // is the arg optional?
      // arg was not provided
      if(actualType === 'undefined') {
        if(desc.required) {
          throw new Error(name + ' is a required arg');
        } else {
          // Add the argument even if it's undefined to stick with the accepts
          formattedArgs.push(undefined);
          return;
        }
      }

      // convert strings
      if(actualType === 'string' && desc.type !== 'any' && actualType !== desc.type) {
        switch(desc.type) {
          case 'number':
            uarg = Number(uarg);
          break;
          case 'boolean':
            uarg = Boolean(uarg);
          break;
          case 'object':
          case 'array':
            uarg = JSON.parse(uarg);
          break;
        }
      }

      // Add the argument even if it's undefined to stick with the accepts
      formattedArgs.push(uarg);
    });
  }

  // define the callback
  function callback(err) {
    if(err) {
      return fn(err);
    }

    result = SharedMethod.toResult(returns, [].slice.call(arguments, 1));

    debug('- %s - result %j', sharedMethod.name, result);

    fn(null, result);
  }

  // add in the required callback
  formattedArgs.push(callback);

  debug('- %s - invoke with', this.name, formattedArgs);

  // invoke
  method.apply(scope, formattedArgs);
}

/**
 * Returns an appropriate type based on `val`.
 */

SharedMethod.getType = function (val) {
  var type = typeof val;

  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'function':
    case 'string':
      return type;
    case 'object':
      // null
      if (val === null) {
        return 'null';
      }

      // buffer
      if (Buffer.isBuffer(val)) {
        return 'buffer';
      }

      // array
      if (Array.isArray(val)) {
        return 'array';
      }

      // date
      if (val instanceof Date) {
        return 'date';
      }

      // object
      return 'object';
  }
};

/**
 * Returns a reformatted Object valid for consumption as remoting function
 * arguments, based on `accepts`.
 */

SharedMethod.toArgs = function(accepts, raw) {
  var result = raw.$data || raw;

  var type = raw.type;

  switch (type) {
    case 'base64':
      result = new Buffer(result, 'base64');
    break;
    case 'date':
      result = new Date(result);
    break;
    default:
      switch(this.getType(result)) {
        case 'array':
          // TODO scrub arrays
        break;
        case 'object':
          // convert entire object
          Object.keys(result).forEach(function (key) {
            if(result[key]) {
              result[key] = SharedMethod.toArgs(accepts, result[key]);
            }
          }.bind(this));
        break;
      }
    break;
  }

  return result;
};

/**
 * Returns a reformatted Object valid for consumption as JSON from an Array of
 * results from a remoting function, based on `returns`.
 */

SharedMethod.toResult = function(returns, raw) {
  var result = {};

  if (!returns.length) {
    return;
  }

  returns = returns.filter(function (item, index) {
    if (index >= raw.length) {
      return false;
    }

    if (item.root) {
      result = convert(raw[index]);
      return false;
    }

    return true;
  });

  returns.forEach(function (item, index) {
    result[item.name || item.arg] = convert(raw[index]);
  });

  return result;

  function convert(val) {
    switch (SharedMethod.getType(val)) {
      case 'date':
        return {
          $type: 'date',
          $data: val.toString()
        };
      case 'buffer':
        return {
          $type: 'base64',
          $data: val.toString('base64')
        };
    }

    return val;
  }
};
