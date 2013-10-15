//
//  BLEViewController.m
//  herald
//
//  Created by Matt Schmulen on 10/12/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "BLEViewController.h"
#import <CoreBluetooth/CoreBluetooth.h>


#define SERVICE_UUID @"2E18F720-6CC5-4B0E-BBEA-6AF44EF5A68C"
#define CHARACTERISTIC_UUID @"B090EAA0-CA33-42BD-9920-374C64B5DF4F"

static NSString * const kCellIdentifier = @"TableViewCell";

@interface BLEViewController () <CBPeripheralManagerDelegate>


@property (strong, nonatomic) CBPeripheralManager *peripheralManager;
@property (strong, nonatomic) CBMutableCharacteristic *transferCharacteristic;
@property (nonatomic, strong) NSMutableArray *centrals;


@property ( strong, nonatomic) NSArray *tableData;

@end


@implementation BLEViewController

- ( NSArray* ) tableData {
    if ( ! _tableData) _tableData = [[NSArray alloc] init];
    return _tableData;
}


#pragma mark - CBPeripheral delegate methods

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral
{
    if (peripheral.state != CBPeripheralManagerStatePoweredOn) {
        return;
    }
    
    NSLog(@"PeripheralManager powered on.");
    
    self.transferCharacteristic = [[CBMutableCharacteristic alloc] initWithType:[CBUUID UUIDWithString: CHARACTERISTIC_UUID] properties:CBCharacteristicPropertyNotify value:nil permissions:CBAttributePermissionsReadable];
    
    CBMutableService *transferService = [[CBMutableService alloc] initWithType:[CBUUID UUIDWithString:SERVICE_UUID] primary:YES];
    
    transferService.characteristics = @[self.transferCharacteristic];
    
    [self.peripheralManager addService:transferService];
    
    [self.peripheralManager startAdvertising:@{ CBAdvertisementDataServiceUUIDsKey : @[[CBUUID UUIDWithString:SERVICE_UUID]], CBAdvertisementDataLocalNameKey : @"EstimoteBeacon" }];
    
    NSLog(@"PeripheralManager is broadcasting (%@).", SERVICE_UUID);
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral central:(CBCentral *)central didSubscribeToCharacteristic:(CBCharacteristic *)characteristic
{
    [_centrals addObject:central];
}




#pragma mark - UITableView delegate methods
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.tableData count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kCellIdentifier];
    
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:kCellIdentifier];
    }
    
    //if ( [[ [self.tableData objectAtIndex:indexPath.row] class] isSubclassOfClass:[LBModel class]])
    {
        cell.textLabel.text = @"yack";
        //LBModel *model = (LBModel *)[self.tableData objectAtIndex:indexPath.row];
        //cell.textLabel.text = model[@"name"]; // [model objectForKeyedSubscript:@"name"];
        //cell.textLabel.text = [[NSString alloc] initWithFormat:@"%@", [model objectForKeyedSubscript:@"name"] ];
    }
    return cell;
}


- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view.
    
    _peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil];
    
    _centrals = [NSMutableArray array];
}

/*
- (void)viewWillDisappear:(BOOL)animated
{
    // stop advertising when view will disappear
    
    [self.peripheralManager stopAdvertising];
    self.peripheralManager = nil;
    
    [super viewWillDisappear:animated];
}
*/


- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
