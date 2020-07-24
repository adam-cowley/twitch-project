import { Controller, Post, Body, UseGuards, Request, Get, UseInterceptors } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { Neo4jErrorInterceptor } from '../neo4j/neo4j-error.interceptor';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    @Post('register')
    async postRegister(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.create(
            createUserDto.email,
            createUserDto.password,
            new Date(createUserDto.dateOfBirth),
            createUserDto.firstName,
            createUserDto.lastName
        )

        await this.subscriptionService.createSubscription(user, 0)

        return await this.authService.createToken(user)
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async postLogin(@Request() request) {
        return await this.authService.createToken(request.user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('user')
    async getUser(@Request() request) {
        const { id, email, dateOfBirth, firstName, lastName } = request.user.properties
        return {
            id, email, firstName, lastName,
            dateOfBirth: (new Date(dateOfBirth)).toISOString()
        }
    }
}
