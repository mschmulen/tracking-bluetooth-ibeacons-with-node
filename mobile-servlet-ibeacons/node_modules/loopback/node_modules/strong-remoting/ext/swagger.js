/**
 * Expose the `Swagger` plugin.
 */
module.exports = Swagger;

/**
 * Module dependencies.
 */
var Remoting = require('../');

/**
 * Create a remotable Swagger module for plugging into `RemoteObjects`.
 */
function Swagger(remotes, options, models) {
  // Unfold options.
  var _options = options || {};
  var name = _options.name || 'swagger';
  var version = _options.version;
  var basePath = _options.basePath;

  // We need a temporary REST adapter to discover our available routes.
  var adapter = remotes.handler('rest').adapter;
  var routes = adapter.allRoutes();
  var classes = remotes.classes();

  var extension = {};
  var helper = Remoting.extend(extension);

  var apiDocs = {};
  var resourceDoc = {
    apiVersion: version,
    swaggerVersion: '1.1',
    basePath: basePath,
    apis: []
  };

  classes.forEach(function (item) {
    resourceDoc.apis.push({
      path: '/' + name + '/' + item.name,
      description: item.ctor.sharedCtor && item.ctor.sharedCtor.description
    });

    apiDocs[item.name] = {
      apiVersion: resourceDoc.apiVersion,
      swaggerVersion: resourceDoc.swaggerVersion,
      basePath: resourceDoc.basePath,
      apis: [],
      models: models
    };

    helper.method(api, {
      path: item.name,
      returns: { type: 'object', root: true }
    });
    function api(callback) {
      callback(null, apiDocs[item.name]);
    }
    addDynamicBasePathGetter(remotes, name + '.' + item.name, apiDocs[item.name]);
  });

  routes.forEach(function (route) {
    var split = route.method.split('.');
    var doc = apiDocs[split[0]];
    var classDef;

    if (!doc) {
      console.error('Route exists with no class: %j', route);
      return;
    }

    classDef = classes.filter(function (item) {
      return item.name === split[0];
    })[0];

    if (classDef && classDef.sharedCtor && classDef.sharedCtor.accepts && split.length > 2 /* HACK */) {
      route.accepts = (route.accepts || []).concat(classDef.sharedCtor.accepts);
    }

    doc.apis.push(routeToAPI(route));
  });

  /**
   * The topmost Swagger resource is a description of all (non-Swagger) resources
   * available on the system, and where to find more information about them.
   */
  helper.method(resources, {
    returns: [{ type: 'object', root: true }]
  });
  function resources(callback) {
    callback(null, resourceDoc);
  }
  addDynamicBasePathGetter(remotes, name + '.resources', resourceDoc);

  remotes.exports[name] = extension;
  return extension;
}

/**
 * There's a few forces at play that require this "hack". The Swagger spec
 * requires a `basePath` to be set at various points in the API/Resource
 * descriptions. However, we can't guarantee this path is either reachable or
 * desirable if it's set as a part of the options.
 *
 * The simplest way around this is to reflect the value of the `Host` HTTP
 * header as the `basePath`. Because we pre-build the Swagger data, we don't
 * know that header at the time the data is built. Hence, the getter function.
 * We can use a `before` hook to pluck the `Host`, then the getter kicks in to
 * return that path as the `basePath` during JSON serialization.
 *
 * @param {SharedClassCollection} remotes The Collection to register a `before`
 *                                        hook on.
 * @param {String} path                   The full path of the route to register
 *                                        a `before` hook on.
 * @param {Object} obj                    The Object to install the `basePath`
 *                                        getter on.
 */
function addDynamicBasePathGetter(remotes, path, obj) {
  var basePath = String(obj.basePath) || '';

  remotes.before(path, function (ctx, next) {
    var headers = ctx.req.headers;
    var host = headers.Host || headers.host;

    basePath = 'http://' + host;
    next();
  });

  return setter(obj);

  function getter() {
    return basePath;
  }

  function setter(obj) {
    return Object.defineProperty(obj, 'basePath', {
      configurable: false,
      enumerable: true,
      get: getter
    });
  }
}

/**
 * Converts from an sl-remoting-formatted "Route" description to a
 * Swagger-formatted "API" description.
 */

function routeToAPI(route) {
  var returnDesc = route.returns && route.returns[0];

  return {
    path: convertPathFragments(route.path),
    operations: [{
      httpMethod: convertVerb(route.verb),
      nickname: route.method.replace(/\./g, '_'), // [rfeng] Swagger UI doesn't escape '.' for jQuery selector
      responseClass: returnDesc ? returnDesc.model || prepareDataType(returnDesc.type) : 'void',
      parameters: route.accepts ? route.accepts.map(acceptToParameter(route)) : [],
      errorResponses: [], // TODO(schoon) - We don't have descriptions for this yet.
      summary: route.description, // TODO(schoon) - Excerpt?
      notes: '' // TODO(schoon) - `description` metadata?
    }]
  };
}

function convertPathFragments(path) {
  return path.split('/').map(function (fragment) {
    if (fragment.charAt(0) === ':') {
      return '{' + fragment.slice(1) + '}';
    }
    return fragment;
  }).join('/');
}

function convertVerb(verb) {
  if (verb.toLowerCase() === 'all') {
    return 'POST';
  }

  if (verb.toLowerCase() === 'del') {
    return 'DELETE';
  }

  return verb.toUpperCase();
}

/**
 * A generator to convert from an sl-remoting-formatted "Accepts" description to
 * a Swagger-formatted "Parameter" description.
 */

function acceptToParameter(route) {
  var type = 'form';

  if (route.verb.toLowerCase() === 'get') {
    type = 'query';
  }

  return function (accepts) {
    var name = accepts.name || accepts.arg;
    var paramType = type;

    // TODO: Regex. This is leaky.
    if (route.path.indexOf(':' + name) !== -1) {
      paramType = 'path';
    }

    // Check the http settings for the argument
    if(accepts.http && accepts.http.source) {
        paramType = accepts.http.source;
    }

    return {
      paramType: paramType || type,
      name: name,
      description: accepts.description,
      dataType: accepts.model || prepareDataType(accepts.type),
      required: !!accepts.required,
      allowMultiple: false
    };
  };
}

/**
 * Converts from an sl-remoting data type to a Swagger dataType.
 */

function prepareDataType(type) {
  if (!type) {
    return 'void';
  }

  // TODO(schoon) - Add support for complex dataTypes, "models", etc.
  switch (type) {
    case 'buffer':
      return 'byte';
    case 'date':
      return 'Date';
    case 'number':
      return 'double';
  }

  return type;
}
