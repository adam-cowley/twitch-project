import React from "react"
import { Container, Grid, Loader, Message, Segment } from "semantic-ui-react"
import CypherCard from "./component"

import { SemanticWIDTHS } from "semantic-ui-react/dist/commonjs/generic"
import { useCypherSearch } from ".."


interface CypherCardGridProps {
    cypher: string; // MATCH (m:Movie) WHERE m.title CONTAINS $query RETURN m
    columns?: SemanticWIDTHS;
    limit?: number;
    orderBy?: string[];
}
export default function CypherCardGrid(props: CypherCardGridProps) {
    const {
        query,
        pagination,
        skip,
        error,
        records,
        // limit,
        // orderBy,
        // goPrevious,
        // goNext,
        // handleChangeOrderBy,
        // handleChangeSort,
    } = useCypherSearch(props.cypher, props.limit || 12, props.orderBy)


    let results = <Loader />

    if (records && !records.length) {
        results = <Segment>No {skip > 0 ? 'more ' : '' }results found.</Segment>
    }
    else if (records && records.length) {
        // @ts-ignore
        const columns = props.columns || 3

        results = (
            <Grid columns={columns} doubling>
                <Grid.Row stretched>
                    {records.map((record, key) => (
                        <Grid.Column key={key}>
                            <CypherCard parentKey={key} record={record} />
                        </Grid.Column>
                        )
                    )}
                </Grid.Row>
            </Grid>
        )
    }
    else if (error) {
        results = <Message negative>{error.message}</Message>
    }


    return (<Container>
        {query}
        {results}
        {pagination}
    </Container>)
}