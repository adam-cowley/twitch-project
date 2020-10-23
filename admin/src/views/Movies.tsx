import React from 'react'
import CypherCardGrid from '../components/cypher/cards/grid'

export default function Movies() {
    const cypher = `
        MATCH (m:Movie)
        WHERE m.title contains $query

        RETURN
            {
                src: m.poster,
                alt: m.title
            } AS image,
            {
                link: '/movies/'+ m.movieId,
                name: m.title,
                /*
                labels: [ (m)-[:IN_GENRE]->(g) | {
                    link: '/genres/'+ g.id,
                    text: g.name,
                    class: 'label--'+ apoc.text.slug(toLower(g.name))
                } ],
                */
                caption: 'Released in '+ m.release_date.year
            } AS header,
            { text: m.plot } AS description,
            [
                {
                    type: 'count',
                    icon: 'star',
                    //caption: 'avg rating',
                    number: m.imdbRating
                },
                {
                    type: 'action',
                    class: 'ui tiny right floated primary basic button',
                    text: 'View',
                    // icon: 'pencil',
                    link: '/movies/'+ m.movieId
                }
                /*
                ,
                {
                    type: 'labels',
                    labels: [ (m)-[:IN_GENRE]->(g) | {
                        link: '/genres/'+ g.id,
                        text: g.name,
                        class: 'label--'+ apoc.text.slug(toLower(g.name))
                    } ]
                }
                */
            ] AS extra
        ORDER BY m[ $orderBy ]
        SKIP $skip
        LIMIT $limit
    `

    return (
        <CypherCardGrid cypher={cypher} limit={12} columns={4} orderBy={['title', 'imdbRating']} />
    )
}
