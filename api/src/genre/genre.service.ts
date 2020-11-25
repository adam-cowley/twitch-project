import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { User } from '../user/user.entity';
import { int } from 'neo4j-driver';
import { STATUS_ACTIVE } from '../subscription/subscription.service';

export interface Genre {
    id: number;
    name: string
}

@Injectable()
export class GenreService {

    constructor(private readonly neo4jService: Neo4jService) {}

    async getGenresForUser(user: User): Promise<Genre[]> {
        const userId = user.getId()
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PLAN]->(p)
            WHERE s.expiresAt >= datetime() AND s.status = $status

            OPTIONAL MATCH  (p)-[:PROVIDES_ACCESS_TO]->(g)<-[:IN_GENRE]-(m)
            WHERE exists(m.poster)

            WITH p, g, m ORDER BY g.name, m.releaseDate DESC

            WITH p, g, collect(m) AS movies
            WITH p, g, movies[0] as topMovie

            RETURN p, collect(g {
                .id,
                .name,
                totalMovies: size((g)<-[:IN_GENRE]-()),
                poster: topMovie.poster
            }) AS genres
        `, { userId, status: STATUS_ACTIVE })

        if ( res.records.length == 0 ) {
            throw new UnauthorizedException('You have no active subscriptions')
        }

        return res.records[0].get('genres')
    }

    async getGenreDetails(user: User, genreId: number) {
        const userId = user.getId()
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PLAN]->(p),
                (p)-[:PROVIDES_ACCESS_TO]->(g {id: $genreId})
            WHERE s.expiresAt >= datetime() AND s.status = $status

            WITH g, [ (g)<-[:IN_GENRE]-(m) WHERE ( u.dateOfBirth <= date() - duration('P18Y') OR NOT m:Adult ) | m ] AS movies
            WITH
                g,
                movies,
                apoc.coll.sortNodes([ m IN movies WHERE exists(m.release_date) ], 'release_date')[0..4] AS latest

            WITH *,
                apoc.coll.sortNodes([ m IN movies WHERE  exists(m.popularity) AND NOT m IN latest ], 'popularity')[0..4] AS popular

            RETURN g {
                .id,
                .name,
                totalMovies: size((g)<-[:IN_GENRE]-()),
                popular: [ m in popular | m {
                    .*,
                    genres: [ (m)-[:IN_GENRE]->(g) | g ],
                    cast: [ (m)<-[:CAST_FOR]-(p) | p ][0..4]
                }],
                latest: [ m in latest | m {
                    .*,
                    genres: [ (m)-[:IN_GENRE]->(g) | g ],
                    cast: [ (m)<-[:CAST_FOR]-(p) | p ][0..4]
                }]
            } AS genre
        `, {
            userId,
            genreId: int(genreId),
            status: STATUS_ACTIVE,
        })

        if ( res.records.length == 0 ) {
            throw new NotFoundException(`Cannot find genre with ID ${genreId}`)
        }

        return res.records[0].get('genre')
    }

    async getMoviesForGenre(user: User, genreId: number, orderBy: string, limit: number, page: number) {
        const userId = user.getId()
        const res = await this.neo4jService.read(`
            MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PLAN]->(p)
            WHERE s.expiresAt >= datetime() AND s.status = $status

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
            status: STATUS_ACTIVE,
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
