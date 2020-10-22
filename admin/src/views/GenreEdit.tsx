/* eslint-disable */
import React from 'react'
import { Container, Form, Header, Loader, Segment } from 'semantic-ui-react'
import { int, useReadCypher } from 'use-neo4j'
import CypherTable from '../components/cypher/table'

function useEditForm({ label, params }) {
    // const properties =

}



function EditField({ name, type, value }) {
    let fieldType = 'text'

    switch (type) {
        case 'FLOAT':
        case 'INTEGER':
            fieldType = 'number'
            break;

        case 'DATE':
            fieldType = 'date';
            break;

        case 'DATE_TIME':
            fieldType = 'datetime';
            break;
    }

    return (
        <Form.Field key={name}>
            <label htmlFor={name}>{name} - {type}</label>
            <input type={fieldType} id={name} value={value} />
        </Form.Field>
    )
}

export default function GenreEdit() {
    const label = 'Movie'
    const property = 'title'
    const value = 'Casino'
    const title = 'title'

    const meta = useReadCypher(`
        CALL apoc.meta.schema({ labels: [ $label ] })
    `, { label })

    const fetch = useReadCypher(`MATCH (n:${label}) WHERE n[ $property ] = $value RETURN n`, { property, value })

    if (meta.loading || fetch.loading) return <Loader />


    let fields
    let properties = {}

    const metaData = meta.first?.get('value')[ label ]


    if ( fetch?.first ) {
        properties = fetch.first.get('n').properties
    }
    else {
    }



    if ( metaData && metaData.properties ) {

        // @ts-ignore
        fields = Object.entries(metaData.properties).map(([ name, row ]) => EditField({ name, ...row, value: properties && properties[ name ] }))
    }



    return (
        <Container>
            <Segment>
            <Form>
                <Header>{properties[ title ]}</Header>
                {fields}
            </Form>
    <pre>{JSON.stringify(properties, null, 2)}</pre>
    <pre>{JSON.stringify(metaData, null, 2)}</pre>
            </Segment>
        </Container>
    )

}