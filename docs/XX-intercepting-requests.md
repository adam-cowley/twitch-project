# Handling Neo4j Constraint Errors with Nest Interceptors

> The definition of insanity is doing the same thing over and over again, but expecting different results.
> - Albert Einstein

One thing that we haven't tested yet is that our constraints are correctly handled in our API.  You may recall that while implementing the [Authentication](04-authentication.md) functionality, we created a unique constraint to ensure that the `email` property was unique for any node with a `User` label:

```cypher
CREATE CONSTRAINT ON (u:User) ASSERT u.email IS UNIQUE
```

We can simulate the behaviour of two users attempting to sign up with the same email address by using Cypher's `range` function to generate a collection with two numbers and using [`UNWIND`](https://neo4j.com/docs/cypher-manual/current/clauses/unwind/) to unpack them on to their own rows.

```cypher
UNWIND range(1, 2) AS row
CREATE (u:User {email: "duplicate@email.com"})
```

Running a `CREATE` command with the same email address will cause Neo4j to throw a Client Error

```
Neo.ClientError.Schema.ConstraintValidationFailed
Node(54776) already exists with label `User` and property `email` = 'duplicate@email.com'
```

Similarly, if we create an [`exists` constraint](https://neo4j.com/docs/cypher-manual/current/administration/constraints/#administration-constraints-prop-exist-nodes),

```cypher
CREATE CONSTRAINT ON (t:Test) ASSERT exists(t.mustExist);

CREATE (:Test)
```

This will also return a `ConstraintValidationFailed` error, but instead with a different error message:

```
Neo.ClientError.Schema.ConstraintValidationFailed
Node(54778) with label `Test` must have the property `mustExist`
```



The JavaScript driver will instantiate these errors as a [`Neo4jError`](https://github.com/neo4j/neo4j-javascript-driver/blob/4.1/src/error.js).  We can use an _Interceptor_ to catch these Neo4jErrors and instead return a more appropriate response.


## What is an Interceptor?

[`Interceptor`](https://docs.nestjs.com/interceptors) is a term used in Nest.js to describe a class with a `@Injectable()` decorator that implement an `intercept` method.  These are designed to _intercept_ a request to bind logic to a request or transform the output of a response.

By default, Nest will return a  `HTTP 500` error code, representing an Internal Server Error.  This is a generic response to signify that something has gone wrong on the server, rather than it being the cause of the request.

In our case, we'll want to catch any `Neo4jError`s and convert them into the same response returned by the `ValidationPipe`.  The `ValidationPipe` throws a `BadRequestException` (exported from `@nestjs/common`) with an array of errors.  Nest then interprets this error as a `HTTP 400 Bad Request` - signifying that the client should not repeat this request without modification.  We'll want to mimic this behaviour so that the UI can handle this constraint error  validation errors in the same way.

The Nest CLI has a command for generating interceptors, so if we navigate into the neo4j directory we can run the following command to generate the interceptor class:

```sh
cd src/neo4j
nest g in neo4j-error # nest generate interceptor neo4j-error
```

The command will generate the skeleton class that implements the `NestInterceptor` class and an `intercept` method.  The method takes two arguments, the `ExecutionContext` that we can use to

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class Neo4jErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}

```