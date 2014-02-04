//
//  SecondViewController.m
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/24/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "SecondViewController.h"
#import "piBeacon.h"

// TableView Cell Identifier
static NSString * const kCellIdentifier = @"iBeaconCell";

@interface SecondViewController ()

@property (weak, nonatomic) IBOutlet UISwitch *switchAdvertising;
@property (weak, nonatomic) IBOutlet UISwitch *switchRanging;
@property (weak, nonatomic) IBOutlet UITextField *textFieldUUID;
@property (weak, nonatomic) IBOutlet UITextField *textFieldBeaconRegionID;
@property (weak, nonatomic) IBOutlet UITableView *myTableView;


@property (strong, nonatomic) piBeacon *piBeacon;

@property ( strong, nonatomic ) NSArray *tableData;
@property (nonatomic, strong) CLBeaconRegion *beaconRegion;
@property (nonatomic, strong) CBPeripheralManager *peripheralManager;
@property (nonatomic, strong) CLLocationManager *locationManager;

@end

@implementation SecondViewController

- (NSArray *) tableData
{
    if (! _tableData ) _tableData = [[NSArray alloc] init];
    return _tableData;
}

- (piBeacon *) piBeacon
{
    if (! _piBeacon ) {
        _piBeacon = [[piBeacon alloc] init];
        [_piBeacon initWithConfig:@"87209302-C7F2-4D56-B1D1-14EADD0CE41F" beaconRegionId:@"org.pibeacon" beaconMajor:1 beaconMinor:1];
    }
    return _piBeacon;
}



#pragma mark - Beacon ranging
- (void)createBeaconRegion
{
    if (self.beaconRegion)
        return;
    
    NSUUID *proximityUUID = [[NSUUID alloc] initWithUUIDString:self.piBeacon.piUUID];
    self.beaconRegion = [[CLBeaconRegion alloc] initWithProximityUUID:proximityUUID identifier:self.piBeacon.piRegionIdentifier];
}

- (void)turnOnRanging
{
    if (![CLLocationManager isRangingAvailable]) {
        self.switchRanging.on = NO;
        return;
    }
    if (self.locationManager.rangedRegions.count > 0) {
        return;
    }
    
    [self createBeaconRegion];
    [self.locationManager startRangingBeaconsInRegion:self.beaconRegion];
}


- (void)changeRangingState:sender
{
    UISwitch *theSwitch = (UISwitch *)sender;
    if (theSwitch.on) {
        [self startRangingForBeacons];
    } else {
        [self stopRangingForBeacons];
    }
}

- (void)startRangingForBeacons
{
    self.locationManager = [[CLLocationManager alloc] init];
    self.locationManager.delegate = self;
    self.locationManager.activityType = CLActivityTypeFitness;
    self.locationManager.distanceFilter = kCLDistanceFilterNone;
    self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
    
    [self turnOnRanging];
}

- (void)stopRangingForBeacons
{
    if (self.locationManager.rangedRegions.count == 0) {
        return;
    }
    
    [self.locationManager stopRangingBeaconsInRegion:self.beaconRegion];
    
    self.tableData = nil;
    [self.myTableView reloadData];
}

#pragma mark - Beacon ranging delegate methods
- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    if (![CLLocationManager locationServicesEnabled]) {
        self.switchRanging.on = NO;
        return;
    }
    
    if ([CLLocationManager authorizationStatus] != kCLAuthorizationStatusAuthorized) {
        self.switchRanging.on = NO;
        return;
    }
    
    self.switchRanging.on = YES;
}

- (void)locationManager:(CLLocationManager *)manager didRangeBeacons:(NSArray *)beacons
               inRegion:(CLBeaconRegion *)region {
    
    if ([beacons count] == 0) {
        //NSLog(@"No beacons found nearby.");
    } else {
        //NSLog(@"Found beacons! %@", region.identifier);
    }
    
    //MAS Todo startEngagement
    // ModelEngagement *engagement = [self engagementFactory:self.piBeacon.piUUID];
    // engagement.iBeaconRegionIdentifier = region.identifier;
    
    self.tableData = beacons;
    [self.myTableView reloadData];
}

