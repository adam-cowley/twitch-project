import React, { useContext, useState } from 'react'
import { Neo4jContext, useReadCypher } from 'use-neo4j'
import { int } from 'neo4j-driver'
import { Container, Dimmer, Segment, Loader, Header, Form, Button, Message } from 'semantic-ui-react'

function EditMovie({ movie }) {
    const { driver } = useContext(Neo4jContext)

    const [ error, setError ] = useState<Error>()
    const [ confirmation, setConfirmation ] = useState<string>()
    const [ title, setTitle ] = useState(movie.properties.title)
    const [ overview, setOverview ] = useState(movie.properties.overview)

    const handleSubmit = e => {
        e.preventDefault()

        const session = driver!.session()
        session?.run(
            `MATCH (m:Movie) WHERE m.id = $id SET m += $updates, m.updatedAt = datetime() RETURN m.updatedAt as updatedAt`,
            { id: int(movie.properties.id), updates: { title, overview } }
        )
            .then(res => setConfirmation(`Node updated successfully at ${res.records[0].get('updatedAt').toString()}`))
            .catch(e => setError(e))

    }

    return (
        <Form>
            {confirmation && <Message positive>{confirmation}</Message>}
            {error && <Message negative>{error.message}</Message>}

            <Form.Field>
                <label htmlFor="title">Title</label>
                <input id="title" value={title} onChange={(e => setTitle(e.target.value))} />
            </Form.Field>
            <Form.Field>
                <label htmlFor="overview">Overview</label>
                <textarea id="overview" value={overview} onChange={(e => setOverview(e.target.value))} />
            </Form.Field>
            <Button primary onClick={handleSubmit}>Submit</Button>
        </Form>
    )
}

export default function Movie({ match }) {
    const { loading, first } = useReadCypher(`
        MATCH (m:Movie) WHERE m.id = $id RETURN m
    `, { id: int(match.params.id) })

    if (loading) {
        return (
            <Segment style={{ height: 500 }}>
                <Dimmer active>
                    <Loader />
                </Dimmer>
            </Segment>
        )
    }

    const movie = first?.get('m')

    return (
        <Container>
            <Header>{movie.properties.title}</Header>
            <EditMovie movie={movie} />
        </Container>
    )
}