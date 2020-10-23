import React from "react";
import * as chartjs from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Loader, Message } from "semantic-ui-react";
import { useReadCypher } from "use-neo4j";
import { baseOptions } from "./constants";

interface LineChartProps {
    cypher: string;
    params?: Record<string, any>;
    options?: chartjs.ChartOptions;
    height?: number;
}

export default function LineChart(props: LineChartProps) {
    const { error, first } = useReadCypher(props.cypher, props.params)

    if ( error ) return <Message negative>{error.message}</Message>
    else if ( first ) {
        const data = Object.fromEntries( first.keys.map((key) => [ key,  first.get(key) ]) )

        const options = Object.assign(baseOptions, props.options)

        return (
            <Line data={data} options={options} height={props.height} />
        )
    }

    return <Loader />
}
