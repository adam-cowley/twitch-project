import { useEffect, useState } from "react";
import { int, useReadCypher } from "use-neo4j";
import SearchPagination from "../search/pagination";

import { QueryForm } from "../search/query";

export function useCypherSearch(cypher: string, limit: number = 12, orderByProperties?: string[]) {
    const [query, setQuery] = useState<string>('')
    const [orderBy, setOrderBy] = useState(orderByProperties?.length ? orderByProperties[0] : undefined);
    const [sort, /* setSort */] = useState('ASC');
    const [skip, setSkip] = useState(0);

    const { loading, error, records, first, run } = useReadCypher(cypher, { query: '', limit: int(limit), skip: int(0), orderBy, sort })

    const goPrevious = () => {
        if ( skip > 0) setSkip( Math.max( skip - limit, 0) )
    }

    const goNext = () => {
        if ( records?.length ) setSkip(skip + limit)
    }

    const handleChangeOrderBy = (e, selected) => {
        setOrderBy(selected.value)
    }

    const handleChangeSort = (e, selected) => {
        setOrderBy(selected.value)
    }

    // Set Skip number to 0 when the query changes
    useEffect(() => setSkip(0), [query])

    // Rerun the query when the query or page changes
    useEffect(() => {
        run({ query, limit: int(limit), skip: int(skip), orderBy, sort })
        // eslint-disable-next-line
    }, [ query, orderBy, skip ])



    return {
        query: QueryForm(query, setQuery, loading),
        pagination: SearchPagination({ limit, skip, orderByProperties, orderBy, records, handleChangeOrderBy, handleChangeSort, goPrevious, goNext  }),

        loading,
        error,
        records,
        first,
        skip,
        limit,

        setQuery,
        orderBy,

        goPrevious,
        goNext,
        handleChangeOrderBy,
        handleChangeSort,
    }
}
