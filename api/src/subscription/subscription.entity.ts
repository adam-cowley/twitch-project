import { Node } from "neo4j-driver";

export class Subscription {
    constructor(private readonly node: Node, private readonly plan: Node) {}

    toJson() {
        const { stripePriceId, ...plan } = this.plan.properties as Record<string, any>
        return {
            ...this.node.properties,
            plan,
        }
    }
}