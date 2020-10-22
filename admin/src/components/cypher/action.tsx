import React from 'react'
import { Icon } from "semantic-ui-react";
import { Link } from 'react-router-dom'

export default function CypherAction({ value }) {
    return (
        <Link to={value.link} className={value.class}>
            {value.icon && <Icon name={value.icon} />}
            {value.text}
        </Link>
    )
}