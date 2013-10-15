
## Mobile Servlet for Bluetooth Low Energy iBeacons

## Mobile Servlet , App and Hardware for Bluetooth Low Energy iBeacons
## Tracking iOS iBeacons and BlueTooth Low Energy devices with Node.js
## Full Tech stack for Bluetooth Low Energey and iBeacon Technology stack Mobile App, Mobile Servlet and Hardware for Bluetooth Low Energy iBeacons

###TLDR;

- [Steal this impress your friends](#yack )
- [Steal this impress your executive](#yack )
- [Steal this iOS code to build an app](#yack )
- [Steal this server code](#yack )
- [Steal this hardware configuration](#yack )

### What: iBeacons are Apples convention for handling Bluetooth Low Energy devices

iBeacons are Bluetooth Low Energy(BLE) wireless sensors that support a [HID profile schema ](https://developer.bluetooth.org/TechnologyOverview/Pages/HID.aspx); [traditional BLE uses a GATT profile ](http://en.wikipedia.org/wiki/Bluetooth_profile#Attribute_Profile_.28ATT.29). with iBeacons Apple gives convention, libraries and integration into Apple's mobile location services breaking down BLE use case's into 3 core features: broadcast , monitoring and ranging.

iBeacons BLE use case's:
- broadcast 
- monitoring 
- ranging

### What: BLE is Proximity vs Vicinity

Bluetooth Low Energy Energy Beacons have come into their own, with Apple conforming the technology into branded iBeacons; this will inevitable proliferate the technology in many ways; such as  [http://techcrunch.com/2013/09/29/mlbs-ibeacon-experiment-may-signal-a-whole-new-ball-game-for-location-tracking/](MLB installing custom Bluetooth beacons in their parks), [PayPal's Beacon](https://www.paypal.com/us/webapps/mpp/beacon ) , and startups like [estimote](http://estimote.com).  All this Bluetooth support is making your mobile device 'the new endpoint' and your mobile application more of the real world proxy for the user.

leveraging Bluetooth your mobile device can tell how far away you are from a bluetooth beacon.  GPS gave mobile devices the power of vacinity;  your device know where you were in the planet with a neighborhood block accuracy ( provided you had line of sight to a GPS satellite ).  This singular technology gave way to geo fences, location targeted push notifications and ad's, geo caching games and of course everyone's favorite "Dude Where's my Car" mobile apps.  BLE and iBeacons are going to illuminate the dark regions shaded by the light of the GPS line of Sight.  these include in store analytics ( Retail has no idea where you are in their store).

Retail kiosks, end-caps, and counters are blind dump and mute to your mobile device.  Effectively the urinal in the men's bathroom was smarter than your average retail kiosk; at least the urinal knew when you were in front of it and when you stepped away. Bluetooth and iBeacons are going to change all that and make displays aware of the mobile segregate in front of them.

### Why: Stats and market validation : 

With [70 percent of smartphone shoppers use a store locator to plan their shopping trip](http://www.nielsen.com/us/en/newswire/2013/a-mobile-shoppers-journey--from-the-couch-to-the-store--and-back.html); you can count that mobile devices will play an integral roll in store shopping experience.

Retail and real world vendors know the power of Mobile applications, justified by stats such as [Forty-six percent of shoppers say they are less likely to comparison shop when using a mobile app](http://www.comscore.com/Insights/Presentations_and_Whitepapers/2013/Choices_Channels_and_Convenience_Enhancing_the_Online_Shopping_Experience)

Coupling purchases and the fact that ( 25 million Americans use Coupon apps each month )[https://www.npd.com/wps/portal/npd/us/news/press-releases/pr_120523/] and the (prediction that the number of U.S. adult smartphone users who also use mobile coupons will jump to 40.8 million at the end of 2013)[http://www.emarketer.com/Article/Digital-Coupons-Mobile-Give-Cheapskates-Staying-Power/1009847#Jy3uKPRgRE7lZiuJ.99] gives ecosystem opportunity around BLE and ibeacon technology.

Bluetooth enabled accessories are projected to experience massive growth—220 million units this year to nearly 1 billion per year by 2016 (ABI Research)

### How intro :

All Bluetooth Low Energy devices (including iBeacons) are identified via a UUID (Device Identifier).  Devices either operate as Central or  a Peripheral configuration.  The Mobile Application 'Herald' that goes along with this posting can operate as both a Central ( connecting and interacting with Peripheral's in its proximity ) and also as Peripheral allowing other Central's to discover and interact with it.

The users iPhone and Android device acts as an moving blueTooth 'endpoint' in which the dynamic BLE 'network' discovers and connects to the application.  Once the 'Herald' app on the users device connects and interacts with the beacon devices in the word; Herald will report back the interaction ( referred to as an engagement in this sample ) to the server.

Since we want to share and report these interactions platform then your going to need to store the data on the Server.  So I built a small node.js mobile servlet that catches the BLE Beacon engagement and stores the information for later analysis and review.

//s around it; of course there is also a companion Mobile Servlet using Node.js and MongoDB to track interactions.  

If you want to test it out the mobile application is preconfigured to use a staged instance of the server; of course you can also stand up your own supporting server by deploying the LoopBack Node.js Server on your Cloud Provider of choice or on your own machine.

### How mobile client : Herald iPhone Application

The Herald iPhone Application is a simple native iOS application that allows configuration as a Central, a Peripheral or both.
once you download the gitub repo you can run the application from XCode in the simulator ( you will not be able to activate the BlueTooth features unless you have a secondary blueTooth device attached to your dev machine), or install on an iOS device connected to your host machine.

-[IMAGE](Image Ref) -[IMAGE](Image Ref )

the initial splash screen will give you an idea where the app name came from.  The Second tab is where the magic happens.  you can enable your iPhone to to 'Advertise', making your phone look like a Peripheral to other Central devices in the vicinity.   Additionally you can enable 'BLE ranging' and your device will look for other iBeacons and report back the 'range' or proximity of the BLE Peripheral. The TextField below each of the switches shows the identification the device is advertising and ranging as.

#### Building the herald iPhone App

1. Start from simple Tab application

2. Add the iOS frameworkS
    	CoreBluetooth.framework
		CoreLocation.framework	

### How mobile servlet :

1. slc lb project servlet 
2. yack
3. yack
4. yack

### How hardware

If you have 2 iOS7 devices then you can explore the interaction.  Additionally if you have a BlueTooth embedded device such as the 
[Ti cc2540 & cc2541 sensor tag](http://www.ti.com/ww/en/wireless_connectivity/sensortag/index.shtml?DCMP=sensortag&HQS=sensortag-bn) then you can explore the use case as it would be for most real world use cases. Check out the [Ti SensorTag User Guide](http://processors.wiki.ti.com/index.php/SensorTag_User_Guide) for more information on the Ti sensor tag and kit.

[image](ImageRef Sensor Tag )

Also check out some of these BLE device vendors that provide hardware beacon devices:

- AA
- BB
- CC
- DD

#### Additional hardware and kit vendors and platforms
- [redbearlab : iBeacon Beta for BLE Mini] (http://redbearlab.com/ibeacon/)
- http://kontakt.io/

### References 

[Bluetooth devices to gain notification support in iOS 7 & Mavericks with Apple's new APIs](http://appleinsider.com/articles/13/06/13/bluetooth-devices-to-gain-notification-support-in-ios-7-mavericks-with-apples-new-apis)
[With iBeacon, Apple is going to dump on NFC and embrace the internet of things](http://gigaom.com/2013/09/10/with-ibeacon-apple-is-going-to-dump-on-nfc-and-embrace-the-internet-of-things/)
[github.com/manishnath/iBeaconCenter](https://github.com/manishnath/iBeaconCenter)


[How to Make an iBeacon Out of a Raspberry Pi](http://developer.radiusnetworks.com/2013/10/09/how-to-make-an-ibeacon-out-of-a-raspberry-pi.html)

http://stackoverflow.com/questions/16151360/use-bluez-stack-as-a-peripheral-advertiser/19039963#19039963


https://developer.apple.com/library/ios/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/AboutCoreBluetooth/Introduction.html#//apple_ref/doc/uid/TP40013257-CH1-SW1



