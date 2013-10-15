function debug (format, args) {
	if (/uhura/.test(process.env.NODEFLY_DEBUG) ) {
		console.log.apply(console, ['UHURA: ' + format].concat(args || []));
	}
}

function verbose(format, args) {
	var args = ['UHURA: ' + format].concat(args || []);
	if (/uhura_verbose/.test(process.env.NODEFLY_DEBUG) ) {
		console.log.apply(console, args);
	}
}

var Uhura = require('uhura')
	, util = require('util')
	, Url = require('url');

var config = require('./config');

function Transport (options) {
	Uhura.Client.call(this);
	this.setMaxListeners(Infinity);
	this.agent = options.agent;
	this.agentVersion = options.agentVersion;

	this.connect(config.uhura.port, config.uhura.host);
	this.autoReconnect();
	debug('Connecting to: %s:%s', [config.uhura.host, config.uhura.port]);
}
util.inherits(Transport, Uhura.Client);
module.exports = Transport;

['update','instances','topCalls'].forEach(function (type) {
	Transport.prototype[type] = function (update) {
		var self = this;
		self.getSession(function () {
			debug('sending(%s)', [type]);
			verbose('%s', [util.inspect(update)]);
			self.send(type, update);
		});
	};
});

Transport.prototype.getSession = function (callback) {
	var self = this;

	// we already have a session ID
	if (self.get('sessionData')) {
		return callback();
	}

	// we are trying to retrieve the session already just come back later for it
	if (self.retrievingSession) {
		debug('delaying until session available');
		return this.once('newSession', function () {
			process.nextTick(function () {
				self.getSession(callback);
			});
		});
	}

	self.retrievingSession = true;

	this.once('newSession', function (err, session) {
		if (err) {
			console.log('NODEFLY ERROR: could not establish session\n', err);
			self.sessionId = null;
			self.retrievingSession = false;
			return;
		}

		debug('got session');
		self.agent.sessionId = session.sessionId;
		self.agent.appHash = session.appHash;
		self.retrievingSession = false;
		callback();
	});

	debug('requesting session');
	this.send('createSession', {
		appName: this.agent.appName
		, hostname: this.agent.hostname
		, agentVersion: this.agentVersion
		, key: this.agent.key
		, pid: process.pid
	});
};

Transport.init = function (options) {
	var transport = new Transport(options);
	transport.on('connect', function () {
		transport.getSession(function () {});
	});
	return transport;
};

