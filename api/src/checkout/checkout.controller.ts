import { Body, Controller, Get, Inject, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanService } from '../subscription/plan.service';
import { CHECKOUT_SERVICE } from './checkout.constants';
import { CheckoutService } from './checkout.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { VerifySessionDto } from './dto/verify-session.dto';

@Controller('checkout')
export class CheckoutController {

    constructor(
        private readonly planService: PlanService,
        @Inject(CHECKOUT_SERVICE) private readonly checkoutService: CheckoutService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('/')
    async createSession(@Request() request, @Body() createSubscriptionDto: CreateSubscriptionDto) {
        const plan = await this.planService.findById(createSubscriptionDto.planId)
        const { id, ...session } = await this.checkoutService.createSubscriptionTransaction(request.user, plan)

        return { id }
    }

    @UseGuards(JwtAuthGuard)
    @Post('/verify')
    async verifySession(@Request() request, @Body() verifySessionDto: VerifySessionDto) {
        const session = await this.checkoutService.verifyTransaction(verifySessionDto.id)

        return session
    }



}
