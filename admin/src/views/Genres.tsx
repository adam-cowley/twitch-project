import React from 'react'
import CypherTable from '../components/cypher/table'

export default function Packages() {
    const cypher = `
        MATCH (g:Genre)
        WHERE g.name CONTAINS $query
        RETURN
            {
                type: 'overview',
                link: '/genres/'+ g.id,
                name: g.name,
                icon: 'fire',
                caption: {
                    icon: 'film',
                    text:  size((g)<-[:IN_GENRE]-())  +' movies'
                }
            }  AS Genre,
            {
                type: 'labels',
                labels: [ (p)-[:PROVIDES_ACCESS_TO]->(g) | {
                    text: p.name,
                    class: 'label--'+ apoc.text.slug(toLower(g.name)),
                    link: '/packages/'+ p.id
                } ]
            } AS Packages,
            {
                type: 'action',
                class: 'ui primary basic button',
                text: 'Edit',
                icon: 'pencil',
                link: '/genres/'+ g.id
            } AS actionEdit
        ORDER BY g.name
        LIMIT 10
    `


    return (
        <CypherTable cypher={cypher} />

    )
}