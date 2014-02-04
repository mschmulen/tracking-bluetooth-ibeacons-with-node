var remotes = require('../../../').create();

/**
 * Example API
 */
remotes.exports.simple = require('./simple');
remotes.exports.contract = require('./contract');
remotes.exports.SimpleClass = require('./simple-class').SimpleClass;
remotes.exports.ContractClass = require('./contract-class').ContractClass;

module.exports = remotes;
