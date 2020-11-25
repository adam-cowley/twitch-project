import { Controller, Post, Body, UseGuards, Request, Get, UseInterceptors, UsePipes, ValidationPipe, Put, Delete, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { STATUS_ACTIVE, SubscriptionService } from '../subscription/subscription.service';
import { Neo4jTransactionInterceptor } from '../neo4j/neo4j-transaction.interceptor';
import { Transaction } from 'neo4j-driver';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    @UseInterceptors(Neo4jTransactionInterceptor)
    @UsePipes(ValidationPipe)
    @Post('register')
    async postRegister(@Body() createUserDto: CreateUserDto, @Request() req) {
        const transaction: Transaction = req.transaction

        const user = await this.userService.create(
            transaction,
            createUserDto.email,
            createUserDto.password,
            new Date(createUserDto.dateOfBirth),
            createUserDto.firstName,
            createUserDto.lastName
        )

        await this.subscriptionService.createSubscription(transaction, user, 0, 7, STATUS_ACTIVE)

        const { access_token } = await this.authService.createToken(user)

        return {
            ...user.toJson(),
            access_token
        }
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async postLogin(@Request() request) {
        const user = request.user
        const { access_token } = await this.authService.createToken(request.user)

        return {
            ...user.toJson(),
            access_token
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('user')
    async getUser(@Request() request) {
        const { access_token } = await this.authService.createToken(request.user)

        return {
            ...request.user.toJson(),
            access_token,
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('user/subscription')
    async cancelSubscription(@Request() request) {
        if ( !request.user.subscription ) throw new BadRequestException('No active subscriptions for this user')

        await this.subscriptionService.cancelSubscription(request.user.subscription.id)

        return true
    }
}
