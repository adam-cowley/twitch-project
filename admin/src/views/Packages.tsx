import React from 'react'
import CypherTable from '../components/cypher/table'

export default function Packages() {
    const cypher = `
        MATCH (p:Package)
        WHERE p.name CONTAINS $query
        RETURN
            {
                type: 'overview',
                link: '/packages/'+ p.id,
                name: p.name,
                icon: 'box',
                caption: {
                    icon: 'dollar sign',
                    text:  p.price + ' for '+ p.duration.days +' days'
                }
            }  AS Package,
            {
                type: 'labels',
                labels: [ (p)-[:PROVIDES_ACCESS_TO]->(g) | {
                    text: g.name,
                    class: 'label--'+ apoc.text.slug(toLower(g.name)),
                    link: '/genres/'+ g.id
                } ]
                } AS Genres,
            {
                type: 'count',
                //icon: 'users',
                number: size((p)<-[:FOR_PACKAGE]-())
            } AS Subscribers,
            {
                type: 'action',
                class: 'ui primary basic button',
                text: 'Edit',
                icon: 'pencil',
                link: '/packages/'+ p.id
            } AS actionEdit
        ORDER BY p.name
        SKIP $skip
        LIMIT $limit
    `

    return (
        <CypherTable cypher={cypher} limit={3} />
    )
}
