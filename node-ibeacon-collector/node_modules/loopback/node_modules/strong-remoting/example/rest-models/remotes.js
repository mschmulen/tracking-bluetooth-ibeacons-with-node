/**
 * Dependencies.
 */

var jugglingdb = require('jugglingdb');

/**
 * Create a set of remote classes and export them.
 */

var remotes = module.exports = require('../../').create();

/**
 * Define some models. Remotely export them.
 */

var Schema = require('jugglingdb').Schema;
var schema = new Schema('memory');

var Todo = remotes.exports.post = schema.define('Post', {
    title:     { type: String, length: 255 },
    done:      { type: Boolean },
    date:      { type: Date,    default: function () { return new Date;} },
    changed: { type: Number,  default: Date.now }
});

var User = remotes.exports.user = schema.define('User', {
    name:         String,
    bio:          Schema.Text,
    approved:     Boolean,
    joinedAt:     Date,
    age:          Number
});


// // setup relationships
// User.hasMany(Post,   {as: 'posts',  foreignKey: 'userId'});
// creates instance methods:
// user.posts(conds)
// user.posts.build(data) // like new Post({userId: user.id});
// user.posts.create(data) // build and save

// Post.belongsTo(User, {as: 'author', foreignKey: 'userId'});
// creates instance methods:
// post.author(callback) -- getter when called with function
// post.author() -- sync getter when called without params
// post.author(user) -- setter when called with object

// setup remote attributes
setup(Todo);
setup(User);

// create some test data
User.create({name: 'joe', age: 20});
User.create({name: 'bob', age: 30});
User.create({name: 'jim', age: 40});
User.create({name: 'jan', age: 50});

Todo.create({title: 'hello', done: false});
Todo.create({title: 'foo', done: false});
Todo.create({title: 'lorem', done: true});

// setup custom routes
User.http = {path: '/u'};
Todo.http = {path: '/t'};

// annotate with remotes settings
function setup(Model) {
  Model.sharedCtor = function (id, fn) {
    Model.find(id, fn);
  }
  Model.sharedCtor.shared = true;
  Model.sharedCtor.accepts = {arg: 'id', type: 'string'};
  Model.sharedCtor.http = [
    {path: '/:id', verb: 'get'},
    {path: '/', verb: 'get'}
  ];
  
  Model.prototype.save.shared = true;
  Model.prototype.save.http = [
    {verb: 'post', path: '/'},
    {verb: 'put', path: '/'}
  ];
  Model.all.shared = true;
  Model.all.http = [
    {verb: 'get', path: '/'}
  ];
  Model.all.accepts = [
    {
      arg: 'query',
      type: 'object'
      // http: function (ctx) {
      //   var q = ctx.req.url.split('?')[1];
      //   
      //   if(q) {
      //     q = decodeURIComponent(q);
      //   }
      //   
      //   return JSON.parse(q);
      // }
    }
  ];
}
