//
//  ModelEngagement.m
//  herald
//
//  Created by Matt Schmulen on 10/28/13.
//  Copyright (c) 2013 Matt Schmulen. All rights reserved.
//

#import "ModelEngagement.h"


@implementation ModelEngagement

@synthesize engagementID;

- (id)init {
    if(self = [super init]) {
        self.engagementID = CFUUIDCreate(NULL);
    }
    
    return self;
}

@end
