import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)
            WHERE s.expiresAt >= datetime()

            OPTIONAL MATCH  (p)-[:PROVIDES_ACCESS_TO]->(g)

            WITH p, g
            ORDER BY g.name ASC

            RETURN p, collect(g { .id, .name }) AS genres
        `, { userId })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }

        return res.records[0].get('genres')
    }

    async getMoviesForGenre(user: User, genreId: number, orderBy: string, limit: number, page: number) {
        const userId: string = (<Record<string, any>> user.properties).id
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)
            WHERE s.expiresAt >= datetime()

            OPTIONAL MATCH (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})

            OPTIONAL MATCH (g)<-[:IN_GENRE]-(m:Movie)
                WHERE ( u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult )

            WITH s, g, m
            ORDER BY m[$orderBy] ASC
            SKIP $skip
            LIMIT $limit

            RETURN s,
                g {
                    .id,
                    .name,
                    movies: collect(m {
                        .*,
                        genres: [ (m)-[:IN_GENRE]->(g) | g ],
                        cast: [ (m)<-[:CAST_FOR]-(p) | p ][0..5]
                    })
                } AS genre
        `, {
            userId,
            genreId: int(genreId),
            orderBy,
            skip: int( (page-1) * limit ),
            limit: int(limit),
        })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }
        else if ( !res.records[0].get('genre') ) {
            throw new NotFoundException(`Cannot find genre with ID ${genreId}`)
        }

        return res.records[0].get('genre')
    }


}
