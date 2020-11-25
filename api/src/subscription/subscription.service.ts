import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { Node, Transaction } from 'neo4j-driver';
import { Neo4jService } from '../neo4j/neo4j.service';

export type Subscription = Node

export const STATUS_PENDING = 'pending'
export const STATUS_ACTIVE = 'active'
export const STATUS_CANCELLED = 'cancelled'

export type SubscriptionStatus = typeof STATUS_PENDING | typeof STATUS_ACTIVE

@Injectable()
export class SubscriptionService {

    constructor(private readonly neo4jService: Neo4jService) {}

    async createSubscription(databaseOrTransaction: string | Transaction, user: User, planId: number, days: number = null, status: SubscriptionStatus = STATUS_PENDING, orderId: string = null): Promise<Subscription> {
        const userId: string = user.getId()
        const res = await this.neo4jService.write(`
            MATCH (u:User {id: $userId})
            MATCH (p:Plan {id: $planId})
            CREATE (u)-[:PURCHASED]->(s:Subscription {
                id: randomUUID(),
                status: $status,
                orderId: $orderId,
                expiresAt: datetime() + CASE WHEN $days IS NOT NULL
                    THEN duration('P'+ $days +'D')
                    ELSE p.duration END,
                renewsAt: datetime() + CASE WHEN $days IS NOT NULL
                    THEN duration('P'+ $days +'D')
                    ELSE p.duration END
            })-[:FOR_PLAN]->(p)
            RETURN s
        `, { userId, planId: this.neo4jService.int(planId), days, status, orderId }, databaseOrTransaction)

        return res.records[0].get('s')
    }

    setStatusByOrderId(orderId: string, status: SubscriptionStatus) {
        return this.neo4jService.write(`
            MATCH (s:Subscription { orderId: $orderId })-[:FOR_PLAN]->(p)
            SET s.status = $status,
                s.expiresAt = datetime() + p.duration,
                s.renewsAt = datetime() + p.duration,
                s.updatedAt = datetime()
            RETURN s
        `, { orderId, status })
            .then(res => res.records[0].get('s'))
    }

    async cancelSubscription(id: string) {
        return this.neo4jService.write(`
            MATCH (s:Subscription)
            SET s.status = $status
            REMOVE s.renewsAt
            RETURN s
        `, { status: STATUS_CANCELLED })
            .then(res => res.records[0].get('s'))
    }

}
