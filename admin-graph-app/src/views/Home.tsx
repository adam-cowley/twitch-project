import React, { useState } from 'react'
import { Card, Container, Form, Icon, Label, Segment } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { useReadCypher } from 'use-neo4j';

function SearchResults({ query }) {
    const { loading, records } = useReadCypher('MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m LIMIT 10', { query })

    if ( query === '' ) return <div></div>;

    if ( loading ) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    const movies = records?.map(row => {
        const movie = row.get('m')
        const labels = movie.labels.map(label => <Label key={label}>{label}</Label>)

        return (
            <Card key={movie.identity.toNumber()}>
                <Card.Content>
                    <Card.Header>
                        <Link to={`/movie/${movie.properties.id.toNumber()}`}>
                        {movie.properties.title}
                        </Link>
                    </Card.Header>
                    <Card.Meta>
                        <div>{labels}</div>
                        Released in {movie.properties.release_date.year.toNumber()}
                    </Card.Meta>
                    <Card.Description>
                        {movie.properties.overview.substr(0, 100)}&hellip;
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <Icon name='user' />
                    {movie.properties.vote_count.toNumber()}
                </Card.Content>
            </Card>
        )
    })


    return (
        <div>
            {movies}
        </div>
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

            <pre>{query}</pre>

            <SearchResults query={query} />
        </Container>
    )
}