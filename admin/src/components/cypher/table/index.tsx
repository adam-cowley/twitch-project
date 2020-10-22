import React from "react"
import { Container, Loader, Message, Segment } from "semantic-ui-react"
import { useCypherSearch } from ".."
import CypherTableResults from './results'

interface CypherTableProps {
    cypher: string; // MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m
    limit?: number;
}
export default function CypherTable(props: CypherTableProps) {
    const {
        query,
        pagination,
        loading,
        records,
        error,
        skip,
        // goPrevious,
        // goNext,
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
    else if (loading) {
        results = <Loader />
    }


    return (<Container>
        {query}
        {results}
        {pagination}
    </Container>)

}