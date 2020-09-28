import { Node } from "neo4j-driver";

export class User {
    constructor(private readonly node: Node) {}

    getId(): string {
        return (<Record<string, any>> this.node.properties).id
    }

    getPassword(): string {
        return (<Record<string, any>> this.node.properties).password
    }

    toJson(): Record<string, any> {
        const { id, email, dateOfBirth, firstName, lastName } = <Record<string, any>> this.node.properties

        return { id, email, dateOfBirth, firstName, lastName }
    }
}