import React from 'react'
import { Link } from 'react-router-dom'
import { Header, Icon, Table } from 'semantic-ui-react'
import CypherAction from '../action'
import CypherCount from '../count'
import CypherLabels from '../labels'

type CypherTableCell = 'overview' | 'count' | 'labels' | 'action' | string

interface CypherTableCellProps {
    key: CypherTableCell;
    index: number;
    value: Record<string, any>;
}

function CypherTableOverview({ key, value }) {
    return (
        <Table.Cell key={key}>
            <Link to={value.link}>
                {value.icon && <Icon circular inverted color='teal' name={value.icon} size='large' style={{float: 'left', marginRight: '6px'}} />}

                <Header style={{marginTop: 0, marginBottom: 0}}>{value.name}</Header>
                {value.caption && <Header.Subheader>
                    <Icon name={value.caption.icon} />
                    {value.caption.text}
                </Header.Subheader>}
            </Link>
        </Table.Cell>
    )
}

function CypherTableCount({ key, value }) {
    return (
        <Table.Cell key={key} textAlign="right">
            <CypherCount value={value} />
        </Table.Cell>
    )
}

function CypherTableLabels({ key, value }) {
    return (
        <Table.Cell key={key}>
            <CypherLabels parentKey={key} value={value} />
        </Table.Cell>
    )
}

function CypherTableAction({ key, value }) {
    return (
     <Table.Cell key={key} textAlign="right">
         <CypherAction value={value} />
     </Table.Cell>
    )
}

export function CypherTableCell(props: CypherTableCellProps) {
    const { key, index, value } = props
    const { type } = value

    if ( type === 'overview' ) return CypherTableOverview({ key: key + index, value })
    else if ( type === 'count' ) return CypherTableCount({ key: key + index, value })
    else if ( type === 'labels' ) return CypherTableLabels({ key: key + index, value })
    else if ( type === 'action' ) return CypherTableAction({ key: key + index, value })

    return <Table.Cell key={key+index}><pre>{ JSON.stringify(value, null, 2) }</pre></Table.Cell>
}
