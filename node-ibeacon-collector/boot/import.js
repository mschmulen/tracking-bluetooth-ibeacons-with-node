
var app = require('../app');
var user = app.models.user;
var beacon = app.models.ibeacon;
var eng = app.models.engagement;

// create test users and beacons
user.create(require('./users.json'));
beacon.create(require('./ibeacons.json'));

// random engagments
setInterval(function() {
	eng.create(	{
		"cBeaconGUID": "87209302c7f24d56b1d114eadd0ce41f15",
		"pBeaconGUID": "87209302c7f24d56b1d114eadd0ce41f16",
		"timestamp": 1390063206174,
		"rssi": rand(1, 82),
		"proximity": choose('immediate', 'near', 'far', 'unknown')
	})
}, 2000);

function rand(min, max) {
	return Math.floor((max * Math.random()) + (max - min));
}

function choose() {
	return arguments[rand(0, arguments.length -1)];
}

/*
Find engagments between two beacons:


http://localhost:3000/api/engagements?filter[where][cBeaconID]=beacon-1&filter[where][pBeaconID]=beacon-2

http://localhost:3000/api/engagements?filter[where][cBeaconID]=87209302c7f24d56b1d114eadd0ce41f12&filter[where][pBeaconID]=87209302c7f24d56b1d114eadd0ce41f


*/