#pragma mark - Beacon advertising
- (void)turnOnAdvertising
{
    if (self.peripheralManager.state != 5) {
        self.switchAdvertising.on = NO;
        return;
    }
    
    CLBeaconRegion *region = [[CLBeaconRegion alloc] initWithProximityUUID:self.beaconRegion.proximityUUID
                                                                     major: self.piBeacon.piMajor
                                                                     minor: self.piBeacon.piMinor
                                                                identifier:self.beaconRegion.identifier];
    
    NSDictionary *beaconPeripheralData = [region peripheralDataWithMeasuredPower:nil];
    [self.peripheralManager startAdvertising:beaconPeripheralData];
}


- (void)changeAdvertisingState:sender
{
    UISwitch *theSwitch = (UISwitch *)sender;
    if (theSwitch.on) {
        [self startAdvertisingBeacon];
    } else {
        [self stopAdvertisingBeacon];
    }
}


- (void)startAdvertisingBeacon
{
    [self createBeaconRegion];
    
    if (!self.peripheralManager)
        self.peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil options:nil];
    
    [self turnOnAdvertising];
}

- (void)stopAdvertisingBeacon
{
    [self.peripheralManager stopAdvertising];
}

#pragma mark - Beacon advertising delegate methods
- (void)peripheralManagerDidStartAdvertising:(CBPeripheralManager *)peripheralManager error:(NSError *)error
{
    if (error) {
        self.switchAdvertising.on = NO;
        return;
    }
    
    if (peripheralManager.isAdvertising) {
        self.switchAdvertising.on = YES;
    }
}

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheralManager
{
    if (peripheralManager.state != 5) {
        self.switchAdvertising.on = NO;
        return;
    }
    [self turnOnAdvertising];
}


#pragma mark - UITableView Delegate
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.tableData count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    CLBeacon *beacon = self.tableData[indexPath.row];
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kCellIdentifier];
    
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:kCellIdentifier];
    }
    
    cell.textLabel.text = beacon.proximityUUID.UUIDString;
    
    NSString *proximityString;
    switch (beacon.proximity) {
        case CLProximityNear:
            proximityString = @"Near";
            break;
        case CLProximityImmediate:
            proximityString = @"Immediate";
            break;
        case CLProximityFar:
            proximityString = @"Far";
            break;
        case CLProximityUnknown:
        default:
            proximityString = @"Unknown";
            break;
    }
    cell.detailTextLabel.text = [NSString stringWithFormat:@"%@, %@ • %@ • %f • %li",
                                 beacon.major.stringValue,
                                 beacon.minor.stringValue,
                                 proximityString,
                                 beacon.accuracy,
                                 (long)beacon.rssi];
    cell.detailTextLabel.textColor = [UIColor grayColor];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath{
    
	piBeaconDetailViewController *detailController = [[piBeaconDetailViewController alloc] init];
    detailController.model = [self.tableData objectAtIndex:indexPath.row];
    [self.tabBarController presentViewController: detailController animated:YES completion:nil];
    
}

-(void) tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath
{
    //myCell *cell = [tableView cellForRowAtIndexPath:indexPath];
	//cell.customHelpButton.hidden = true;
    
    piBeaconDetailViewController *detailController = [[piBeaconDetailViewController alloc] init];
    detailController.model = [self.tableData objectAtIndex:indexPath.row];
    [self.tabBarController presentViewController: detailController animated:YES completion:nil];
}

/*
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    if ([segue.identifier isEqualToString:@"showDetail"]) {
        
        NSInteger row = [[self myTableView].indexPathForSelectedRow row];
        NSObject *rowObject = [[self tableData] objectAtIndex:row];
        
        piBeaconDetailViewController *detailController = segue.destinationViewController;
        detailController.model = rowObject;
    }
}
*/


- (void)viewDidLoad
{
    [super viewDidLoad];
    
    self.textFieldUUID.text = self.piBeacon.piUUID;
    self.textFieldBeaconRegionID.text = self.piBeacon.piRegionIdentifier;
    
    [self.switchAdvertising addTarget:self action:@selector(changeAdvertisingState:) forControlEvents:UIControlEventValueChanged];
    [self.switchRanging addTarget:self action:@selector(changeRangingState:) forControlEvents:UIControlEventValueChanged];

}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
