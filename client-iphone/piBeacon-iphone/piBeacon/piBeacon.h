//
//  piBeacon.h
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/26/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ModelEngagement.h"
#import "piBeaconDetailViewController.h"
#import "piBeaconProximityAlertViewController.h"


//Notifications
static NSString * const notification_NewEngagement = @"NewEngagementNotification";
//static NSString * const notification_NewEngagement = @"NewEngagementNotification";
//static NSString * const notification_NewEngagement = @"NewEngagementNotification";

@interface piBeacon : NSObject

-(void) initWithConfig:(NSString *)beaconUUID beaconRegionId:(NSString*) beaconRegionId beaconMajor:(NSInteger)beaconMajor beaconMinor:(NSInteger)beaconMinor;

//Beacon config
@property(nonatomic) NSInteger piMajor;
@property(nonatomic) NSInteger piMinor;
@property(nonatomic) NSString *piUUID;
@property(nonatomic) NSString *piRegionIdentifier;

@property(nonatomic,retain) NSString *strUserName;
@property(nonatomic,retain) NSString *strUserTitle;

+ (void) simulateProximityEvent;

@end
