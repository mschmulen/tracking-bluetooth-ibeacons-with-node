
UNSTABLE - WORK IN PROGRESS

Tracking mobile iBeacons and BlueTooth Low Energy engagements with Node.js
--

rough demo and draft https://github.com/mschmulen/tracking-bluetooth-ibeacons-with-node###WhatBluetooth Low Energy(BLE) ‘beacons’ have come into the world around us.  iBeacon is Apple’s branded convention and integration of Bluetooth LE into 3 core ‘location’ features: broadcast, monitoring and ranging.iBeacon is primarily a location service similar to GPS location revolution that has made mobile devices so valuable. Unlike GPS which gives gives devices 'vicinity' awareness (limited to outdoor scenarios that have line of sight to GPS satellites), BLE iBeacon’s gives devices 'proximity' awareness.###Your phone is your signatureThe branding and assimilation of BLE iBeacons into Apples iOS7 platform is causing a proliferation of Bluetooth ‘beaconing’ technology. Large implementations of the technology such as MLB's installation into ball parks , and PayPal's Beacon payment system are making facilities and locations smart. Startups like estimote, Brick Trends, Pebble are making it easier for developers and businesses to integrate the technology into their customers’ daily lives and their mobile app’s.  The technology is poised to forever change kiosks, retail end-caps, payment terminals and the facilities around us. Historically these engagement touch points were blind, dumb and mute to your mobile device. Effectively the urinal in the men's bathroom is smarter than your average retail kiosk; at least the urinal knew to flush when you stepped away. iBeacons will make facilities, displays and the devices that power them aware of the mobile device ( and user ) in front of them, and more importantly give insight into the previously dark world of “in store” behavior and engagement analytics.###Why - AwarenessWhen you open am iBeacon enabled mobile app your Blue Tooth ‘signature' your relative location can be tracked inside the walls of a facility. In a similar way to how a web cookie allows retailers to track your behavior through a web site, you can track ‘engagements’ between a ‘sniffer’ device and the mobile app as proxy to the human holding it.###How – PledgeIt’s very easy to track a Bluetooth device using Node.js on your local machine and track the engagement in a MongoDB for later analysis and reporting.  We can do this using Node.js, LoopBack, and Bleacon in 3 commands and as little as 6 lines of code.###How – DemoYou can build the demo on your own and see it run on a mac book pro (requires Mavericks) with Node.js by simply cloning the repo ‘git clone https://github.com/mschmulen/tracking-bluetooth-ibeacons-with-node’ and running it with ‘slc run app.js’or build it from scratch by following the instructions below:Commands:
```npm install -g strong-clislc lb project myAppcd myAppslc lb model ibeaconslc lb model engagementnpm install -- save bleacon```


Code: 

Add the 10 lines of code below to your app.'s file after line 121 in app.js file, right after ``` app.get('/', loopback.status()); ```  to upsert a beacon engagement and beacon signature into the default in memory data store.
```
var ibeacon = app.models.ibeacon;
var Bleacon = require('bleacon');
var hist = [];

var ibeaconCache = new Array();

Bleacon.on('discover', function(bleacon) {
	
  console.log( "discovered " + bleacon.uuid + " rssi:" + bleacon.rssi );
	
  ibeacon.upsert({ id:bleacon.uuid,uuid:bleacon.uuid, major:bleacon.major, minor:bleacon.minor},
		function( error, _ibeacon) 
		{
			if ( error ) {
				console.log( "error on ibeacon upsert " );
			}
			else {
				var eng = app.models.engagement;
				eng.create({
					cBeaconID: myID,
					pBeaconID: _ibeacon.id,
					timestamp: Date.now(),
					rssi: bleacon.rssi,
					proximity: bleacon.proximity
				});
			} //end else success			
			
		});		
});//end on discover

Bleacon.startScanning();```
Test the implementation by installing an app that uses iBeacons from the from the app store:  The estimates is a good example.###Resolutions – Turn You can install this on a Raspberry-Pi (just follow these instructions) to create a simple “sniffer” device that when plugged into the wall will track all the Bluetooth engagements that occur in your home, office or store.
If you want to persist your analytics data you can simply change the LoopBack model binding in datasources.json to point to a MongoDB instance.###Resolutions – Prestige
Show the dashboard with search and filter.

[image](screenshots/image1.png)

If you want to build your own iOS app you can start with this sample:###Resolutions – MonsterMatch the user to the anon signature. And then get the behavior of the user. If you want to go the extra mile, simply use the built in LoopBack ‘user model object by adding an index reference to the ‘beacon model’. Do this and you convert all the anonymous engagement tracking analytics that you are recording to known user behavior.  This is conversion from an anonymous unknown user BLE iBeacon signature to known user behavior is the reason that retailers want you to open their customer loyalty app in the store and login.  Binding your user profiler to the device and allowing them to track your in store loitering and behavior ( and possibly target engagements at you ) in the same way they track your shopping behaviors online. Whats NextYak yack.


