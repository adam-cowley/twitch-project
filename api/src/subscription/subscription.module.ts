import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { SubscriptionService } from './subscription.service';

@Module({
  providers: [SubscriptionService, PlanService],
  exports: [SubscriptionService, PlanService,],
  controllers: [PlanController],

})
export class SubscriptionModule {}
