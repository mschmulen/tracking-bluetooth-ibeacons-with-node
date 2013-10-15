var SendEmitter = require('./send_emitter')
	, util = require('util');

/**
 * Client connection event emitter
 * 
 * @param {net.Socket} socket [Net socket client]
 * @param {net.Server} server [Net server the socket is a client of]
 */

function Connection (socket, server) {
	SendEmitter.call(this);
	this.attach(socket);
	this.socket = socket;

	// Attach session right away
	this.sessionStore = server.sessionStore;
	this.sessionStore.generate(this);

	// Starting a new connection
	this.once('start', this.start);
	socket.once('close', this.disconnect.bind(this));

	// Save session whenever it changes
	this.on('_set', function () {
		this.session.resetMaxAge();
		this.session.save(function (err) {
			if (err) console.error(err.stack);
		});
	});
}
util.inherits(Connection, SendEmitter);
module.exports = Connection;

/**
 * Start a new connection session
 */

Connection.prototype.start = function () {
	if (this.session.sessionID) {
		return this.resume(this.session.sessionID);
	}
	this.set('sessionID', this.sessionID);
	this.ready = true;
	this.emit('connect');
	this.send('connect');
};

/**
 * Resume existing connection session
 * 
 * @param  {string} id [Session id to resume]
 */

Connection.prototype.resume = function (id) {
	var ev = this;

	this.sessionID = this.session.sessionID;
	this.sessionStore.get(id, function (err, session) {
		if (err || ! session) {
			delete ev.session.sessionID;
			return ev.start();
		}
		ev.sessionStore.createSession(ev, session);
		ev.syncSession();
		ev.ready = true;
		ev.emit('connect', true);
		ev.send('connect', true);
	});
};

/**
 * Save session state after a disconnect
 */

Connection.prototype.disconnect = function () {
	this.emit('disconnect');
	this.ready && (this.ready = false);
};

/**
 * Invalidate session
 */

Connection.prototype.invalidateSession = function () {
	var ev = this;
	this.sessionStore.destroy(this.session.sessionID, function (err) {
		ev.send('invalidateSession');
	});
};