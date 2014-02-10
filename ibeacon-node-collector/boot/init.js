
var loopback = require('loopback');
var app = require('../app');

var ibeacon = app.models.ibeacon;
var Bleacon = require('bleacon');
var ibeaconCache = new Array();

Bleacon.on('discover', function(bleacon) {
	//console.log( bleacon );
	
	var dbID = 0;
	var guid = bleacon.uuid + bleacon.major + bleacon.minor;
	if ( guid in ibeaconCache ) { dbID = ibeaconCache[guid]; }
	
	ibeacon.upsert(
			{ id: dbID , guid:guid, uuid:bleacon.uuid, major:bleacon.major, minor:bleacon.minor},
			function( error, _ibeacon) 
			{
				ibeaconCache[guid] = _ibeacon.id;
				if ( error ) { console.log( "error on upsert " ); }
				else {
					//console.log( "upsert - :" + _ibeacon.id  +  " guid " + _ibeacon.guid );
					var eng = app.models.engagement;
					eng.create({ pBeaconID: _ibeacon.id, timestamp: Date.now(), rssi: bleacon.rssi, proximity: bleacon.proximity });
				} //end else success
		}); //end upser
	
    var signal = [bleacon.rssi/5];
    var xs = new Array(Math.floor(-bleacon.rssi/2) + 1).join('x');
    console.log("rssi:" +xs);
    	
});//end on discover

Bleacon.startScanning();
