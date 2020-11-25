/* eslint-disable */
import React from 'react'
import { Card, Segment, Grid, Icon, Header } from 'semantic-ui-react'
import BarChart from '../components/charts/bar'
import LineChart from '../components/charts/line'
import CypherMetric from '../components/cypher/metric'
import CypherTable from '../components/cypher/table'

export default function Home() {

    const cypher = `
        MATCH (m:Movie {title: "Casino"})

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
    `

    const barcypher = `
        MATCH (g:Genre)
        WITH g, size((g)<-[:IN_GENRE]-()) AS size ORDER BY g.name ASC

        RETURN collect(g.name) AS labels,
        [{
            label: 'counts',
            backgroundColor: 'black',
            data: collect(toFloat(size))
        }] AS datasets
    `

    const linecypher = `
        MATCH (m:Movie)-[:IN_GENRE]->(g:Genre)
        WHERE m.release_date.year >= 2000
        WITH g, m.release_date.year AS year, count(*) AS count

        ORDER BY year ASC
        WITH g.name as label, g.color AS color, collect(distinct year) as years, collect({year: year, count: count}) AS counts

        WITH label, years, color, [ y in years | coalesce([ c in counts where c.year = y | c.count ][0], 0)  ] AS data

        RETURN years as labels, collect({label: label, borderColor: color, fill: 'transparent', data: data}) AS datasets
    `

    const userCypher = `
        MATCH (u:User)
        WHERE exists(u.userId)
        RETURN
            { type: 'overview', link: '/users/'+ u.userId, name: u.name } as \`Latest Users\`,
            { type: 'action', class: 'ui primary tiny basic button',
            text: 'View',
            //icon: 'user',
            link: '/users/'+ u.userId } AS actionEdit

        ORDER BY u.userId DESC LIMIT 5
    `

    return (
        <Grid>
            <Grid.Row stretched>
                <Grid.Column className="eleven wide column">
                    <Segment>
                        <Header>Genre Distribution</Header>
                        <BarChart cypher={barcypher} />
                    </Segment>
                </Grid.Column>

                <Grid.Column className="five wide">
                    <Segment>
                        <CypherMetric cypher='MATCH (a:User) RETURN count(a) AS count' text='Users' icon='users' color='red' />

                        <div style={{marginBottom: 12}}></div>

                        <CypherTable cypher={userCypher} showPagination={false} showSearch={false}></CypherTable>
                    </Segment>

                    <Segment>
                        <CypherMetric cypher='MATCH (a:Genre) RETURN count(a) AS count' text='Genres' icon='tags' color='red' />
                    </Segment>
                </Grid.Column>

            </Grid.Row>
            <Grid.Row stretched>

                <Grid.Column className="eleven wide column">
                    <Segment>
                        <Header>Movie Releases by Year</Header>
                        <LineChart cypher={linecypher} />
                    </Segment>
                </Grid.Column>
                <Grid.Column className="five wide">
                    <Segment>
                        <CypherMetric cypher='MATCH (a:Movie) RETURN count(a) AS count' text='Movies' icon='film' color='red' />
                    </Segment>
                    <Segment>
                        <CypherMetric cypher='MATCH (a:Actor) RETURN count(a) AS count' text='Actors' icon='user secret' color='red' />
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid >
    )
}


