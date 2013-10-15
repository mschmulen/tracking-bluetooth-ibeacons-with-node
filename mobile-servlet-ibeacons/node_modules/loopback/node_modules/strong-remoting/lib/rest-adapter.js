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
  var remotes = this.remotes;
  var Context = this.Context;
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
  root.use(express.bodyParser({strict: false}));
  // TODO(schoon) - Translate into appropriate error codes: 400, 500, etc.
  root.use(express.errorHandler());
  root.use(cors());

  classes.forEach(function (sc) {
    var app = express();
    var methods = sc.methods();

    methods.forEach(function (method) {
      adapter
        .getRoutes(method)
        .forEach(function (route) {
          if(method.isStatic) {
            app[route.verb](route.path, function (req, res, next) {
              var ctx = new Context(req, res, method);

              remotes.execHooks('before', method, method.ctor, ctx, function (err) {
                if(err) return next(err);

                // invoke the static method on the actual constructor
                ctx.invoke(method.ctor, method, function (err, result) {
                  if(err) return next(err);
                  ctx.result = result;
                  remotes.execHooks('after', method, method.ctor, ctx, function (err) {
                    if(err) {
                      next(err);
                    } else {
                      ctx.done();
                    }
                  });
                });
              });
            });
          } else {
            adapter
              .getRoutes(method.sharedCtor)
              .forEach(function (sharedCtorRoute) {
                var routePath = route.path === '/' ? '' : route.path;
                var sharedCtorRoutePath = sharedCtorRoute.path === '/' ? '' : sharedCtorRoute.path;

                app[route.verb]((sharedCtorRoutePath + routePath) || '/', function (req, res, next) {
                  var ctx = new Context(req, res, method);

                  // invoke the shared constructor to get an instance
                  ctx.invoke(method, method.sharedCtor, function (err, inst) {
                    if(err) return next(err);

                    ctx.instance = inst;

                    remotes.execHooks('before', method, inst, ctx, function (err) {
                      if(err) {
                        next(err);
                      } else {
                        // invoke the instance method
                        ctx.invoke(inst, method, function (err, result) {
                          if(err) return next(err);

                          ctx.result = result;
                          remotes.execHooks('after', method, inst, ctx, function (err) {
                            if(err) {
                              next(err);
                            } else {
                              ctx.done();
                            }
                          });
                        });
                      }
                    });
                  }, true);
                });
              });
          }
        });
    });

    app.use(function (err, req, res, next) {
      if(err && err.statusCode) {
        res.statusCode = err.statusCode;
      }

      debug('Error in %s %s: %s', req.method, req.url, err.message);
      res.send({
        error: err.message
      });
    });

    adapter
      .getRoutes(sc)
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

  return root;
}


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
