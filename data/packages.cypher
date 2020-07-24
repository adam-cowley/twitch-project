CREATE CONSTRAINT ON (p:Package) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT ON (s:Subscription) ASSERT s.id IS UNIQUE;

// Regular Packages
LOAD CSV WITH HEADERS FROM 'file:///packages.csv' AS row
MERGE (p:Package {id: toInteger(row.id)})
SET p.name = row.name,
  p.duration = duration('P'+ row.days +'D'),
  p.price = toFloat(row.price)

FOREACH (name IN split(row.genres, '|') |
	MERGE (g:Genre {name: name})
  MERGE (p)-[:PROVIDES_ACCESS_TO]->(g)
);

// Free Trial
CREATE (p:Package {
  id: 0,
  name: "Free Trial",
  price: 0.00,
  duration: duration('P30D')
})
WITH p
MATCH (g:Genre)
CREATE (p)-[:PROVIDES_ACCESS_TO]->(g);

