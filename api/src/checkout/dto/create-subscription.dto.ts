import { IsNotEmpty, IsNumber } from 'class-validator'

export class CreateSubscriptionDto {

    @IsNotEmpty()
    @IsNumber()
    planId: number;

}