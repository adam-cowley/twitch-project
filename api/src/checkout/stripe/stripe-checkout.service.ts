import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { Neo4jService } from "../../neo4j/neo4j.service";
import { Plan } from "../../subscription/plan.entity";
import { STATUS_ACTIVE, STATUS_PENDING, SubscriptionService } from "../../subscription/subscription.service";
import { User } from "../../user/user.entity";
import { CheckoutService, Transaction } from "../checkout.service";

export class StripeCheckoutService implements CheckoutService {

    private readonly stripe: Stripe

    constructor(
        private readonly configService: ConfigService,
        private readonly subscriptionService: SubscriptionService

    ) {
        this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), { apiVersion: this.configService.get('STRIPE_API_VERSION') })
    }


    async createSubscriptionTransaction(user: User, plan: Plan): Promise<Transaction> {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    // @ts-ignore
                    price: plan['node'].properties.stripePriceId,
                    quantity: 1
                }
            ],
            success_url: 'http://localhost:8080/subscribe/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:8080/subscribe/cancelled',
        })

        // Create Temporary Subscription
        await this.subscriptionService.createSubscription(undefined, user, plan.getId(), plan.getDuration().days, STATUS_PENDING, session.id)

        return session
    }


    // createTransaction(userId: string, plan: Plan): Promise<Transaction> {
    //     return this.stripe.checkout.sessions.create({
    //         mode: 'subscription',
    //         payment_method_types: ['card'],
    //         line_items: [ { price: plan.getPrice().toString(), quantity: 1 }],
    //         success_url: 'http://localhost:8080/subscribe/success',
    //         cancel_url: 'http://localhost:8080/subscribe/cancelled',
    //     })
    // }

    async verifyTransaction(id: string): Promise<Transaction> {
        const session = await this.stripe.checkout.sessions.retrieve(id)

        if ( session.payment_status === 'paid') {
            await this.subscriptionService.setStatusByOrderId(id, STATUS_ACTIVE)
        }

        return session
    }


}