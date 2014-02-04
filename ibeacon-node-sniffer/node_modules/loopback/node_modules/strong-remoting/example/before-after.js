// create a set of shared classes
var remotes = require('../').create();

// expose a simple object
var user = remotes.exports.user = {
  greet: function (fn) {
    fn(null, 'hello, world!');
  }
};

// share the greet method
user.greet.shared = true;

// expose a simple class
function Dog(name) {
  this.name = name;
}

// define a vanilla JavaScript class
function Dog(name) {
  this.name = name;
}

// add a shared constructor
Dog.sharedCtor = function (name, fn) {
  fn(null, new Dog(name));
}

// define the args for the shared constructor
Dog.sharedCtor.accepts = {arg: 'name', type: 'string'};

// change the default routing
Dog.sharedCtor.http = {path: '/:name'};

// define a regular instance method
Dog.prototype.speak = function (fn) {
  fn(null, 'roof! my name is ' + this.name);
}

Dog.prototype.speak.shared = true;

// expose the dog class
remotes.exports.dog = Dog;

// do something before greet
remotes.before('user.greet', function (ctx, next) {
  if((ctx.req.param('password') || '').toString() !== '1234') {
    next(new Error('bad password!'));
  } else {
    next();
  }
});

// do something before any user method
remotes.before('user.*', function (ctx, next) {
  console.log('calling a user method');
  next();
});

// do something before a dog instance method
remotes.before('dog.prototype.*', function (ctx, next) {
  var dog = this;
  console.log('calling a method on', dog.name);
  next();
});

// do something after the dog speak method
// note: you cannot cancel a method after
// it has been called
remotes.after('dog.prototype.speak', function (ctx, next) {
  console.log('after speak!');
  next();
});

// do something before all methods
remotes.before('**', function (ctx, next, method) {
  console.log('calling', method.name);
  next();
});

// modify all results
remotes.after('**', function (ctx, next) {
  ctx.result += '!!!';
  next();
});

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
  
/*

Test the above with curl or a rest client:
  
  $ node before-after.js
  $ curl http://localhost:3000/user/greet
  $ curl http://localhost:3000/user/greet?password=1234
  $ curl http://localhost:3000/dog/fido/speak
  
*/