/*!
 * A CRUD-capable model.
 */
var loopback = require('loopback');
var properties = require('./properties');
var config = require('./config');
var beacon = loopback.createModel('beacon', properties, config);
var applications = config.applications || [];

if (config['data-source']) {
  beacon.attachTo(require('../' + config['data-source']));
}

applications.forEach(function (name) {
  var app = require('../' + name);
  app.model(beacon);
});

module.exports = beacon;
