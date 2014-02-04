var samples = require('../samples');
var tiers = require('../loopbackTiers');
var proxy = require('../proxy');
var _ = require('underscore');
var topFunctions = require('../topFunctions');

var commands = {
  create: 'create',
  findOrCreate: 'find_or_create',
  exists: 'exists',
  find: 'find',
  findById: 'find_by_id',
  remove: 'remove',
  removeById: 'remove_by_id',
  count: 'count'
};

var instanceCommands = {
  save: 'save',
  remove: 'remove',
  updateAttribute: 'update_attribute',
  updateAttributes: 'update_attributes',
  reload: 'reload'
};

module.exports = function (juggler) {
  var dao = juggler.Schema.DataAccessObject;

  function createPatcher(obj) {
    return function patch(command) {
      var _old = dao[command];
      proxy.before(obj, command, function (obj, args) {
        var cmd = commands[command];
        var timer = samples.timer('DataAccessObject', cmd);
        proxy.callback(args, -1, function (obj, args, extra, graph, currentNode) {
          timer.end();
          topFunctions.add('juggler_call', 'Query goes here', timer.ms);
          tiers.sample('dao', timer);
        });
      });
      _.extend(dao[command], _old);
    };
  }

  Object.keys(commands).forEach(createPatcher(dao));
  Object.keys(instanceCommands).forEach(createPatcher(dao.prototype));
};
