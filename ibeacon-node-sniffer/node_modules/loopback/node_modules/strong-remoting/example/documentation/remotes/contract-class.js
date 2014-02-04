// This example shows using the helper for a type in a "definitive" fashion.
var helper = require('../../../').extend(module.exports);
var clshelper;

/**
 * A simple class that contains a name, this time with a custom HTTP contract.
 */
clshelper = helper.type(ContractClass, {
  accepts: [{ name: 'name', type: 'string', required: true }],
  http: { path: '/:name' }
});
function ContractClass(name) {
  this.name = name;
}

/**
 * Returns the ContractClass instance's name.
 */
clshelper.method(getName, {
  returns: { name: 'name', type: 'string' }
});
function getName(callback) {
  callback(null, this.name);
}

/**
 * Takes in a name, returning a greeting for that name.
 */
clshelper.method(greet, {
  accepts: [{ name: 'other', type: 'string', required: true }],
  returns: { name: 'greeting', type: 'string' }
});
function greet(other, callback) {
  callback(null, 'Hi, ' + other + '!');
}

/**
 * Returns the ContractClass prototype's favorite person's name.
 */
helper.method(getFavoritePerson, {
  path: 'ContractClass.getFavoritePerson',
  returns: { name: 'name', type: 'string' }
});
function getFavoritePerson(callback) {
  callback(null, 'You');
}
