import React from 'react'
import { Grid, Icon, Loader, Message } from 'semantic-ui-react'
import { SemanticCOLORS, SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic'
import { useReadCypher } from 'use-neo4j'

interface CypherMetricProps {
    cypher: string; // Cypher should return a single row with a 'count'
    params?: Record<string, any>;

    icon: SemanticICONS;
    color: SemanticCOLORS;
    text: string;
}

export default function CypherMetric(props: CypherMetricProps) {
    const { error, first, } = useReadCypher(props.cypher, props.params)

    if ( error ) {
        return <Message negative>{error.message}</Message>
    }
    else if ( first ) {
        let value = first.get('count')
        if ( value.toNumber ) value = value.toNumber()

        return (
            <Grid columns={2}>
                <Grid.Column style={{fontSize: '1.5em', width: '3.5em'}}>
                    <Icon size="large" circular inverted color={props.color} name={props.icon} />
                </Grid.Column>
                <Grid.Column>
                    <div className="ui huge header" style={{marginBottom: 0, marginTop: 0}}>{ value }</div>
                    <div className={`ui ${props.color} header`} style={{marginTop: 0}}>{props.text}</div>
                </Grid.Column>
            </Grid>
        )
    }

    return <Loader />
}