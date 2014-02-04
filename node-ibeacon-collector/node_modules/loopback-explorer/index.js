/*!
 * Adds dynamically-updated docs as /explorer
 */
var path = require('path');
var loopback = require('loopback');
var swagger = requireLoopbackDependency('strong-remoting/ext/swagger');
var express = requireLoopbackDependency('express');
var STATIC_ROOT = path.join(__dirname, 'public');

module.exports = explorer;

/**
 * Example usage:
 *
 * var explorer = require('loopback-explorer');
 * app.use('/explorer', explorer(app));
 */

function explorer(loopbackApplication, options) {
  var options = options || {};
  var remotes = loopbackApplication.remotes();
  swagger(remotes, options);

  var app = express();
  app.get('/config.json', function(req, res) {
    res.send({
      discoveryUrl: (options.basePath || '') + '/swagger/resources'
    });
  });
  app.use(loopback.static(STATIC_ROOT));
  return app;
}

function requireLoopbackDependency(module) {
  try {
    return require('loopback/node_modules/' + module);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    try {
      // Dependencies may be installed outside the loopback module,
      // e.g. as peer dependencies. Try to load the dependency from there.
      return require(module);
    } catch (errPeer) {
      if (errPeer.code !== 'MODULE_NOT_FOUND') throw errPeer;
      // Rethrow the initial error to make it clear that we were trying
      // to load a module that should have been installed inside
      // "loopback/node_modules". This should minimise end-user's confusion.
      // However, such situation should never happen as `require('loopback')`
      // would have failed before this function was even called.
      throw err;
    }
  }
}
