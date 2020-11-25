import { IsNotEmpty } from "class-validator";

export class VerifySessionDto {
    @IsNotEmpty()
    id: string;
}