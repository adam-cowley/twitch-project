# Tech Stack

## Backend

### Neo4j

If you're subscribed to this channel then you are likely familiar with Neo4j, but if not then Neo4j is the world's leading Graph Database.  Rather than tables or documents, Neo4j stores it's data in Nodes - those nodes are categorised by labels and contain properties as key/value pairs.  Those Nodes are connected together by relationships, which are categorised by a type and can also contain properties as key/value pairs.
```
(a:Person {name: "Adam"})-[:USES_DATABASE {since: 2015}]->(neo4j:Database:GraphDatabase {name: "Neo4j", homepage: "neo4j.com"})
```

What sets Neo4j apart from other databases is it's ability to query connected datasets.  Where traditional databases build up joins between records at read time, Neo4j stores the data

Neo4j is schema-optional - meaning that you can enforce a schema on your database if necessary by adding unique or exists constraints on Nodes and Relationships.

### Typescript

I've been experimenting with [Typescript](https://www.typescriptlang.org/) for a while now, and the more I use it the more I like it.

Typescript is essentially Javascript but with additional static typing.  Under the hood, it compiles down to plain Javascript but it improves the developer experience a lot, and allows you to identify problems in real-time as you are writing your code.


### NestJS

By far the best framework I have seen that supports typescript is NestJS.  NestJS is an opinionated framework for building server-side applications.  It also includes modern features you'd expect in a modern framework like Spring Boot or Laravel - mainly Dependency Injection.


## Front end

### TBD
