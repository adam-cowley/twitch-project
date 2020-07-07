


## Adding a new Feature

Refactoring data in Neo4j is easier than many other databases.  Because Neo4j is Schema ~~free~~ optional, there is minimal effort required to add a new Label or Relationship type.  If constraints or indexes are required, these commands will have to be run as part of a refactoring/migration script but there is no need to alter anything else.  Adding a new Node or relationship type is as simple as running a Cypher statement.

```cypher
CREATE (n:NewLabel)
```

So, say for example we wanted to rename the `:User` label to `:Customer`, we could run a script to match all nodes with that label, remove it and add the new label.

```cypher
MATCH (u:User)
REMOVE u:User
SET u:Customer
```

