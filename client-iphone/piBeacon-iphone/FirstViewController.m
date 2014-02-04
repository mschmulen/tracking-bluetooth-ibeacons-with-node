//
//  FirstViewController.m
//  piBeacon-iphone
//
//  Created by Matt Schmulen on 12/24/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "FirstViewController.h"

@interface FirstViewController () <UICollisionBehaviorDelegate>

@property ( nonatomic ) UIDynamicAnimator* animator;
@property ( nonatomic ) UIGravityBehavior* gravity;
@property ( nonatomic ) UICollisionBehavior* collisionBehavior;

@end

@implementation FirstViewController

- (IBAction)actionTest:(id)sender {
    NSLog(@"action Test");
    
    [piBeacon simulateProximityEvent];
    
    // piBeaconProximityAlertViewController* vController = [[piBeaconProximityAlertViewController alloc] init];
    //[self presentViewController:vController animated:YES completion:nil];
}

- (void) receiveNewEngagementNotification:(NSNotification *) notification
{
    NSLog (@"Successfully received notification!");
    
    if ([[notification name] isEqualToString:notification_NewEngagement]){
        NSLog (@"Successfully received the engagement notification!");
        
        piBeaconProximityAlertViewController* vController = [[piBeaconProximityAlertViewController alloc] init];
        [self presentViewController:vController animated:YES completion:nil];
    }
    
    //ModelEngagement *engagement = notification.object;
    //[self.tableData addObject:engagement];
    //[self.myTableView reloadData];
}

-(void)collisionBehavior:(UICollisionBehavior *)behavior beganContactForItem:(id<UIDynamicItem>)item withBoundaryIdentifier:(id<NSCopying>)identifier atPoint:(CGPoint)p
{
    // Lighten the background color when the view is in contact with a boundary.
    [(UIView*)item setBackgroundColor:[UIColor lightGrayColor]];
}


-(void)collisionBehavior:(UICollisionBehavior *)behavior endedContactForItem:(id<UIDynamicItem>)item withBoundaryIdentifier:(id<NSCopying>)identifier
{
    // Restore the default color when ending a contcact.
    [(UIView*)item setBackgroundColor:[UIColor grayColor]];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
    
    //[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receiveNewEngagementNotification:) name:notification_NewEngagement object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receiveNewEngagementNotification:) name:notification_NewEngagement object:nil];

    // ------------------
    //Configure dynamics
    //configure
    //_animator = [[UIDynamicAnimator alloc] initWithReferenceView:self.view];
    //_gravity = [[UIGravityBehavior alloc] initWithItems:@[self.imageViewBeaconNotify]];
    
    //configure the collision behavior
    //_collisionBehavior = [[UICollisionBehavior alloc] initWithItems:@[self.imageViewBeaconNotify]];
    //_collisionBehavior.translatesReferenceBoundsIntoBoundary = YES;
    
    //run the animation
    //[_animator addBehavior:_gravity];
    //[_animator addBehavior:_collisionBehavior];
    //_collisionBehavior.collisionDelegate = self;
    // ------------------
    
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
