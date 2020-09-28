import { Injectable } from '@nestjs/common';
import { Node, types, Transaction } from 'neo4j-driver'
import { Neo4jService } from '../neo4j/neo4j.service';
import { EncryptionService } from '../encryption/encryption.service';
import { User } from './user.entity';



@Injectable()
export class UserService {

    constructor(
        private readonly neo4jService: Neo4jService,
        private readonly encryptionService: EncryptionService
    ) {}

    async findByEmail(email: string): Promise<User | undefined> {
        const res = await this.neo4jService.read(`
            MATCH (u:User {email: $email})
            RETURN u
        `, { email })

        return res.records.length == 1 ? new User( res.records[0].get('u') ) : undefined
    }

    async create(databaseOrTransaction: string | Transaction, email: string, password: string, dateOfBirth: Date, firstName?: string, lastName?: string): Promise<User> {
        const res = await this.neo4jService.write(`
            CREATE (u:User)
            SET u += $properties, u.id = randomUUID()
            RETURN u
        `, {
            properties: {
                email,
                password: await this.encryptionService.hash(password),
                dateOfBirth: types.Date.fromStandardDate(dateOfBirth),
                firstName,
                lastName
            },
        }, databaseOrTransaction)

        return new User( res.records[0].get('u') )
    }

}
