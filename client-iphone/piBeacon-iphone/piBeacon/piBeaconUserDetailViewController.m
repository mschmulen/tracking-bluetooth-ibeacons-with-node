//
//  piBeaconUserDetailViewController.m
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/26/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "piBeaconUserDetailViewController.h"

@interface piBeaconUserDetailViewController ()

@end

@implementation piBeaconUserDetailViewController

@synthesize model;


- (IBAction)actionClose:(id)sender {
    
    [self dismissViewControllerAnimated:YES completion:nil];
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
    // Do any additional setup after loading the view from its nib.
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
