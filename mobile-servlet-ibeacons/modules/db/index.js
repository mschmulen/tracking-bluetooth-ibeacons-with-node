/*!
 * An in-memory DataSource for development.
 */
var loopback = require('loopback');

module.exports = loopback.createDataSource({
  connector: loopback.Memory
});
