var events = require('events')
	, JSONStream = require('JSONStream')
	, util = require('util');

/**
 * Basic event emitter that interacts with a stream
 */

function SendEmitter () {
	events.EventEmitter.call(this);

	// Handle ready state
	var ready = false;
	this.buffer = [];
	this.__defineSetter__('ready', function (v) {
		var step;
		ready = v;
		if (ready) {
			while (step = this.buffer.shift()) step();
		}
	});
	this.__defineGetter__('ready', function () {
		return ready;
	});

	// Create queue
	this.queue = [];

	// Handle shared session store data
	this.session = {};
	this.on('_set', this._set);
}
util.inherits(SendEmitter, events.EventEmitter);
module.exports = SendEmitter;

/**
 * Set a property of the shared data structure between the server and client
 *
 * @param {mixed} [key] [String key to assign value to, or key/value pair hash]
 * @param {mixed} [val] [Value to assign to designated key, ignored for hashes]
 */

SendEmitter.prototype.set = function (key, val) {
	this.emit('_set', key, val);
	this._send('_set', key, val);
};

/**
 * Get value of share data property
 * 
 * @param  {string} key [Name of shared property to access]
 */

SendEmitter.prototype.get = function (key) {
	return key ? this.session[key] : this.session;
};

/**
 * Synchronize session state with remote stream
 */

SendEmitter.prototype.syncSession = function () {
	this._send('_set', this.session);
};

/**
 * Set local session values
 *
 * @param {mixed} [key] [String key to assign value to, or key/value pair hash]
 * @param {mixed} [val] [Value to assign to designated key, ignored for hashes]
 */

SendEmitter.prototype._set = function (key, val) {
	if (typeof key === 'string')  {
		this.session[key] = val;
		return;
	}

	for (var i in key) {
		this.session[i] = key[i];
	}
};

/**
 * Attach a stream to interact with
 * 
 * @param  {Stream} stream [Stream to interact with]
 */

SendEmitter.prototype.attach = function (stream) {
	var ev = this;

	// Create new parser and serializer
	this.serializer = JSONStream.stringify();
	this.parser = JSONStream.parse([true]);
	this.parser.on('data', function (args) {
		ev.emit.apply(ev, args);
	});

	// Attach stream
	this.stream = stream;

	// Start pipes
	this.serializer.pipe(stream).pipe(this.parser);
};

/**
 * Queue event to be sent to the server
 *
 * @param {string} [eventName] [Name of event to emit on the server]
 * @param {mixed}  [...]       [All following arguments are passed to receiver]
 */

SendEmitter.prototype.send = function () {
	var args = Array.prototype.slice.call(arguments);
	if (this.ready) return this._send.apply(this, args);
	
	var ev = this;
	this.buffer.push(function () {
		ev._send.apply(ev, args);
	});
};

/**
 * Explicitly send data, regardless of ready state
 *
 * @param {string} [eventName] [Name of event to emit on the server]
 * @param {mixed}  [...]       [All following arguments are passed to receiver]
 */

SendEmitter.prototype._send = function () {
	var args = Array.prototype.slice.call(arguments);
	this.serializer.write(args);
};