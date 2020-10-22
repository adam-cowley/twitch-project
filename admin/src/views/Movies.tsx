import React from 'react'
import CypherCards from '../components/cypher/cards'

export default function Packages() {
    const cypher = `
        MATCH (m:Movie)
        WHERE m.title contains $query

        RETURN
            {
                src: m.poster,
                alt: m.title
            } AS image,
            {
                link: '/movies/'+ m.id,
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
        <CypherCards cypher={cypher} limit={4} columns={4} orderBy={['title', 'imdbRating']} />
    )
}
