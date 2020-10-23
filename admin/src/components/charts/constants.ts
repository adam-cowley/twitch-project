import * as chartjs from 'chart.js'

export const baseOptions: chartjs.ChartOptions = {
    responsive: true,
    legend: {
        display: false,

    },
    scales: {
        xAxes: [{
            gridLines: {
                display:false
            }
        }],
        yAxes: [{
            gridLines: {
                display:false
            }
        }]
    }
}