//
//  iBeaconViewController.h
//  herald
//
//  Created by Matt Schmulen on 10/12/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface iBeaconViewController : UIViewController < UITableViewDelegate, UITableViewDataSource, CLLocationManagerDelegate, CBPeripheralManagerDelegate>

@end
