import React from 'react'
import { Label } from "semantic-ui-react";
import { Link } from 'react-router-dom'


export default function CypherLabels({ parentKey, value }) {
    const { labels } = value

    const limit = 5
    const length = labels.length

    const content = labels.slice(0, limit).map(l => (
        <Link key={parentKey + l.text} to={l.link}>
            <Label className={l.class}>{l.text}</Label>
        </Link>
    ))
    const plus = length > limit ? ` +${length - limit}` : ''

    return (
        <span>
            {content} {plus}
        </span>
    )
}


