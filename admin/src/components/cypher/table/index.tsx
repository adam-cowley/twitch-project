import React from "react"
import { Container, Loader, Message, Segment } from "semantic-ui-react"
import { useCypherSearch } from ".."
import CypherTableResults from './results'

interface CypherTableProps {
    cypher: string; // MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m
    limit?: number;
    showSearch?: boolean;
    showPagination?: boolean;
}
export default function CypherTable(props: CypherTableProps) {
    const {
        query,
        pagination,
        records,
        error,
        skip,
    } = useCypherSearch(props.cypher, props.limit)

    let results = <Loader />

    if (records && !records.length) {
        results = <Segment>No {skip > 0 ? 'more ' : '' }results found.</Segment>
    }
    else if (records && records.length) {
        results = <CypherTableResults records={records} />
    }
    else if (error) {
        results = <Message negative>{error.message}</Message>
    }

    return (<Container>
        {(props.showSearch === undefined || props.showSearch) && query}
        {results}
        {(props.showPagination === undefined || props.showPagination) && pagination}
    </Container>)

}