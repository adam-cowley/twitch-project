import React from "react"
import { Loader, Message } from "semantic-ui-react"
import CypherCardComponent from "./component"

import { useCypherSearch } from ".."

interface CypherCardProps {
    cypher: string; // MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m
    limit?: number;
    orderBy?: string[];
}
export default function CypherCard(props: CypherCardProps) {
    const {
        error,
        first,
    } = useCypherSearch(props.cypher, props.limit || 12, props.orderBy)

    if ( error ) {
        return <Message negative>{error.message}</Message>
    }
    else if ( first ) {
        return <CypherCardComponent parentKey={0} record={first} />
    }

    return <Loader />
}