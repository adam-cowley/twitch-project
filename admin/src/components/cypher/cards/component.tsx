import React from 'react'
import { Record } from 'neo4j-driver'
import { Card } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import CypherImage from '../image'
import CypherLabels from '../labels'
import CypherCount from '../count'
import CypherAction from '../action'

interface CypherCardComponentProps {
    parentKey: number;
    record: Record;
}

export default function CypherCardComponent(props: CypherCardComponentProps) {
    const content = props.record.keys.map((type, index) => {
        const value = props.record.get(type)

        if ( type === 'image' ) return <CypherImage key={props.parentKey + '-' + index}  value={value} />
        else if ( type === 'header' ) return <CypherCardOverview key={props.parentKey + '-' + index} parentKey={props.parentKey + '-' + index} value={value} />
        else if ( type === 'meta' ) return <CypherCardMeta key={props.parentKey + '-' + index} parentKey={props.parentKey + '-' + index} value={value} />
        else if ( type === 'description' ) return <CypherCardDescription key={props.parentKey + '-' + index} value={value} />
        else if ( type === 'extra' ) return <CypherCardExtra key={props.parentKey + '-' + index} parentKey={props.parentKey + '-' + index} value={value} />

        return <div key={index}>{type}: <pre>{JSON.stringify(value, null, 2)}</pre></div>
    })

    return (
        <Card style={{ width: '100%', 'maxWidth': 'auto', 'marginBottom': '24px' }}>
            {content}
        </Card>
    )
}

function CypherCardOverview({ parentKey, value }) {
    return (
        <Card.Content>
            <Card.Header>
                <Link to={value.link}>
                    {value.name}
                </Link>
            </Card.Header>
            <Card.Meta>
                {value.labels && <CypherLabels parentKey={parentKey} value={value} />}
                {value.caption && <div>{ value.caption }</div>}
            </Card.Meta>
        </Card.Content>
    )
}

function CypherCardMeta({ parentKey, value }) {
    const meta = value.map(value => {
        if ( value.type === 'labels' ) return <CypherLabels parentKey={parentKey} value={value} />

        return <pre>{JSON.stringify(value, null, 2)}</pre>
    })
    return (
        <Card.Content>
            <Card.Meta>
                {meta}
            </Card.Meta>
        </Card.Content>
    )
}

function CypherCardDescription({ value }) {
    return (
        <Card.Content>
            <Card.Description>
                {value.text}
            </Card.Description>
        </Card.Content>
    )
}

function CypherCardExtra({ parentKey, value }) {
    const extra = value.map((row, index) => {
        if ( row.type === 'count' ) return <CypherCount key={`${parentKey}-${index}`} value={row} />
        else if ( row.type === 'labels' ) return <CypherLabels parentKey={`${parentKey}-${index}`} value={row} />
        else if ( row.type === 'action' ) return <CypherAction key={`${parentKey}-${index}`} value={row} />

        return <pre key={`${parentKey}-${index}`}>{JSON.stringify(value, null, 2)}</pre>
    })
    return (
        <Card.Content extra>
            {extra}
        </Card.Content>
    )
}

