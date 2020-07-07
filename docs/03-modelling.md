# Data Modelling

We will be building a new site for the fictional client **Neoflix**.

> Neoflix is a video streaming service that allows users to buy monthly subscriptions for Films and TV Shows.  Users can purchase many packages that provide access to curated lists of content.  All content is categorised by type, language and genre.


One of the simplest and most common sense approaches is to extract Nouns and Verbs from your problem statement or user stories.  This ensures that the data model makes sense to anyone coming at your project for the first time.  My favourite presentation on the subject is [Decyphering Your Graph Model](https://neo4j.com/blog/decyphering-your-graph-model/) by [Dom Davis](https://twitter.com/idomdavis) from [Graph Connect](https://www.graphconnect.com), London in 2017.

By using this method, you ensure that you are using.  In my experience it's a good place to start, and if anything doesn't make sense further into the project it is really easy to refactor the model.

### The nouns

> Neoflix is a **video** streaming service that allows **users** to buy monthly **subscriptions** for **Films** and **TV Shows**.  Users can purchase many **packages** that provide access to curated **lists** of content.  All content is categorised by **type**, **language** and **genre**.



### The verbs

> Neoflix is a video streaming service that allows users to **buy** monthly subscriptions for Films and TV Shows.  Users can *purchase* many packages that **provide access** to curated lists of content.  All content is **categorised by** type, language and genre.


### Tying it Together

This will give us a pretty simple model:

- `(:User)-[:PURCHASED]->(:Subscription)-[:FOR]->(:Package)` - A user will buy a subscription for a package - for example bronze, silver, gold or basic and premium.
- `(:Package)-[:PROVIDES_ACCESS]->(:Content)` - A valid subscription to the package will provide access to Videos.  These videos could be broken down into sub categories (Lessons, demos, etc).

### Deriving Properties

There's no real art to deriving properties from the statement above, but these are still heavily driven by the use case.  Properties on nodes and relationships will be used to identify distinct entities and supplimented with information that will help support the features of the application and also provide insights further down the line.

Recent data protection legislation passed across the world, for example GDPR in the EU and CCPA in the USA, mean that some consideration needs to be taken into account when deciding what data to store on a person.  We shouldn't be storing more data than is necessary on an individual, the data should only be used for the purposes that have been outlined, and the data shouldn't be held for longer than is necessary.

How you name the properties is arbitrary, but it is useful to remember that the data in neo4j **is case sensitive**.  `userId` and `UserID` properties will be treated as entirely different entities, and as Neo4j is Schema-~~free~~ Optional, it can be easy to introduce erroneous labels. relationship types or property keys.  As long as you pick a naming convention and stick to it, you should be fine.



## Entities

Taking a look at the [CSV files provided](../data/), there is some additional data from the basic model that we derived above.  Everything loaded in a `LOAD CSV` query is a string by default, so  so there will be some additional preparation to

### Movies - `movies_metadata.csv`

```cypher
LOAD CSV WITH HEADERS FROM 'file:///movies_metadata.csv' AS row
RETURN row LIMIT 1
```

```json
{
  "overview": "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene. Afraid of losing his place in Andy's heart, Woody plots against Buzz. But when circumstances separate Buzz and Woody from their owner, the duo eventually learns to put aside their differences.",
  "original_language": "en",
  "original_title": "Toy Story",
  "imdb_id": "tt0114709",
  "runtime": "81.0",
  "video": "False",
  "title": "Toy Story",
  "poster_path": "/rhIRbceoE9lR4veEXuwCC2wARtG.jpg",
  "spoken_languages": "[{'iso_639_1': 'en', 'name': 'English'}]",
  "revenue": "373554033",
  "release_date": "1995-10-30",
  "production_companies": "[{'name': 'Pixar Animation Studios', 'id': 3}]",
  "genres": "[{'id': 16, 'name': 'Animation'}, {'id': 35, 'name': 'Comedy'}, {'id': 10751, 'name': 'Family'}]",
  "popularity": "21.946943",
  "vote_average": "7.7",
  "belongs_to_collection": "{'id': 10194, 'name': 'Toy Story Collection', 'poster_path': '/7G9915LfUQ2lVfwMEEhDsn3kT4B.jpg', 'backdrop_path': '/9FBwqcd9IRruEDUrTdcaafOMKUq.jpg'}",
  "production_countries": "[{'iso_3166_1': 'US', 'name': 'United States of America'}]",
  "tagline": null,
  "id": "862",
  "adult": "False",
  "vote_count": "5415",
  "status": "Released",
  "homepage": "http://toystory.disney.com/toy-story",
  "budget": "30000000"
}
```

#### Properties

| name | type | description |
| -- | -- | -- |
| id | `integer` (Primary Key) | The unique identifier for the node.
| imdb_id | `string` | The ID for this movie/tv show on [IMDB](https://imdb.com).
| title | `string` |
| original_title | `string` |
| runtime | `float` |
| poster_path | `string` | Relative path to a poster image
| revenue | `integer` |
| release_date | `Date` |
| popularity | `float` |
| vote_average | `float` |
| tagline | `string` |
| vote_count | `integer` |
| status | `enum` | "Released", "Rumored", "In Production", "Post Production", "Planned", "Canceled"
| homepage | `string` |
| budget | `integer` |

#### Additional Labels

| Property | Type | Action
| -- | -- | -- |
| video | `string` (True or False) | Set a label of `:Video`
| adult | `string` (True or False) | Set a label of `:Adult` - should be excluded from certain packages

#### Relationship Types

| Name | Relationship Type | Direction | Other Node |  Relationship Properties | notes |
| -- | -- | -- | -- | -- | -- |
| original_language | `ORIGINAL_LANGUAGE` | Outgoing | `(:Language {id})`
| spoken_languages | `SPOKEN_LANGUAGE` | Outgoing |  `(:Language {id, name})`
| production_companies | `PRODUCED_BY` | Outgoing | `(:ProductionCompany {id, name})`
| genres | `IN_GENRE` | Outgoing | `(:Genre {id, name})`
| belongs_to_collection | `IN_COLLECTION` | Outgoing | `(:Collection {id, name, poster_path})`
| production_countries | `PRODUCED_IN` | Outgoing | `(:Country {id, name})`


### Credits - `credits.csv`

This file is a little more complicated, and looks like it's come out of some sort of document store.  Each row has an ID which represents the movie ID, then stringified JSON objects for the cast and crew.


```cypher
LOAD CSV WITH HEADERS FROM 'file:///credits.csv' AS row
RETURN row LIMIT 1
```

```json
{
  "cast": "[{'cast_id': 14, 'character': 'Woody (voice)', 'credit_id': '52fe4284c3a36847f8024f95', 'gender': 2, 'id': 31, 'name': 'Tom Hanks', 'order': 0, 'profile_path': '/pQFoyx7rp09CJTAb932F2g8Nlho.jpg'}, ...]",
  "id": "862",
  "crew": "[{'credit_id': '52fe4284c3a36847f8024f49', 'department': 'Directing', 'gender': 2, 'id': 7879, 'job': 'Director', 'name': 'John Lasseter', 'profile_path': '/7EdqiNbr4FRjIhKHyPPdFfEEEFG.jpg'}, ...]"
}
```

#### Cast

The cast objects represents the:

- Person
  - id: `integer`
  - name: `string`
  - profile_path: `string`
  - gender: `integer`:  0: unknown; 1: male; 2: female;
- Casting information: `(:Person)-[:CAST_FOR {cast_id, credit_id, character}]->(:Movie)`
  - cast_id: `integer`
  - credit_id: `string`
  - character: `string`

```json
{
    "cast_id": 14,
    "character": "Woody (voice)",
    "credit_id": "52fe4284c3a36847f8024f95",
    "gender": 2,
    "id": 31,
    "name": "Tom Hanks",
    "order": 0,
    "profile_path": "/pQFoyx7rp09CJTAb932F2g8Nlho.jpg"
}
```

#### Crew

```json
{
    "credit_id": "52fe4284c3a36847f8024f49",
    "department": "Directing",
    "gender": 2,
    "id": 7879,
    "job": "Director",
    "name": "John Lasseter",
    "profile_path": "/7EdqiNbr4FRjIhKHyPPdFfEEEFG.jpg"
}
```

- Person
  - id: `integer`
  - name: `string`
  - profile_path: `string`
  - gender: `integer`:  0: unknown; 1: male; 2: female;
- Casting information: `(:Person)-[:CAST_FOR {cast_id, credit_id, character}]->(:Movie)`
  - credit_id: `string`
  - department: `string`
  - job: `string`


### Keywords - `keywords.csv`

The ID column represents the ID of the movie, and keywords holds a stringified JSON array containing keywords, each with an ID and name.  This may come in handy for providing better recommendations in the future.

```cypher
LOAD CSV WITH HEADERS FROM 'file:///keywords.csv' AS row
RETURN row LIMIT 1
```

```json
{
    "keywords": '[
        {
            "id": 931,
            "name": "jealousy"
        },
        {
            "id": 4290,
            "name": "toy"
        },
        {
            "id": 5202,
            "name": "boy"
        },
        {
            "id": 6054,
            "name": "friendship"
        },
        {
            "id": 9713,
            "name": "friends"
        },
        {
            "id": 9823,
            "name": "rivalry"
        },
        {
            "id": 165503,
            "name": "boy next door"
        },
        {
            "id": 170722,
            "name": "new toy"
        },
        {
            "id": 187065,
            "name": "toy comes to life"
        }
    ]',
    "id": "862"
}
```

```
(:Movie {id})-[:HAS_KEYWORD]->(:Keyword {id, name})
```




### Ratings - `ratings.csv`

The ratings file is more straightforward, there are keys for the User ID, Movie ID and a rating.

```cypher
LOAD CSV WITH HEADERS FROM 'file:///ratings.csv' AS row
RETURN row LIMIT 1
```

```json
{
  "rating": "1.0",
  "movieId": "110",
  "userId": "1",
  "timestamp": "1425941529"
}
```

This will be converted into a relationship with a type of `RATED` between the User and the Movie:

```
(:User {id})-[:RATED {rating, timestamp}]->(:Movie {id})
```

### Links - `links.csv`

_(Omitted - the data is not useful at the moment)_





```
CREATE CONSTRAINT ON (n:Movie) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Language) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Country) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Genre) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:ProductionCompany) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Collection) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Person) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:User) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Keyword) ASSERT n.id IS UNIQUE;
```
