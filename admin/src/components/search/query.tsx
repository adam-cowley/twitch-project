import React from 'react'
import { Form, Icon, Segment } from 'semantic-ui-react'

export function QueryForm(query: string, setQuery: Function, loading: boolean) {
    return (
        <Segment>
            <Form>
                <Form.Field>
                    <label htmlFor="query">Search</label>
                    <div className="ui right icon input loading">
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
                        {loading && <Icon name='spinner' />}
                    </div>
                </Form.Field>
            </Form>
        </Segment>
    )
}