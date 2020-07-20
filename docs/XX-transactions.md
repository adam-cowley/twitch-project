
## Transaction Interceptors

At the moment, we're using what are called Auto-commit Transactions.  When calling `session.run()`, the driver instructs Neo4j to open a new transaction, run the Cypher query and then commit the transaction.  But this isn't necessarily the most efficient approach.  At the end of each transaction, the changes need to be written to the transaction log which adds some overhead to the query.

Ideally, we should run the queries to create the User and Subscription nodes within the same transaction.

To do this, we can add an [`Interceptor`](https://docs.nestjs.com/interceptors) to the route handler.



In order to support this, we can change the signature of the `read` and `write` methods on the `Neo4jService` to either accept a `string` to represent the database to open a session with or an instance of a `Transaction` which will be instantiated in the Interceptor.

```ts
read(cypher: string, params?: Record<string, any>, databaseOrTransaction?: string | Transaction): Result {
        if ( databaseOrTransaction === undefined || typeof databaseOrTransaction === 'string' ) {
            const session = this.getReadSession(<string | undefined> databaseOrTransaction)
            return session.run(cypher, params)
        }

        const tx = databaseOrTransaction as Transaction
        return tx.run(cypher, params)

    }

    write(cypher: string, params?: Record<string, any>, databaseOrTransaction?: string | Transaction): Result {
        if ( databaseOrTransaction === undefined || typeof databaseOrTransaction === 'string' ) {
            const session = this.getWriteSession(<string | undefined> databaseOrTransaction)
            return session.run(cypher, params)
        }

        const tx = databaseOrTransaction as Transaction
        return tx.run(cypher, params)
    }
```