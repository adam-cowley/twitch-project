import React from 'react'
import { Form, Segment } from 'semantic-ui-react'

export function QueryForm(query: string, setQuery: Function) {
    return (
        <Segment>
            <Form>
                <Form.Field>
                    <label htmlFor="query">Search</label>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
                </Form.Field>
            </Form>
        </Segment>
    )
}