/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Container, Form, Grid, Segment, Loader, Card, Message } from 'semantic-ui-react'

import { useReadCypher } from 'use-neo4j';
import Movie from '../components/Movie'

interface SearchResultsProps {
    query: string;
}

const SearchResults = (props: SearchResultsProps) => {
    const { loading, records, error, run, } = useReadCypher('MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m LIMIT 12', props)

    useEffect(() => {
        run(props)
    }, [ props ])

    const results = records?.map(row => {
        const movie = row.get('m')

        return (
            <Grid.Column key={movie.identity.toNumber()}>
                <Movie movie={movie} />
            </Grid.Column>
        )
    })

    if ( loading ) return <Loader />

    else if ( error ) return <Message negative>{ error.message }</Message>

    else if ( !records?.length )  {
        return <Card style={{ width: '100%', maxWidth: 'auto' }}><Card.Content>No results found</Card.Content></Card>
    }

    return (
        <Grid columns={3} doubling>
            <Grid.Row stretched>
                {results}
            </Grid.Row>
        </Grid>
    )
}

export default function Home() {
    const [ query, setQuery ] = useState<string>('')

    return (
        <Container>
            <Segment>
                <Form>
                    <Form.Field>
                        <label htmlFor="query">Search by title</label>
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
                    </Form.Field>
                </Form>
            </Segment>
            <SearchResults query={query} />
        </Container>
    )
}