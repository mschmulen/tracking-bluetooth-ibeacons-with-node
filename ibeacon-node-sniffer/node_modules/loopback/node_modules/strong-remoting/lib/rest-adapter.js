/*!
 * Expose `RestAdapter`.
 */

module.exports = RestAdapter;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:rest-adapter')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , express = require('express')
  , cors = require('cors')
  , async = require('async')
  , HttpContext = require('./http-context');

/**
 * Create a new `RestAdapter` with the given `options`.
 *
 * @param {Object} options
 * @return {RestAdapter}
 */

function RestAdapter(remotes) {
  EventEmitter.call(this);

  this.remotes = remotes;
  this.Context = HttpContext;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(RestAdapter, EventEmitter);

/*!
 * Simplified APIs
 */

RestAdapter.create =
RestAdapter.createRestAdapter = function (remotes) {
  // add simplified construction / sugar here
  return new RestAdapter(remotes);
}

/**
 * Get the path for the given method.
 */

RestAdapter.prototype.getRoutes = function (obj) {
  var fn = (obj.fn || obj.ctor);
  var routes = fn && fn.http;

  if(routes && !Array.isArray(routes)) {
    routes = [routes];
  }

  // overidden
  if(routes) {
    // patch missing verbs / routes
    routes.forEach(function (r) {
      r.verb = String(r.verb || 'all').toLowerCase();
      r.path = r.path || ('/' + obj.name);
    });
  } else {
    if(obj.name === 'sharedCtor') {
      routes = [{
        verb: 'all',
        path: '/prototype'
      }];
    } else {
      // build default route
      routes = [{
        verb: 'all',
        path: obj.name ? ('/' + obj.name) : ''
      }];
    }
  }

  return routes;
}

RestAdapter.prototype.createHandler = function () {
  var root = express();
  var adapter = this;
  var classes = this.remotes.classes();

  // Add a handler to tolerate empty json as connect's json middleware throws an error
  root.use(function(req, res, next) {
    if(req.is('application/json')) {
        if(req.get('Content-Length') === '0') { // This doesn't cover the transfer-encoding: chunked
            req._body = true; // Mark it as parsed
            req.body = {};
        }
    }
    next();
  });

  // Set strict to be `false` so that anything `JSON.parse()` accepts will be parsed
  root.use(express.urlencoded());
  root.use(express.json({strict: false}));
  root.use(cors());

  classes.forEach(function (sharedClass) {
    var app = express();

    // Register handlers for all shared methods of this class sharedClass
    sharedClass
      .methods()
      .forEach(function(sharedMethod) {
        adapter
          .getRoutes(sharedMethod)
          .forEach(function(route) {
            adapter._registerMethodRouteHandlers(app, sharedMethod, route);
          });
      });

    // Convert requests for unknown methods of this sharedClass into 404.
    // Do not allow other middleware to invade our URL space.
    app.use(RestAdapter.remoteMethodNotFoundHandler(sharedClass.name));

    // Mount the remoteClass app on all class routes.
    adapter
      .getRoutes(sharedClass)
      .forEach(function (route) {
        root.use(route.path, app);
      });

    // sort app routes
    Object
      .keys(app.routes)
      .forEach(function (key) {
        if(Array.isArray(app.routes[key])) {
          app.routes[key] = app.routes[key].sort(sortRoutes);
        }
      });
  });

  // Convert requests for unknown URLs into 404.
  // Do not allow other middleware to invade our URL space.
  root.use(RestAdapter.urlNotFoundHandler());

  // Use our own error handler to make sure the error response has
  // always the format expected by remoting clients.
  root.use(RestAdapter.errorHandler());

  return root;
};

RestAdapter.remoteMethodNotFoundHandler = function(className) {
  className = className || '(unknown)';
  return function restRemoteMethodNotFound(req, res, next) {
    var message = 'Shared class "' + className + '"' +
      ' has no method handling ' + req.method + ' ' + req.url;
    var error = new Error(message);
    error.status = error.statusCode = 404;
    next(error);
  };
};

RestAdapter.urlNotFoundHandler = function() {
  return function restUrlNotFound(req, res, next) {
    var message = 'There is no method to handle ' + req.method + ' ' + req.url;
    var error = new Error(message);
    error.status = error.statusCode = 404;
    next(error);
  };
};

RestAdapter.errorHandler = function() {
  return function restErrorHandler(err, req, res, next) {
    if(typeof err === 'string') {
      err = new Error(err);
      err.status = err.statusCode = 500;
    }

    res.statusCode = err.statusCode || err.status || 500;

    debug('Error in %s %s: %s', req.method, req.url, err.stack);
    var data = {
      name: err.name,
      status: res.statusCode,
      message: err.message || 'An unknown error occurred'
    };

    for (var prop in err)
      data[prop] = err[prop];

    // TODO(bajtos) Remove stack info when running in production
    data.stack = err.stack;

    res.send({ error: data });
  };
};

RestAdapter.prototype._registerMethodRouteHandlers = function(app,
                                                              method,
                                                              route) {
  if (method.isStatic) {
    app[route.verb](
      route.path,
      this._createStaticMethodHandler(method)
    );
    return;
  }

  var self = this;
  this
    .getRoutes(method.sharedCtor)
    .forEach(function(sharedCtorRoute) {
      var methodPath = route.path === '/' ? '' : route.path;
      var ctorPath = sharedCtorRoute.path === '/' ? '' : sharedCtorRoute.path;
      var fullPath = (ctorPath + methodPath) || '/';
      app[route.verb](
        fullPath,
        self._createPrototypeMethodHandler(method)
      );
    });
};

RestAdapter.prototype._createStaticMethodHandler = function(method) {
  var self = this;
  var Context = this.Context;

  return function restStaticMethodHandler(req, res, next) {
    var ctx = new Context(req, res, method);
    self._invokeMethod(ctx, method, next);
  };
};

RestAdapter.prototype._createPrototypeMethodHandler = function(method) {
  var self = this;
  var Context = this.Context;

  return function restPrototypeMethodHandler(req, res, next) {
    var ctx = new Context(req, res, method);

    // invoke the shared constructor to get an instance
    ctx.invoke(method, method.sharedCtor, function(err, inst) {
      if (err) return next(err);
      ctx.instance = inst;
      self._invokeMethod(ctx, method, next);
    }, true);
  };
};

RestAdapter.prototype._invokeMethod = function(ctx, method, next) {
  var remotes = this.remotes;
  var steps = [];

  if (method.rest.before) {
    steps.push(function invokeRestBefore(cb) {
      debug('Invoking rest.before for ' + ctx.methodString);
      method.rest.before.call(remotes.getScope(ctx, method), ctx, cb);
    });
  }

  steps.push(
    this.remotes.invokeMethodInContext.bind(this.remotes, ctx, method)
  );

  if (method.rest.after) {
    steps.push(function invokeRestAfter(cb) {
      debug('Invoking rest.after for ' + ctx.methodString);
      method.rest.after.call(remotes.getScope(ctx, method), ctx, cb);
    });
  }

  async.series(
    steps,
    function(err) {
      if (err) return next(err);
      ctx.done();
      // Do not call next middleware, the request is handled
    }
  );
};

RestAdapter.prototype.allRoutes = function () {
  var routes = [];
  var adapter = this;
  var remotes = this.remotes;
  var Context = this.Context;
  var classes = this.remotes.classes();
  var currentRoot = '';

  classes.forEach(function (sc) {


    adapter
      .getRoutes(sc)
      .forEach(function (classRoute) {
        currentRoot = classRoute.path;
        var methods = sc.methods();

        var functions = [];
        methods.forEach(function (method) {
          // Use functions to keep track of JS functions to dedupe
          if(functions.indexOf(method.fn) === -1) {
              functions.push(method.fn);
          } else {
              return; // Skip duplicate methods such as X.m1 = X.m2 = function() {...}
          }
          adapter.getRoutes(method).forEach(function (route) {
            if(method.isStatic) {
              addRoute(route.verb, route.path, method);
            } else {
              adapter
                .getRoutes(method.sharedCtor)
                .forEach(function (sharedCtorRoute) {
                  addRoute(route.verb, sharedCtorRoute.path + route.path, method);
                });
            }
          });
        });
      });
  });

  return routes;


  function addRoute(verb, path, method) {
    if(path === '/' || path === '//') {
      path = currentRoot;
    } else {
      path = currentRoot + path;
    }

    if(path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }

    // TODO this could be cleaner
    path = path.replace(/\/\//g, '/');

    routes.push({
      verb: verb,
      path: path,
      description: method.description,
      method: method.stringName,
      accepts: (method.accepts && method.accepts.length) ? method.accepts : undefined,
      returns: (method.returns && method.returns.length) ? method.returns : undefined
    });
  }
}

// path part routes should
// not override explicit routes
function sortRoutes(a, b) {
  if(a.path[1] === ':') {
    return 1;
  } else {
    return -1;
  }
}
