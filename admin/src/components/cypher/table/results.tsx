import React from 'react'
import { Record as Neo4jRecord }  from 'neo4j-driver'
import { CypherTableCell } from './cell'
import { Table } from 'semantic-ui-react'

interface CypherTableResultsProps {
    records: Neo4jRecord[];
}

export default function CypherTableResults(props: CypherTableResultsProps) {
    const { records } = props

    const headers = records[0].keys.map(key => <Table.HeaderCell key={key}>{key.startsWith('action') ? '' : key}</Table.HeaderCell>)
    const results = records.map((row, index) => {
        const cells = row.keys.map(key => CypherTableCell({ key, index, value: row.get(key) }))

        return (
        <Table.Row key={index}>
            {cells}
        </Table.Row>
        )
    })

    return (
        <Table>
            <Table.Header>
                <Table.Row>
                {headers}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {results}
            </Table.Body>
        </Table>
    )


}