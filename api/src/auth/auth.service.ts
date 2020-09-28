import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly encryptionService: EncryptionService,
        private readonly jwtService: JwtService
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);

        if ( user !== undefined && await this.encryptionService.compare(password, user.getPassword()) ) {
            return user;
        }

        return null;
    }

    async createToken(user: User) {
        // Deconstruct the properties
        const { id, email, dateOfBirth, firstName, lastName } =  user.toJson()

        // Encode that into a JWT
        return {
            access_token: this.jwtService.sign({
                sub: id,
                email, dateOfBirth, firstName, lastName,
            }),
        }
    }

}
