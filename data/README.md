# Data Import

**Source:** https://www.kaggle.com/rounakbanik/the-movies-dataset

## Importing to Neo4j

This data can be imported using a combination of `LOAD CSV` in Cypher and APOC.

Either copy the CSV files into the `import/` folder inside Neo4j's home folder, or set the `dbms.directories.import` setting in `neo4j.conf` to this folder.  For example:

```conf
# neo4j.conf
dbms.directories.import=/path/to/project/data
```

Then you can use LOAD CSV to explore and load the data:

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

## Import Scripts

If you don't want to write your own, the [load.cypher](./load.cypher) file contains Cypher statements for creating constraints and loading the data into Neo4j.

The script takes a while, but imports 710K nodes and 12.9M relationships.

```
# MATCH (n) RETURN labels(n), count(n)
╒═════════════════════╤══════════╕
│"labels(n)"          │"count(n)"│
╞═════════════════════╪══════════╡
│["Movie"]            │45331     │
├─────────────────────┼──────────┤
│["Movie","Video"]    │93        │
├─────────────────────┼──────────┤
│["Movie","Adult"]    │9         │
├─────────────────────┼──────────┤
│["Language"]         │133       │
├─────────────────────┼──────────┤
│["Country"]          │161       │
├─────────────────────┼──────────┤
│["Genre"]            │20        │
├─────────────────────┼──────────┤
│["ProductionCompany"]│23693     │
├─────────────────────┼──────────┤
│["Collection"]       │1695      │
├─────────────────────┼──────────┤
│["Person"]           │353343    │
├─────────────────────┼──────────┤
│["Keyword"]          │19956     │
├─────────────────────┼──────────┤
│["User"]             │265917    │
└─────────────────────┴──────────┘

# MATCH (n)-[r]->(m) RETURN  labels(n), labels(m), type(r), count(*)
╒═════════════════╤═════════════════════╤═════════════════════╤══════════╕
│"labels(n)"      │"labels(m)"          │"type(r)"            │"count(*)"│
╞═════════════════╪═════════════════════╪═════════════════════╪══════════╡
│["Person"]       │["Movie"]            │"CAST_FOR"           │560342    │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Person"]       │["Movie"]            │"CREW_FOR"           │422516    │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["User"]         │["Movie"]            │"RATED"              │11435589  │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Person"]       │["Movie","Video"]    │"CREW_FOR"           │216       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Person"]       │["Movie","Video"]    │"CAST_FOR"           │464       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["User"]         │["Movie","Video"]    │"RATED"              │718       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Person"]       │["Movie","Adult"]    │"CAST_FOR"           │31        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Person"]       │["Movie","Adult"]    │"CREW_FOR"           │70        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["User"]         │["Movie","Adult"]    │"RATED"              │261       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Language"]         │"SPOKEN_IN_LANGUAGE" │53180     │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Language"]         │"SPOKEN_IN_LANGUAGE" │80        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["Language"]         │"SPOKEN_IN_LANGUAGE" │9         │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Language"]         │"ORIGINAL_LANGUAGE"  │45320     │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Language"]         │"ORIGINAL_LANGUAGE"  │93        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["Language"]         │"ORIGINAL_LANGUAGE"  │9         │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Country"]          │"PRODUCED_IN_COUNTRY"│49310     │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Country"]          │"PRODUCED_IN_COUNTRY"│56        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["Country"]          │"PRODUCED_IN_COUNTRY"│9         │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Genre"]            │"IN_GENRE"           │90845     │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Genre"]            │"IN_GENRE"           │152       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["Genre"]            │"IN_GENRE"           │18        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["ProductionCompany"]│"PRODUCED_BY"        │70418     │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["ProductionCompany"]│"PRODUCED_BY"        │49        │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["ProductionCompany"]│"PRODUCED_BY"        │9         │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Collection"]       │"IN_COLLECTION"      │4484      │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Collection"]       │"IN_COLLECTION"      │4         │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie"]        │["Keyword"]          │"HAS_KEYWORD"        │156438    │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Video"]│["Keyword"]          │"HAS_KEYWORD"        │128       │
├─────────────────┼─────────────────────┼─────────────────────┼──────────┤
│["Movie","Adult"]│["Keyword"]          │"HAS_KEYWORD"        │36        │
└─────────────────┴─────────────────────┴─────────────────────┴──────────┘
```
