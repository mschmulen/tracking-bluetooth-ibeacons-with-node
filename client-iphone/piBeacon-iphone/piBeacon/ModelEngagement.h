//
//  ModelEngagement.h
//  herald
//
//  Created by Matt Schmulen on 10/28/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, BLE_TYPE) { BLE_TYPE_IBEACON, BLE_TYPE_UNKNOWN };

@interface ModelEngagement : NSObject

@property(nonatomic) NSDate *startTime;
@property(nonatomic) NSDate *endTime;

@property(nonatomic) NSString *iBeaconProximityUUID;
@property(nonatomic) NSString *iBeaconRegionIdentifier;

@property(nonatomic) NSNumber *iBeaconProximityMajor;
@property(nonatomic) NSNumber *iBeaconProximityMinor;

@property(nonatomic) BLE_TYPE bleType;

//arc4random()
//http://stackoverflow.com/questions/7363840/using-a-unique-identifier-of-iphone-or-ios-device
//CFUUIDRef theUUID = CFUUIDCreate(NULL);
@property(nonatomic) CFUUIDRef engagementID;

@end
