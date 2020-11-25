import { Node } from "neo4j-driver";
import { Subscription } from "../subscription/subscription.entity";

export class User {
    constructor(private readonly node: Node, private readonly subscription: Subscription | undefined = undefined) {}

    getId(): string {
        return (<Record<string, any>> this.node.properties).id
    }

    getPassword(): string {
        return (<Record<string, any>> this.node.properties).password
    }

    toJson(): Record<string, any> {
        const { id, email, dateOfBirth, firstName, lastName } = <Record<string, any>> this.node.properties
        const subscription = this.subscription ? this.subscription.toJson() : undefined

        return { id, email, dateOfBirth, firstName, lastName, subscription }
    }
}