import React from 'react'
import { Card, Image, Label, Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { Node } from 'neo4j-driver'

interface MovieProps {
    movie: Node
}

export default function Movie(props: MovieProps) {
    const { movie } = props
    const labels = movie.labels.map(label => <Label key={label}>{label}</Label>)

    const properties: Record<string, any> = movie.properties

    return (
        <Card style={{ width: '100%', 'maxWidth': 'auto', 'marginBottom': '24px' }}>
            <Image src={properties.poster} />
            <Card.Content>
                <Card.Header>
                    <Link to={`/movie/${movie.identity.toNumber()}`}>
                        {properties.title}
                    </Link>
                </Card.Header>
                <Card.Meta>
                    <div>{labels}</div>
                    {properties.year && `Released in ${properties.year.toNumber()}`}
                </Card.Meta>
                <Card.Description>
                    {properties.plot?.substr(0, 100)}&hellip;
                    </Card.Description>
            </Card.Content>
            <Card.Content extra>
                <Icon name='user' />
                {properties.imdbRating}
            </Card.Content>
        </Card>
    )
}

