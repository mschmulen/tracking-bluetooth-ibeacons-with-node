# strong-remoting

_Communicating between objects, even across processes, should be easy._

It's a common requirement: Objects (and, therefore, data) in your Node
application need to be reachable from other Node processes, browsers, and even
mobile clients. _If it's such a common requirement, shouldn't it be easy?_

Stop worrying about the transport layer while you're developing your
application, and just build.

## Features

 - Make local functions remotable, exported over our Adapters
 - Support for multiple transports, including custom transports
 - Manage (de)serialization to/from JSON
 - Multiple client SDKs, including mobile clients

#### Server Support

**Node.js** is the only planned server environment. This may change in the
future if there is demand for other implementations.

#### Client SDK Support

For higher-level transports, such as REST and Socket.IO, existing clients will
work well. If you want to be able to swap out your transport, use one of our
supported clients. The same Adapter model available on the server applies to
clients, so you can switch transports on both the server and all clients without
changing your application-specific code.

 - **iOS** - [Documentation](http://docs.strongloop.com/strong-remoting-clients#ios)
 - **Node.js** - Coming Soon!
 - **HTML5** - Coming Soon!
 - **Java** - Coming Soon!

## Install

```sh
$ npm install strong-remoting
```

## Quick Start

First, let's up a basic `strong-remoting` server with a single remote method,
`user.greet`.

```js
// Create a collection of remote objects.
var remotes = require('strong-remoting').create();

// Export a `user` object.
var user = remotes.exports.user = {
  greet: function (str, callback) {
    callback(null, str + ' world');
  }
};

// Share the `greet` method.
user.greet.shared = true;
user.greet.accepts = { arg: 'str' };
user.greet.returns = { arg: 'msg' };

// Expose it over the REST transport.
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
```

Then, we can invoke `user.greet()` easily with `curl` (or any HTTP client)!

```sh
$ curl http://localhost:3000/user/greet?str=hello
{
  "msg": "hello world"
}
```

## Concepts

### Remote Objects

Most Node applications expose a remotely-available API. strong-remoting allows
you to build your app in vanilla JavaScript and export Remote Objects over the
network the same way you export functions from a module. Since they're just
plain JavaScript Objects, you can always invoke methods on your Remote Objects
locally in JavaScript, whether from tests or other, local Objects.

### Remote Object Collections

The result of `require('strong-remoting').create()`, Collections are responsible
for binding their Remote Objects to transports, allowing you to swap out the
underlying transport without changing any of your application-specific code.

### Adapters

Adapters provide the transport-specific mechanisms to make Remote Objects (and
Collections thereof) available over their transport. The REST Adapter, for
example, handles an HTTP server and facilitates mapping your objects to RESTful
resources. Other Adapters, on the other hand, might provide a less opionated,
RPC-style network interface. Your application code doesn't need to know what
Adapter it's using.

### Hooks

Hooks allow you to run code before Remote Objects are constructed or methods on
those Objects are invoked. For example, you can prevent actions based on context
(HTTP request, User credentials, etc).

```js
// Do something before our `user.greet` example, earlier.
remotes.before('user.greet', function (ctx, next) {
  if((ctx.req.param('password') || '').toString() !== '1234') {
    next(new Error('Bad password!'));
  } else {
    next();
  }
});

// Do something before any `user` method.
remotes.before('user.*', function (ctx, next) {
  console.log('Calling a user method.');
  next();
});

// Do something before a `dog` instance method.
remotes.before('dog.prototype.*', function (ctx, next) {
  var dog = this;
  console.log('Calling a method on "%s".', dog.name);
  next();
});

// Do something after the `speak` instance method.
// NOTE: you cannot cancel a method after it has been called.
remotes.after('dog.prototype.speak', function (ctx, next) {
  console.log('After speak!');
  next();
});

// Do something before all methods.
remotes.before('**', function (ctx, next, method) {
  console.log('Calling:', method.name);
  next();
});

// Modify all returned values named `result`.
remotes.after('**', function (ctx, next) {
  ctx.result += '!!!';
  next();
});
```

See the [before-after example](https://github.com/strongloop/strong-remoting/blob/master/example/before-after.js)
for more info.

### Streams

strong-remoting supports methods that expect or return `Readable` and
`Writeable` streams. This allows you to stream raw binary data such as files
over the network without writing transport-specific behaviour.

#### Example

Just like our Quick Start, we start off by exposing a method of the `fs` Remote
Object, `fs.createReadStream`, over the REST Adapter.

```js
// Create a Collection.
var remotes = require('strong-remoting').create();

// Share some fs module code.
var fs = remotes.exports.fs = require('fs');

// Specifically export the `createReadStream` function.
fs.createReadStream.shared = true;

// Describe the arguments.
fs.createReadStream.accepts = {arg: 'path', type: 'string'};

// Describe the stream destination.
fs.createReadStream.http = {
  // Pipe the returned `Readable` stream to the response's `Writable` stream.
  pipe: {
    dest: 'res'
  }
};

// Expose the Collection over the REST Adapter.
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
```

Then we invoke `fs.createReadStream()` using `curl`.

```sh
$ curl http://localhost:3000/fs/createReadStream?path=some-file.txt
```
