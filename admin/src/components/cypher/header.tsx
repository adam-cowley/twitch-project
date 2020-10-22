import React from 'react'
import { Image } from 'semantic-ui-react'

export default function CypherImage({ value }) {
    return (<Image src={value.src} alt={value.alt} />)
}