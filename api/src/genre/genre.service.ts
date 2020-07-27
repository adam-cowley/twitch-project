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

            RETURN p, collect(g {
                .id,
                .name,
                totalMovies: size((g)<-[:IN_GENRE]-())
            }) AS genres
        `, { userId })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }

        return res.records[0].get('genres')
    }

    async getGenreDetails(user: User, genreId: number) {
        const userId: string = (<Record<string, any>> user.properties).id
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)
            WHERE s.expiresAt >= datetime()

            OPTIONAL MATCH (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})


            WITH g, [ (g)<-[:IN_GENRE]-(m) WHERE ( u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult ) | m ] AS movies
            WITH
                g,
                movies,
                [ m in apoc.coll.sortNodes(movies, 'release_date')[0..5] WHERE exists(m.release_date) | m ] AS latest

            WITH *,
                [ m in apoc.coll.sortNodes(movies, 'popularity') WHERE exists(m.popularity) AND NOT m IN latest ][0..5] AS popular


            RETURN g {
                .id,
                .name,
                totalMovies: size((g)<-[:IN_GENRE]-()),
                popular: [ m in popular | m {
                    .*,
                    genres: [ (m)-[:IN_GENRE]->(g) | g ],
                    cast: [ (m)<-[:CAST_FOR]-(p) | p ][0..5]
                }],
                latest: [ m in popular | m {
                    .*,
                    genres: [ (m)-[:IN_GENRE]->(g) | g ],
                    cast: [ (m)<-[:CAST_FOR]-(p) | p ][0..5]
                }]
            } AS genre
        `, {
            userId,
            genreId: int(genreId),
        })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }
        else if ( !res.records[0].get('genre') ) {
            throw new NotFoundException(`Cannot find genre with ID ${genreId}`)
        }

        return res.records[0].get('genre')
    }

    async getMoviesForGenre(user: User, genreId: number, orderBy: string, limit: number, page: number) {
        const userId: string = (<Record<string, any>> user.properties).id
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)
            WHERE s.expiresAt >= datetime()

            OPTIONAL MATCH (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})

            OPTIONAL MATCH (g)<-[:IN_GENRE]-(m:Movie)
                WHERE ( u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult )

            RETURN s,
            g,
            m

            ORDER BY m.title ASC
            SKIP $skip
            LIMIT $limit
        `, {
            userId,
            genreId: int(genreId),
            skip: int( (page-1) * limit ),
            limit: int(limit),
        })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }
        else if ( !res.records[0].get('g') ) {
            throw new NotFoundException('Cannot find genre')
        }

        return res.records.map(row => row.get('m'))
    }


}
