import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { User } from '../user/user.service';
import { int } from 'neo4j-driver';

export interface Genre {
    id: number;
    name: string
}

@Injectable()
export class GenreService {

    constructor(private readonly neo4jService: Neo4jService) {}

    async getGenresForUser(user: User): Promise<Genre[]> {
        const userId: string = (<Record<string, any>> user.properties).id
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p),
                (p)-[:PROVIDES_ACCESS_TO]->(g)
            WHERE s.expiresAt >= datetime()
            RETURN g
            ORDER BY g.name ASC
        `, { userId })

        return res.records.map(row => ({
            ...row.get('g').properties,
            id: row.get('g').properties.id.toNumber()
        }))
    }

    async getMoviesForGenre(user: User, genreId: number, orderBy: string, limit: number, page: number) {
        const userId: string = (<Record<string, any>> user.properties).id
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p),
                (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})<-[:IN_GENRE]-(m:Movie)
            WHERE s.expiresAt >= datetime()
                AND ( u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult )
            RETURN m,
                [ (m)-[:IN_GENRES]->(g) | g ] AS genres,
                [ (m)<-[:CAST_FOR]-(p) | p ][0..5] AS cast
            ORDER BY m.title ASC
            SKIP $skip
            LIMIT $limit
        `, {
            userId,
            genreId: int(genreId),
            skip: int( (page-1) * limit ),
            limit: int(limit),
        })

        console.log(`
        MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p),
            (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})<-[:IN_GENRE]-(m:Movie)
        WHERE s.expiresAt >= datetime()
            AND ( u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult )
        RETURN m,
            [ (m)-[:IN_GENRES]->(g) | g ] AS genres,
            [ (m)<-[:CAST_FOR]-(p) | p ][0..5] AS cast
        ORDER BY m.title ASC
        SKIP $skip
        LIMIT $limit
    `);

        console.log({
            userId,
            genreId,
            skip: (page-1) * limit,
            limit,
        });




        console.log(res.records[0] && res.records[0].get('cast'));

        return res.records.map(row => ({
            ...row.get('m').properties,
            id: row.get('m').properties.id.toNumber(),
            genres: row.get('genres'),
            cast: row.get('cast')
        }))
    }


}
