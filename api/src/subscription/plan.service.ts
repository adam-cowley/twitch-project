import { Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import { Plan } from "./plan.entity";

@Injectable()
export class PlanService {

    constructor(private readonly neo4jService: Neo4jService) {}

    getPlans(): Promise<Plan[]> {
        return this.neo4jService.read(`
            MATCH (p:Plan)
            WHERE p.price > 0
            RETURN p, [ (p)-[:PROVIDES_ACCESS_TO]->(g) | g ] AS genres
            ORDER BY p.price ASC
        `)
        .then(res => res.records.map(row => new Plan(row.get('p'), row.get('genres'))))
    }

    findById(id: number): Promise<Plan> {
        return this.neo4jService.read(`
            MATCH (p:Plan {id: $id})
            WHERE p.price > 0
            RETURN p, [ (p)-[:PROVIDES_ACCESS_TO]->(g) | g ] AS genres
            ORDER BY p.price ASC
        `, { id: this.neo4jService.int(id) })
        .then(res => res.records.map(row => new Plan(row.get('p'), row.get('genres')))[0])
    }

}