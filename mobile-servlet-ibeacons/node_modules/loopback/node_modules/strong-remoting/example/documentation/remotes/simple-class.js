// This example shows using the helper for a type in a "post-definition" style.
var helper = require('../../../').extend(module.exports);

/**
 * A simple class that contains a name.
 */
function SimpleClass(name) {
  this.name = name;
}
helper.type(SimpleClass, {
  description: 'A simple class example',
  accepts: [{ name: 'name', type: 'string', required: true }]
});

/**
 * Returns the SimpleClass instance's name.
 */
SimpleClass.prototype.getName = function(callback) {
  callback(null, this.name);
};
helper.method(SimpleClass.prototype.getName, {
  path: 'SimpleClass.prototype.getName',
  description: 'Returns the SimpleClass instance\'s name.',
  returns: { name: 'name', type: 'string' }
});

/**
 * Takes in a name, returning a greeting for that name.
 */
SimpleClass.prototype.greet = function(other, callback) {
  callback(null, 'Hi, ' + other + '!');
};
helper.method(SimpleClass.prototype.greet, {
  path: 'SimpleClass.prototype.greet',
  description: 'Takes in a name, returning a greeting for that name.',
  accepts: [{ name: 'other', type: 'string', required: true }],
  returns: { name: 'greeting', type: 'string' }
});

/**
 * Returns the SimpleClass prototype's favorite person's name.
 */
SimpleClass.getFavoritePerson = function(callback) {
  callback(null, 'You');
};
helper.method(SimpleClass.getFavoritePerson, {
  path: 'SimpleClass.getFavoritePerson',
  description: 'Returns the SimpleClass prototype\'s favorite person\'s name.',
  returns: { name: 'name', type: 'string' }
});
