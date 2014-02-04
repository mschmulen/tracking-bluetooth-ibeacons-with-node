node-xpc-connection
===================

Connection binding for node.js

Supported data types
==================

 * int32/uint32
 * string
 * array
 * buffer
 * uuid
 * object

Example
=======

```
var XpcConnection = require('xpc-connection');

var xpcConnection = new XpcConnection('<Mach service name>');

xpcConnection.on('error', function(message) {
    ...
});

xpcConnection.on('event', function(event) {
    ...
});

xpcConnection.setup();

var mesage = {
    ... 
};

xpcConnection.sendMessage(mesage);

```
