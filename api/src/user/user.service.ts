import { Injectable, NotFoundException } from '@nestjs/common';
import { Node, types, Transaction } from 'neo4j-driver'
import { Neo4jService } from '../neo4j/neo4j.service';
import { EncryptionService } from '../encryption/encryption.service';
import { User } from './user.entity';
import { STATUS_ACTIVE } from '../subscription/subscription.service';
import { Subscription } from '../subscription/subscription.entity';



@Injectable()
export class UserService {

    constructor(
        private readonly neo4jService: Neo4jService,
        private readonly encryptionService: EncryptionService
    ) {}


    private hydrate(res): User {
        if ( !res.records.length ) {
            return undefined
        }

        const user = res.records[0].get('u')
        const subscription = res.records[0].get('subscription')

        return new User(
            user,
            subscription ? new Subscription(subscription.subscription, subscription.plan) : undefined
        )
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const res = await this.neo4jService.read(`
            MATCH (u:User {email: $email})
            RETURN u,
                [ (u)-[:PURCHASED]->(s)-[:FOR_PLAN]->(p) WHERE s.expiresAt > datetime() AND s.status = $status | {subscription: s, plan: p } ][0] As subscription
        `, { email, status: STATUS_ACTIVE })

        return this.hydrate(res)
    }

    async create(databaseOrTransaction: string | Transaction, email: string, password: string, dateOfBirth: Date, firstName?: string, lastName?: string): Promise<User> {
        const res = await this.neo4jService.write(`
            CREATE (u:User)
            SET u += $properties, u.id = randomUUID()
            RETURN u,
                [ (u)-[:PURCHASED]->(s)-[:FOR_PLAN]->(p) WHERE s.expiresAt > datetime() AND s.status = $status | {subscription: s, plan: p } ][0] As subscription
        `, {
            properties: {
                email,
                password: await this.encryptionService.hash(password),
                dateOfBirth: types.Date.fromStandardDate(dateOfBirth),
                firstName,
                lastName,
            },
            status: STATUS_ACTIVE,
        }, databaseOrTransaction)

        return this.hydrate(res)
    }

}
