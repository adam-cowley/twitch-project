/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Container, Form, Grid, Segment, Loader, Card } from 'semantic-ui-react'

import { useLazyReadCypher } from 'use-neo4j';
import Movie from '../components/Movie'

interface SearchResultsProps {
    query: string;
}

const SearchResults = (props: SearchResultsProps) => {
    const [ getMovies, { loading, records } ] = useLazyReadCypher('MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m LIMIT 12')

    useEffect(() => {
        props.query !== '' && getMovies(props)
    }, [props.query])

    const results = records?.map(row => {
        const movie = row.get('m')

        return (
            <Grid.Column key={movie.identity.toNumber()}>
                <Movie movie={movie} />
            </Grid.Column>
        )
    })

    if ( props.query === '' ) return <div></div>

    if ( loading ) return <Loader />

    if ( !records?.length )  {
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