import React, { useEffect, useState } from "react"
import { Container, Form, Loader, Message, Segment } from "semantic-ui-react"
import { int, useReadCypher } from "use-neo4j"
import CypherTableResults from './results'

interface CypherTableProps {
    cypher: string; // MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m
    limit?: number;
}
export default function CypherTable(props: CypherTableProps) {
    const [ query, setQuery ] = useState<string>('')
    const limit = int(props.limit || 10)
    const { error, loading, records, run } = useReadCypher(props.cypher, { query: '', limit })

    // eslint-disable-next-line
    useEffect(() => { run({ query, limit }) }, [ query ])

    let results = <div>Loading...</div>

    if (records && !records.length) {
        results = <div>No results found for <strong>{query}</strong></div>
    }
    else if (records && records.length) {
        results = <CypherTableResults records={records} />
    }
    else if (error) {
        results = <Message negative>{error.message}</Message>
    }
    else if (loading) {
        results = <Loader />
    }


    return (<Container>
        <Segment>
            <Form>
                <Form.Field>
                    <label htmlFor="query">Search</label>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
                </Form.Field>
            </Form>
        </Segment>
        {results}
    </Container>)

}