import React from 'react'
import { Link } from 'react-router-dom'
import { Header, Icon, Label, Table } from 'semantic-ui-react'

type CypherTableCell = 'overview' | 'count' | 'labels' | 'action' | string

interface CypherTableCellProps {
    key: CypherTableCell;
    index: number;
    value: Record<string, any>;
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


function CypherTableOverview({ key, value }) {
    return (
        <Table.Cell key={key}>
            <Link to={value.link}>
                <Icon circular inverted rounded color='teal' name={value.icon} size='large' style={{float: 'left', marginRight: '6px'}} />

                <Header style={{marginTop: 0, marginBottom: 0}}>{value.name}</Header>
                <Header.Subheader>
                    <Icon name={value.caption.icon} size='small' />
                    {value.caption.text}
                </Header.Subheader>
            </Link>
        </Table.Cell>
    )
}

function CypherTableCount({ key, value }) {
    return (
        <Table.Cell key={key} textAlign="right">
            <Icon name={value.icon} size="big" />
            {value.number?.toNumber()}
        </Table.Cell>
    )
}

function CypherTableLabels({ key, value }) {
    const { labels } = value

    const limit = 5
    const length = labels.length

    const content = labels.slice(0, limit).map(l => (
        <Link key={key + l.text} to={l.link}>
            <Label className={l.class}>{l.text}</Label>
        </Link>
    ))
    const plus = length > limit ? ` +${length - limit}` : ''

    return (
        <Table.Cell key={key}>
            {content} {plus}
        </Table.Cell>
    )
}

function CypherTableAction({ key, value }) {
    return (
     <Table.Cell key={key} textAlign="right">
         <Link to={value.link} className={value.class}>
             {value.icon && <Icon name={value.icon} />}
             {value.text}
         </Link>
     </Table.Cell>
    )
}
