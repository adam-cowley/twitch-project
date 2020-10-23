import React from 'react'
import {  Icon } from "semantic-ui-react";

export default function CypherCount(props) {
    let number = props.value.number

    // Convert Neo4j Integer
    if ( number && typeof number.toNumber === 'function' ) number = number.toNumber()

    return (
        <span>
            {props.value.icon && <Icon name={props.value.icon} size={props.size} />}
            {props.value.caption && <span>{props.value.caption}: </span>}
            {number}
        </span>
    )
}
