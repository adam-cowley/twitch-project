import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SubscriptionService } from '../subscription/subscription.service';
import { CHECKOUT_SERVICE } from './checkout.constants';
import { CheckoutController } from './checkout.controller';
import { StripeCheckoutService } from './stripe/stripe-checkout.service';

@Module({
    controllers: [CheckoutController],
    imports: [SubscriptionModule],
    providers: [
        {
            inject: [ ConfigService, SubscriptionService ],
            provide: CHECKOUT_SERVICE,
            useFactory: (configService: ConfigService, subscriptionService: SubscriptionService) => new StripeCheckoutService(configService, subscriptionService),
        },
    ],
})
export class CheckoutModule {

}
