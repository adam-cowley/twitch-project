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

The JavaScript driver will instantiate these errors as a [`Neo4jError`](https://github.com/neo4j/neo4j-javascript-driver/blob/4.1/src/error.js).  If this, or any other Error is thrown during the request lifecycle, it will be caught by an [Exception Filter](https://docs.nestjs.com/exception-filters).

There are a number of built in Errors that the Exception Filter will recognise, but by default the application will return a  `HTTP 500` error code, representing an Internal Server Error.  This is a generic response to signify that something has gone wrong on the server, rather than it being the cause of the request.

Instead, because this is an error caused by the input, we should provide a response similar to the one provided by the `ValidationPipe` that checks the response against the directorators of the `CreateUserDto` Data Transfer Object.

To do this, we can create an Exception filter.

## `@Catch`ing the Error

An Exception Filter is a class decorated with the `@Catch` decorator (imported from `@nestjs/common`) - the decorator accepts many arguments representing the type of `Error` that should be caught by the filter.  The class implements the `ExceptionFilter` class exported from `@nestjs/core` and contains a `catch` method.  This method takes the error object that has been thrown in the application, and an instance of `ArgumentsHost` which allows us to get the Request and Response objects.


The Nest CLI has a method for generating filters: `nest generate filter {name}`.  The command generates the file inside the current directory, so we'll have to navigate into the correct folder before running the command:

```sh
cd src/neo4j
nest g f neo4j-error
```

If we replace the default error in the generated class with `Neo4jError` and update the type of the first argument in the `catch` method we should have a class similar to this.

```ts
// neo4j-error.interceptor.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { Neo4jError } from 'neo4j-driver';

@Catch(Neo4jError)
export class Neo4jErrorFilter implements ExceptionFilter {
    catch(exception: Neo4jError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // ...

        response
            .status(statusCode)
            .json({
                statusCode,
                message,
                error,
            });
    }
}
```

Because all of the errors thrown from Neo4j instantiate the same class, we'll have to use the `message` property to work out what the error is.  Based on the error messages earlier, we can tell that a string containing `already exists with` will indicate that the error is due to the unique constraint, and a string containing `must have the property` means that the query has failed on an exists constraint.


```ts
if ( exception.message.includes('already exists with') ) {
    // The value supplied isn't unique
}
else if ( exception.message.includes('must have the property') ) {
    // Fails the exists constraint
}
```

Neo4j will throw a variety of errors from anything from failed connection to the server to things like Cypher syntax errors.  For this reason, we should treat all other cases as a `500 Internal Error`.


We can see from both error messages that the label and property name are contained in backticks:

```
Node(54776) already exists with label `User` and property `email` = 'duplicate@email.com'
Node(54778) with label `Test` must have the property `mustExist`
```

So we can use the `match` function to extract a regex pattern with anything.

```ts
const [ label, property ] = exception.message.match(/`([a-z0-9]+)`/gi)
```

The `/gi` flags at the end of the statement tell the function that it should run a global match (`g`) and return an array of matched values and the `i` flag denotes that the pattern is case insensitive.

As the function will return an array of values, and we know that the order will be correct, we can use destructuring to pass the label and property straight into a variable.

All that is left is to update the status code, error and message as appropriate:

```ts
let statusCode = 500
let error = 'Internal Server Error'
let message: string[] = undefined

// Neo.ClientError.Schema.ConstraintValidationFailed
// Node(54776) already exists with label `User` and property `email` = 'duplicate@email.com'
if ( exception.message.includes('already exists with') ) {
    statusCode = 400
    error = 'Bad Request'

    const [ label, property ] = exception.message.match(/`([a-z0-9]+)`/gi)
    message = [`${property.replace(/`/g, '')} already taken`]
}
// Neo.ClientError.Schema.ConstraintValidationFailed
// Node(54778) with label `Test` must have the property `mustExist`
else if ( exception.message.includes('must have the property') ) {
    statusCode = 400
    error = 'Bad Request'

    const [ label, property ] = exception.message.match(/`([a-z0-9]+)`/gi)
    message = [`${property.replace(/`/g, '')} should not be empty`]
}

response
    .status(statusCode)
    .json({
        statusCode,
        error,
        message,
    });
```

The final thing that is needed is to add this as a global filter in `main.ts`:

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Neo4jTypeInterceptor } from './neo4j/neo4j-type.interceptor';

// Import the new Neo4jErrorFilter class
import { Neo4jErrorFilter } from './neo4j/neo4j-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new Neo4jTypeInterceptor());

  // Use the Neo4j Error Filter on all rooutes
  app.useGlobalFilters(new Neo4jErrorFilter());

  await app.listen(3000);
}
bootstrap();

```

## Testing the Filter

To ensure that this works correctly, we can add a new test case to the end-to-end tests in `app.e2e-spec.ts`.   Firstly, in the `beforeEach` hook, we need to register the global filter on the test application:

```ts
// app.e2e-spec.ts
beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new Neo4jTypeInterceptor());
    app.useGlobalFilters(new Neo4jErrorFilter());
    await app.init();
});
```

Then we can copy down the same test from `should return HTTP 200 successful on successful registration`.  Because these tests are run in sequence, we can guarantee that the user has been created in the first test before the second is run.

We'll need to update the status code to be 400 instead of 201, and the body of the response should include an array of error messages including one saying that the email address has already been taken:

```ts
it('should return HTTP 200 successful on successful registration', () => {
    return request(app.getHttpServer())
        .post('/auth/register')
        .set('Accept', 'application/json')
        .send({
            email,
            password,
            dateOfBirth: '2000-01-01',
            firstName: 'Adam',
            lastName: 'Cowley'
        })
        .expect(201)
        .expect(res => {
            expect(res.body.access_token).toBeDefined()
        })
})

it('should return HTTP 400 when email is already taken', () => {
    return request(app.getHttpServer())
        .post('/auth/register')
        .set('Accept', 'application/json')
        .send({
            email,
            password,
            dateOfBirth: '2000-01-01',
            firstName: 'Adam',
            lastName: 'Cowley'
        })
        // Should return 400 instead of 201
        .expect(400)
        .expect(res => {
            // The body should return the `already taken` error
            expect(res.body.message).toContain('email already taken')
        })
})
```

If everything has been registered successfully, the npm run test:e2e should report that all of our tests are passing:

```sh
npm run test:e2e

> api@0.0.1 test:e2e /Users/adam/projects/twitch/api
> jest --detectOpenHandles --config ./test/jest-e2e.json

 PASS  test/app.e2e-spec.ts (5.041 s)
  AppController (e2e)
    Auth
      POST /auth/register
        ✓ should validate the request (347 ms)
        ✓ should return HTTP 200 successful on successful registration (108 ms)
        ✓ should return HTTP 400 when email is already taken (106 ms)
      POST /auth/login
        ✓ should return 401 if username does not exist (49 ms)
        ✓ should return 401 if password is incorrect (104 ms)
        ✓ should return 201 if username and password are correct  (98 ms)
```

## Conclusion

Now that we are returning the correct response to errors caused by database constraints, the UI be able to treat these errors the same as it would with the validation errors returned by the `ValidationPipe`.  As this error is also fully expected, we can reduce the amount internal server errors sent to our monitoring tools and cut down on the amount of debugging time.

### Futher Reading

- [Neo4j Cypher Manual: Constraints](https://neo4j.com/docs/cypher-manual/current/administration/constraints/#administration-constraints-prop-exist-nodes)
- [Nest.js Exception Filters](https://docs.nestjs.com/exception-filters)

