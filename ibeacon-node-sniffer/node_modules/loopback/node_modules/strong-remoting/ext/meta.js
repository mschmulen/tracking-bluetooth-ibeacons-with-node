/**
 * Expose the `Meta` plugin.
 */
module.exports = Meta;

/**
 * Module dependencies.
 */
var Remoting = require('../');

/**
 * Create a remotable Meta module for plugging into `RemoteObjects`.
 */
function Meta(remotes, options) {
  // Unfold options.
  var name = (options && options.name) || 'meta';

  // We need a temporary REST adapter to discover our available routes.
  var adapter = remotes.handler('rest').adapter;
  var extension = {};
  var helper = Remoting.extend(extension);

  helper.method(routes, { returns: { type: 'object', root: true }});
  function routes(callback) {
    callback(null, adapter.allRoutes());
  }

  helper.method(classes, { returns: { type: 'object', root: true }});
  function classes(callback) {
    callback(null, remotes.classes());
  }

  remotes.exports[name] = extension;
  return extension;
}
