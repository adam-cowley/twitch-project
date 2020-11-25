import { Node } from "neo4j-driver";


export class Plan {
    constructor(private readonly node: Node, private readonly genres: Node[]) {}

    getId() {
        return (this.node.properties as Record<string, any>).id
    }

    getName() {
        return (this.node.properties as Record<string, any>).name
    }

    getPrice() {
        return (this.node.properties as Record<string, any>).price
    }

    getDuration() {
        return (this.node.properties as Record<string, any>).duration
    }

    toJson() {
        return {
            ...this.node.properties,
            genres: this.genres.map(genre => genre.properties),
        }
    }
}