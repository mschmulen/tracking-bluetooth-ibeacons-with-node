//
//  SecondViewController.h
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/24/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface SecondViewController : UIViewController < UITableViewDelegate, UITableViewDataSource, CLLocationManagerDelegate, CBPeripheralManagerDelegate>

@end
