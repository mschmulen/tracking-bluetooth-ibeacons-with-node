var env = process.env.SL_ENV || 'prod';

var cfg = {
	prod: {
		collectInterval: 60 * 1000,
		metricsInterval: 60 * 1000,
		tiersInterval: 60 * 1000,
		server: process.env.SL_AGENT_COLLECTOR || 'http://collector.nodefly.com:443',
		uhura: { host: 'collector.nodefly.com', port: 4567 }
	},
	dev: {
		collectInterval: 15 * 1000,
		metricsInterval: 15 * 1000,
		tiersInterval: 15 * 1000,
		server: process.env.SL_AGENT_COLLECTOR || 'http://127.0.0.1:4001',
		uhura: { host: '127.0.0.1', port: 4567 }
	}
}

module.exports = cfg[env];