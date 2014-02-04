//
//  piBeacon.m
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/26/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "piBeacon.h"


@interface piBeacon ()

@property (nonatomic, assign) NSUserDefaults * userDefaults;

@end

@implementation piBeacon

@synthesize piMajor,piMinor,piUUID,strUserName,strUserTitle;

-(void) initWithConfig:(NSString *)beaconUUID beaconRegionId:(NSString*) beaconRegionId beaconMajor:(NSInteger)beaconMajor beaconMinor:(NSInteger)beaconMinor;
{
    //[NSUserDefaults resetStandardUserDefaults];
    //self.userDefaults = [NSUserDefaults standardUserDefaults];
    
    //create NSUserDefault keys
    time_t t;
    srand((unsigned) time(&t)); //seed the rand with the time
    
    int randomMinor = rand() % 65535;
    
    self.piMajor = beaconMajor; // piBeacon convention is iOS devices are Major = 2;//major;
    self.piMinor = randomMinor;
    self.piUUID = beaconUUID;
    self.piRegionIdentifier = beaconRegionId;
    
    self.strUserName = @"King Harald Bluetooth";
    self.strUserTitle = @"The Last Viking";
    
    NSLog(@"piBeacon region: %@  ", self.piRegionIdentifier);
    NSLog(@"piBeacon uuid:%@", self.piUUID );
    NSLog(@"major: %ld  minor: %ld ", (long)self.piMajor, (long)self.piMinor );
    
    /*
    if(self.userDefaults)
    {
        if([[NSUserDefaults standardUserDefaults] objectForKey:@"strUserName"] == nil) {
            
            //create NSUserDefault keys
            time_t t;
            srand((unsigned) time(&t)); //seed the rand with the time
            
            self.piMajor = rand();
            self.piMinor = rand();
            
            //Set
            [self.userDefaults setInteger: self.piMajor forKey:@"piBeaconProximityMajor"];
            [self.userDefaults setInteger: self.piMinor forKey:@"piBeaconProximityMinor"];
            [self.userDefaults setObject: self.piUUID forKey:@"piBeaconUUID"];
            
            //user defaults
            [self.userDefaults setObject: @"King Harald Bluetooth" forKey:@"strUserName"];
            [self.userDefaults setObject: @"The Last Viking" forKey:@"strUserTitle"];
            
            //Sync the userDefatuls
            //[self.userDefaults synchronize];
        }
        
        //Retrieve
        self.piMajor = [self.userDefaults integerForKey:@"piBeaconProximityMajor"];
        self.piMinor = [self.userDefaults integerForKey:@"piBeaconProximityMinor"];
        self.piUUID = [self.userDefaults stringForKey:@"piBeaconUUID"];
        
        self.strUserName = [self.userDefaults stringForKey:@"strUserName"];
        self.strUserTitle = [self.userDefaults stringForKey:@"strUserTitle"];
    }
    else {
        NSLog(@"applicationDidFinishLaunching: Error reading config file.");
    }
    */
    
}


#pragma mark - Engagment
- (ModelEngagement *) engagementFactory: (NSString*) beaconProximityUUID
{
    ModelEngagement *engagement = [[ModelEngagement alloc] init];
    
    engagement.startTime = [[NSDate alloc] init];
    engagement.endTime = [[NSDate alloc] init];
    
    engagement.iBeaconProximityUUID = beaconProximityUUID;
    engagement.iBeaconRegionIdentifier = self.piRegionIdentifier;
    engagement.bleType = BLE_TYPE_IBEACON;
    
    //[[NSNotificationCenter defaultCenter] postNotificationName:notification_NewEngagement object:engagement];
    
    return engagement;
}//end engagementFactory

- (void) startEngagement
{
    //[self.engagementFactory
    //ModelEngagement *engagement = [self engagementFactory:self.piBeacon.piUUID];
    //engagement.iBeaconRegionIdentifier = region.identifier;
    
    //engagement.iBeaconProximityMajor = region.major;
    //engagement.iBeaconProximityMinor = region.minor;
    //engagement.bleType =
    
}

- (void) endEngagement
{
    
}

+ (void) simulateProximityEvent
{
    NSLog(@"Simulate Proximity Event");
    
    [[NSNotificationCenter defaultCenter] postNotificationName:notification_NewEngagement object:nil];
}



@end
