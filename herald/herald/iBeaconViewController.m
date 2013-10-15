//
//  iBeaconViewController.m
//  herald
//
//  Created by Matt Schmulen on 10/12/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "iBeaconViewController.h"

// UUID
static NSString * const kUUID = @"00000000-0000-0000-0000-000000000000";
// Beacon Region Identifier
static NSString * const kIdentifier = @"BeaconRegionIdentifier";
// TableView Cell Identifier
static NSString * const kCellIdentifier = @"TableViewCell";



@interface iBeaconViewController ()
@property (weak, nonatomic) IBOutlet UITextField *textFieldUUID;
@property (weak, nonatomic) IBOutlet UITextField *textFieldBeaconRegionID;

@property (weak, nonatomic) IBOutlet UITableView *myTableView;
@property (weak, nonatomic) IBOutlet UISwitch *switchAdvertising;
@property (weak, nonatomic) IBOutlet UISwitch *switchRanging;

@property ( strong, nonatomic ) NSArray *tableData;

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) CLBeaconRegion *beaconRegion;
@property (nonatomic, strong) CBPeripheralManager *peripheralManager;


@end

@implementation iBeaconViewController

- (NSArray *) tableData
{
    if (! _tableData ) _tableData = [[NSArray alloc] init];
    return _tableData;
}

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

#pragma mark - Beacon ranging
- (void)createBeaconRegion
{
    if (self.beaconRegion)
    return;
    
    NSUUID *proximityUUID = [[NSUUID alloc] initWithUUIDString:kUUID];
    self.beaconRegion = [[CLBeaconRegion alloc] initWithProximityUUID:proximityUUID identifier:kIdentifier];
}

- (void)turnOnRanging
{
    NSLog(@"Turning on ranging...");
    
    if (![CLLocationManager isRangingAvailable]) {
        NSLog(@"Couldn't turn on ranging: Ranging is not available.");
        self.switchRanging.on = NO;
        return;
    }
    
    if (self.locationManager.rangedRegions.count > 0) {
        NSLog(@"Didn't turn on ranging: Ranging already on.");
        return;
    }
    
    [self createBeaconRegion];
    [self.locationManager startRangingBeaconsInRegion:self.beaconRegion];
    
    NSLog(@"Ranging turned on for region: %@.", self.beaconRegion);
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
        NSLog(@"Didn't turn off ranging: Ranging already off.");
        return;
    }
    
    [self.locationManager stopRangingBeaconsInRegion:self.beaconRegion];
    
    self.tableData = nil;
    [self.myTableView reloadData];
    
    NSLog(@"Turned off ranging.");
}

#pragma mark - Beacon ranging delegate methods
- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    if (![CLLocationManager locationServicesEnabled]) {
        NSLog(@"Couldn't turn on ranging: Location services are not enabled.");
        self.switchRanging.on = NO;
        return;
    }
    
    if ([CLLocationManager authorizationStatus] != kCLAuthorizationStatusAuthorized) {
        NSLog(@"Couldn't turn on ranging: Location services not authorised.");
        self.switchRanging.on = NO;
        return;
    }
    
    self.switchRanging.on = YES;
}

- (void)locationManager:(CLLocationManager *)manager didRangeBeacons:(NSArray *)beacons
               inRegion:(CLBeaconRegion *)region {
    if ([beacons count] == 0) {
        NSLog(@"No beacons found nearby.");
    } else {
        NSLog(@"Found beacons!");
    }
    
    self.tableData = beacons;
    [self.myTableView reloadData];
}

#pragma mark - Beacon advertising
- (void)turnOnAdvertising
{
    if (self.peripheralManager.state != 5) {
        NSLog(@"Peripheral manager is off.");
        self.switchAdvertising.on = NO;
        return;
    }
    
    time_t t;
    srand((unsigned) time(&t));
    CLBeaconRegion *region = [[CLBeaconRegion alloc] initWithProximityUUID:self.beaconRegion.proximityUUID
                                                                     major:rand()
                                                                     minor:rand()
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
    NSLog(@"Turning on advertising...");
    
    [self createBeaconRegion];
    
    if (!self.peripheralManager)
        self.peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil options:nil];
    
    [self turnOnAdvertising];
}

- (void)stopAdvertisingBeacon
{
    [self.peripheralManager stopAdvertising];
    
    NSLog(@"Turned off advertising.");
}

#pragma mark - Beacon advertising delegate methods
- (void)peripheralManagerDidStartAdvertising:(CBPeripheralManager *)peripheralManager error:(NSError *)error
{
    if (error) {
        NSLog(@"Couldn't turn on advertising: %@", error);
        self.switchAdvertising.on = NO;
        return;
    }
    
    if (peripheralManager.isAdvertising) {
        NSLog(@"Turned on advertising.");
        self.switchAdvertising.on = YES;
    }
}

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheralManager
{
    if (peripheralManager.state != 5) {
        NSLog(@"Peripheral manager is off.");
        self.switchAdvertising.on = NO;
        return;
    }
    
    NSLog(@"Peripheral manager is on.");
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
    
    UITableViewCell *defaultCell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle
                                                          reuseIdentifier:kCellIdentifier];
    
    defaultCell.textLabel.text = beacon.proximityUUID.UUIDString;
    
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
    defaultCell.detailTextLabel.text = [NSString stringWithFormat:@"%@, %@ • %@ • %f • %li",
                                        beacon.major.stringValue, beacon.minor.stringValue, proximityString, beacon.accuracy, (long)beacon.rssi];
    defaultCell.detailTextLabel.textColor = [UIColor grayColor];
    
    return defaultCell;
    
    /*
    static NSString *simpleTableIdentifier = @"SimpleTableItem";
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:simpleTableIdentifier];
    
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:simpleTableIdentifier];
    }
 
    
    if ( [[ [self.tableData objectAtIndex:indexPath.row] class] isSubclassOfClass:[LBModel class]])
    {
        LBModel *model = (LBModel *)[self.tableData objectAtIndex:indexPath.row];
        //cell.textLabel.text = model[@"name"]; // [model objectForKeyedSubscript:@"name"];
        cell.textLabel.text = [[NSString alloc] initWithFormat:@"%@", [model objectForKeyedSubscript:@"name"] ];
    }
    
    return cell;
    */
}


- (void)viewDidLoad
{
    [super viewDidLoad];
    
    self.textFieldUUID.text = kUUID;
    self.textFieldBeaconRegionID.text = kIdentifier;
    
    [self.switchAdvertising addTarget:self action:@selector(changeAdvertisingState:) forControlEvents:UIControlEventValueChanged];
    [self.switchRanging addTarget:self action:@selector(changeRangingState:) forControlEvents:UIControlEventValueChanged];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
