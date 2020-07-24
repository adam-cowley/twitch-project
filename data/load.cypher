CREATE CONSTRAINT ON (n:Movie) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Language) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Country) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Genre) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:ProductionCompany) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Collection) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Person) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:User) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT ON (n:Keyword) ASSERT n.id IS UNIQUE;

CREATE CONSTRAINT ON (u:User) ASSERT u.email IS UNIQUE;
// CREATE CONSTRAINT ON (u:User) ASSERT exists(u.email);

:auto
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///movies_metadata.csv' AS row
MERGE (m:Movie {id: toInteger(row.id)})
SET m += row {
    .overview,
    .imdb_id,
    .title,
    .poster_path,
    .backdrop_path,
    .original_title,
    .original_language,
    .tagline,
    .status,
    .homepage,
    runtime: toFloat(row.runtime),
    release_date: date(row.release_date),
    revenue: toFloat(row.revenue),
    popularity: toFloat(row.popularity),
    average_vote: toFloat(row.vote_average),
    vote_count: toInteger(row.vote_count),
    budget: toInteger(row.budget)
}

FOREACH (_ IN CASE WHEN row.original_language IS NOT NULL THEN [1] ELSE [] END |
    MERGE (l:Language {id: row.original_language})
    MERGE (m)-[:ORIGINAL_LANGUAGE]->(l)
)

FOREACH (_ IN CASE WHEN row.video = 'True' THEN [1] ELSE [] END | SET m:Video )
FOREACH (_ IN CASE WHEN row.adult = 'True' THEN [1] ELSE [] END | SET m:Adult )

FOREACH (language IN apoc.convert.fromJsonList(row.spoken_languages) |
    MERGE (l:Language {id: language.iso_639_1}) ON CREATE SET l.name = language.name
    MERGE (m)-[:SPOKEN_IN_LANGUAGE]->(l)
)

FOREACH (country IN apoc.convert.fromJsonList(row.production_countries) |
    MERGE (c:Country {id: country.iso_3166_1}) ON CREATE SET c.name = country.name
    MERGE (m)-[:PRODUCED_IN_COUNTRY]->(c)
)

FOREACH (genre IN apoc.convert.fromJsonList(row.genres) |
    MERGE (g:Genre {id: genre.id}) ON CREATE SET g.name = genre.name
    MERGE (m)-[:IN_GENRE]->(g)
)

FOREACH (company IN apoc.convert.fromJsonList(row.production_companies) |
    MERGE (c:ProductionCompany {id: company.id}) ON CREATE SET c.name = company.name
    MERGE (m)-[:PRODUCED_BY]->(c)
)

FOREACH (collection IN CASE WHEN apoc.convert.fromJsonMap(row.belongs_to_collection) IS NOT NULL THEN [apoc.convert.fromJsonMap(row.belongs_to_collection)] ELSE [] END |
    MERGE (c:Collection {id: collection.id}) ON CREATE SET c += collection
    MERGE (m)-[:IN_COLLECTION]->(c)
);

// credits
:auto
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///credits.csv' AS row

MATCH (m:Movie { id: toInteger(row.id) })

FOREACH (cast IN apoc.convert.fromJsonList(row.cast) |
    MERGE (p:Person { id: toInteger(cast.id) })
    ON CREATE SET p.name = cast.name, p.gender = cast.gender, p.profile_path = cast.profile_path

    MERGE (p)-[r:CAST_FOR]->(m)
    ON CREATE SET r += cast {
        .credit_id,
        .cast_id,
        .character,
        .order
    }
)

FOREACH (crew IN apoc.convert.fromJsonList(row.crew) |
    MERGE (p:Person { id: toInteger(crew.id) })
    ON CREATE SET p.name = crew.name, p.gender = crew.gender, p.profile_path = crew.profile_path

    MERGE (p)-[r:CREW_FOR]->(m)
    ON CREATE SET r += crew {
        .credit_id,
        .department,
        .job
    }
);

// todo: specific relationship types for crew


// keywords
:auto
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///keywords.csv' AS row
MATCH (m:Movie { id: toInteger(row.id) })

FOREACH (keyword IN apoc.convert.fromJsonList(row.keywords) |
    MERGE (k:Keyword {id: keyword.id})
    ON CREATE SET k.name = keyword.name

    MERGE (m)-[:HAS_KEYWORD]->(k)
);

// ratings.csv
:auto
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///ratings.csv' AS row
MATCH (m:Movie { id: toInteger(row.movieId) })
MERGE (u:User { id: toInteger(row.userId) })

MERGE (u)-[r:RATED]->(m)
ON CREATE SET r.rating = toFloat(row.rating), r.timestamp = datetime({epochSeconds: toInteger(row.timestamp)})


// links (useless)
