# Authentication

Authentication is a key part of any subscription or SaaS site.  For every request, we should be able to verify who the user is and whether they have the correct subscription to do what they are trying to do.  As such, API calls to view or stream any content via the API will require valid user credentials.  To enforce this, we will use a combination of [Nest.js Guards](https://docs.nestjs.com/guards) and [JWT](https://jwt.io/) tokens.

To provide Authentication we will need REST endpoints to allow users to create an account and then to log in with those credentials.  We will be using a combination of Email address and Password as the method for authentication so that the user doesn't need to supply an email address and a username.


## JWTs

JWT's (pronounced JOT) - short for JSON Web Tokens - are compact tokens - backed by an [open standard (RFC 7519)](https://tools.ietf.org/html/rfc7519) - that are designed to provide a secure way of transmitting information between parties - or in our case sharing user authentication information between the API and front end.

On the surface, a JWT token could look a little like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

This is a base64 encoded string which contains three pieces of information, split by a dot.

### The Header

When decoded, the header will contain information about the type of token and the algorithm that has been used to sign the token.
```json

{
  "alg": "HS256",
  "typ": "JWT"
}
```

### The Payload

The token's payload is a base64 encoded JSON object that contains certain *claims* about the User, for example information about who they are. Although there are some reserved claims (for example the *issuer* or `iss`, *subject* or `sub` and *expiry* or `exp`), any information can be added to the payload. It is worth remembering that the payload of a JWT token can be easily decoded, so this shouldn't contain any sensitive information about the user.  In our case, we will add some basic information about the User into the token so that the UI can be customised without making unnecessary requests to the API.

```json
{
  "iss": "our-api",
  "sub": "user-1234",
  "exp": 1595245369
}
```

In the example above, the token has been issued by `our-api` for `user-1234` with an expiry time of `1595245369` - seconds since epoch.


### The Signature

The signature ensures that the information held in the payload has not been tampered with.  After base64 encoding the payload, a signature is generated using a secret passphrase or PEM key.  When the key is read, the signature is regenerated and checked against the value provided.  If the two signatures do not match then the token is rejected.  This ensures that as long as no one knows the key used to sign the original token, the contents will always be valid.


## Adding Authentication to Nest

Nest.js comes with a built in module for [Passport](https://github.com/jaredhanson/passport), a widely used library for authenticating users.  We will be using it to validate each request, generate [JWT](https://jwt.io/) tokens during the login process, and verify those tokens in subsequent requests.  But before we get into that, we'll need to create an Authentication Service to handle the business logic.

To follow the conventions set out by Nest, we should create a new module which we can register in the main application. This module should provide access to a service which will handle the authentication and a controller to accept the HTTP requests.

```sh
nest g mo auth
nest g s auth
nest g co auth
```

The Auth Service shouldn't be tasked with querying the user information, so we should also create a User Module and Service to handle communication with the database.  This has the added benefit of allowing us to share this functionality across the application rather than duplicating the code - meaning we adhere to the principles of DRY (Don't Repeat Yourself).  If we want to create or find a User, we can just inject the User Service into a class.

```sh
nest g mo user
nest g s user
```

### Ensuring Emails are Unique

Because users will be authenticating with their email address, we need to make sure that an email address is unique.  We could add a check as part of the validation stage to check if the username exists but this would double the number of requests required and also add network latency to the request time.

Instead, we can add a constraint to the database to ensure that the `email` property is unique for any node with a `:User` label.  To do this, we can run a `CREATE CONSTRAINT` statement in Neo4j:

```cypher
CREATE CONSTRAINT ON (u:User) ASSERT u.email IS UNIQUE
```

Now if the user passes all other validation required by the application layer, the database will throw a `ClientException` which we can catch in the API.


### Registering as a User - `POST /auth/register`

Before we can authenticate a User, it has to exist in the database.  So the first thing to do would be to create an endpoint to allow a User to create an account.

We'll need to create a [DTO](https://docs.nestjs.com/controllers#request-payloads) (Data Transfer Object) to represent the payload that the function should receive.  By using the `@Body()` decorator, Nest will coerce the request body into the class that has been type-hinted by the route handler.

The root folder of the module is getting a little crowded already, so I personally prefer to create a `dto/` folder to hold the DTO classes.

```sh
mkdir src/user/dto
touch src/user/dto/create-user.dto.ts
```

An added benefit of DTO's is that if we add decorators to the properties, Nest will automatically validate the request and reject any requests that don't meet the requirements that have been set out.  `@nest/core` comes with a [ValidationPipe](https://docs.nestjs.com/techniques/validation) that we'll need to register as a Global Pipe in the `bootstrap` function in `main.ts`.

[Pipes](https://docs.nestjs.com/pipes) are injectable classes that either transform or validate inputs into the application. - For example, the `ParseIntPipe` can be used to transform a URL parameter into a `number` type.

The ValidationPipe uses the `class-validator` and `class-transformer` packages so we'll have to install those:

```ts
npm i --save class-validator class-transformer
```

Then register the ValidationPipe as a Global Pipe in `main.ts` to ensure that it is used for all HTTP requests.

```ts
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  // Use Global Pipes
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
```

For a User to register, we'll need an email address and password.  Then to personalise their service a name, and date of birth will be useful for controlling.  The user's date of birth will be also required to ensure that a User can access the content they've requested.

We'll add some validation on the date to ensure that the user is at least 13 years old in accordance with UK law.  To do this, we can use the `moment` package - `npm i moment` and subtract 13 years.


The `create-user.dto.ts` should look something like this:

```sh
import { Type } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsDate, MaxDate } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    @IsDate()
    @MaxDate(require('moment')().subtract(13, 'y').toDate())
    @Type(() => Date)
    dateOfBirth: Date;

    firstName: string;
    lastName: string;
}
```

The `@Type` decorator from 'class-transformer' will take the value and transform it into a `Date`.

**Note:** At the time of writing, the `moment` library wasn't playing well with typescript imports.  After a quick google, I found that adding `"esModuleInterop": true,` to `compilerOptions` in `tsconfig.json` seemed to do the trick.

Next, the route in `auth.controller.ts`.  Any routes in the auth controller are prefixed with `auth/` as defined in the `@Controller` decorator, so to create a REST endpoint for a POST request to /auth/register, we can create the `@Post` decorator.

```ts
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly userService: UserService) {}

    @Post('register')
    async postRegister(@Body() createUserDto: CreateUserDto) {
        // TODO: Create User
        return createUserDto
    }

}
```

#### Nest can't resolve dependencies of ???

If you're running the code in dev mode, you'll now see something along the lines of:

```
[ExceptionHandler] Nest can't resolve dependencies of the AuthController (?). Please make sure that the argument UserService at index [0] is available in the AuthModule context.

Potential solutions:
- If UserService is a provider, is it part of the current AuthModule?
- If UserService is exported from a separate @Module, is that module imported within AuthModule?
  @Module({
    imports: [ /* the Module containing UserService */ ]
  })
```

Ahh, dependency injection, our old friend.  Nest doesn't recognise `UserService`, so to fix this error we'll need to:
1. Add `UserModule` as an import to the `AuthModule` so that anything exported from Auth module can be injected into classes in the User module
   ```ts
   // auth.module.ts
   import { UserModule } from '../user/user.module';

    @Module({
      imports: [UserModule],
      providers: [AuthService],
      controllers: [AuthController]
    })
    export class AuthModule {}
   ```
1. Add an `exports` array containing `UserService` to `UserModule` so that modules that Nest's IoC container recognises the module.
    ```ts
    import { UserService } from './user.service';
    @Module({
      providers: [UserService],
      exports: [UserService],
    })
    export class UserModule {}
    ```

_There's nothing like a live coding disaster to cement a solution into your head._

### Testing the Endpoint

To verify this is working, we could write a cURL request or open up [Postman](https://www.postman.com/).  But instead, let's look at writing a test.  So far we've not looked at tests, but you may have noticed that when we ran the `nest g co auth` command, an `auth.controller.spec.ts` file was also generated.

If we run the following command, the `jest` rest runner will run in watch mode.  This is really useful for development because the test runner will watch for changes to files and automatically re-run tests.  So if a change in one file breaks another, you'll know instantly.

```sh
npm run test:watch
```

Because we've not looked at this yet there will be a load of failures but let's not worry about them too much for now.  Instead, the last few lines gives instructions on how to filter the tests that are being run.

```
Test Suites: 4 failed, 1 passed, 5 total
Tests:       2 failed, 1 passed, 3 total
Snapshots:   0 total
Time:        1.474 s, estimated 2 s
Ran all test suites related to changed files.

Watch Usage
 › Press a to run all tests.
 › Press f to run only failed tests.
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.
```

I usually like to run only the tests that have failed (option `f`), but right now we're only interested in the Auth controller.

We can type `p` to filter the tests by filename, then type `auth.controller` to only run the tests in `auth.controller.spec.ts`.

We really should add some tests to `auth.controller.spec.ts` but for now, end-to-end tests are more appealing because they will test whether the guard is working or not.  Where the existing tests are great for testing smaller 'units' of cod, an end-to-end test will ensure that the entire stack is working correctly.

<!-- In the real world, you would use unit tests to test small units of functionality for a given input, and "mock" dependencies to

- "mocking" injected classes to test how a method would react given certain inputs from  -->

The `nest new` command generates an `app.e2e-spec.ts` file which creates a test module that automatically includes everything that has been imported into the `AppModule`, so it will already have our `AuthController` registered.

If we run the end-to-end tests using the `npm run test:e2e` it'll currently fail because the default test expects `GET /` to return Hello World but we've already updated it.  It's kind of an irrelevant test so for now we can just comment it out.

Jest's `describe` function allows you to group tests together to make the results more readable.  We'll be testing the Auth functionality, we can create a group called 'Auth', then inside call the function again to group the tests for the register endpoint.

```ts
describe('Auth', () => {
    describe('POST /auth/register', () => {
        // Tests go here:
    })
})
```

Then, the `it` function defines the test.  I always like to start my tests with `should` so it kind of reads like a sentence but go with whatever you see fit.

The first thing it should do is validate the response based on the decorators in the DTO.  Nest will return a `HTTP 400 Bad Request` status code, so we can verify that

```ts
  describe('Auth', () => {
    describe('POST /auth/register', () => {
      it('should validate request', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('Accept', 'application/json')
          .send({
            email: 'a@b.com',
            dateOfBirth: '2019-01-01'
          })
          .expect(400)
          .expect(res => {
            // Check the body
            console.log(res.body)

            // Should have an error about the password
            expect(res.body.message).toContain('password should not be empty')

            // Should have an error about the date being later than 13 years ago
            expect(
              res.body.message.find((m: string) => m.startsWith('maximal allowed date for dateOfBirth'))
            ).toBeDefined()
          })
      })
    })
  })
```

Right now the test will fail:

```
> api@0.0.1 test:e2e /Users/adam/projects/twitch/api
> jest --config ./test/jest-e2e.json

 FAIL  test/app.e2e-spec.ts
  AppController (e2e)
    Auth
      POST /auth/register
        ✕ should validate request (203 ms)

  ● AppController (e2e) › Auth › POST /auth/register › should validate request

    expected 400 "Bad Request", got 201 "Created"

Ran all test suites.
Jest did not exit one second after the test run has completed.

This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.

```

This is because we've not yet registered the `ValidationPipe` to the test application used within the test.  We'll have to add this line using the `useGlobalPipes` function as we did in `main.ts`:

```ts
// app.e2e-spec.ts
beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  // Use Validation Pipe
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
});
```

Now an error appear at the bottom of the test complaining that:

```
Jest did not exit one second after the test run has completed.
```

This is occurring because the Neo4j Driver instance is left open, and therefore the Nest application doesn't exist within the second window that Jest expects.  To fix this, we'll have to call the `close` method on the app.  Calling `app.close()` after all of the tests have run will call the `onApplicationShutdown` method on the `Neo4jService` to  be called, closing any sessions that are still left open.


```ts
// app.e2e-spec.ts
afterAll(() => app.close())
```

For the next test, the API should return a `HTTP 201 Created` status with the User's information if the user supplies the correct information.

```ts
it('should return a JWT token on successful registration', () => {
  const email = `${Math.random()}@adamcowley.co.uk`
  return request(app.getHttpServer())
    .post('/auth/register')
    .set('Accept', 'application/json')
    .send({
      email,
      firstName: 'Adam',
      lastName: 'Cowley',
      password: Math.random().toString(),
      dateOfBirth: '2000-01-01'
    })
    .expect(201)
    .expect(res => {
        expect(res.body.user.email).toEqual(email)
    })
})
```

### Persisting the Data

The tests now pass, but nothing is happening.  We next need to persist the data in the database.  The AuthController shouldn't hold any logic as to how a User is created, so this responsibility should be passed on to another class - in this case we'll use the `UserService` generated earlier.  So, in `src/users/user.service.ts`, we should create a new method for creating a User.

For now, we don't have any entities in the code, so we can define the `User` type as a Node from `neo4j-driver`.

```ts
// user.service.ts
import { Node } from 'neo4j-driver';

export type User = Node;
```
Then, the `create` method will take named parameters so that we can reflect the business logic  defined in the `CreateUserDto` (email, password and dateOfBirth are required but the first and last name are optional), then pass on a cypher `CREATE` query to the `Neo4jService`.

```ts
// user.service.ts
import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Node, types } from 'neo4j-driver';

export type User = Node;

@Injectable()
export class UserService {

  constructor(private readonly neo4jService: Neo4jService) {}

  async create(email: string, password: string, dateOfBirth: Date, firstName?: string, lastName?: string): Promise<User> {
    const res = await this.neo4jService.write(`CREATE (u:User) SET u.id = randomUUID(), u += $properties RETURN u`, {
      properties: {
        email,
        password,
        firstName,
        lastName,
        dateOfBirth: types.Date.fromStandardDate(dateOfBirth),
      }
    })

    return res.records[0].get('u');
  }
}

```

It's a really bad idea to store plain text passwords in the database, so we'll install the `bcrypt` library which will encrypt the plain passwords when an account is created and also check the plain text password against the encrypted value stored in the database.

```sh
npm i --save bcrypt
```

Next, we'll need to create a new encryption service which will be responsible for encrypting and comparing passwords.

```sh
nest g mo encryption
nest g s encryption
```

The service should offer two functions, one to hash a plain text password and another to compare the password that the user has entered against the hashed valued stored in the database.

```ts
// encryption.service.ts
import { hash, compare } from 'bcrypt'
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    constructor(private readonly config: ConfigService) {}

    async hash(plain: string): Promise<string> {
        return hash(plain, this.config.get<number>('HASH_ROUNDS', 10))
    }

    async compare(plain: string, encrypted: string): Promise<boolean> {
        return compare(plain, encrypted)
    }
}
```

**Note:**  Here we're using the `ConfigService` which was previously registered as a global module inside `app.module.ts` to get the `HASH_ROUNDS` config value from our environment variables.


In order to inject the `EncryptionService` into other services, this will need to be added to the `exports` array of the `EncryptionModule`.

```ts
// encryption.module.ts
import { EncryptionService } from './encryption.service';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
```

The `EncryptionModule` can then be added as an import to the `UserModule`:

```ts
// user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule], // <-- Import Encryption into User Service
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

```

...and subsequently injected into the UserService to hash the password.

```ts
// user.service.ts
export class UserService {

    constructor(
        private readonly neo4jService: Neo4jService,
        // Add Encryption Service to the constructor
        private readonly encryptionService: EncryptionService
    ) {}

    async create(email: string, password: string, dateOfBirth: Date, firstName: string, lastName: string): Promise<User> {
        const res = await this.neo4jService.write(`CREATE (u:User) SET u += properties RETURN u`, {
            email,
            // Use the encryption service to hash the password
            password: await this.encryptionService.hash(password),
            firstName,
            lastName,
            dateOfBirth: Neo4jDate.fromStandardDate(dateOfBirth)
        })

        return res.records[0].get('u');
    }
}
```

Next, the `AuthModule` needs to be updated to import the `UserModule`:

```ts
// auth.controller.t
import { EncryptionService } from './encryption/encryption.service';

@Module({
  imports: [UserModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
```

Then, the `UserService` can be injected and used in the `AuthController`:

```ts
// auth.controller.ts
constructor(private readonly userService: UserService) {}

@Post('register')
async postRegister(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(
        createUserDto.email,
        createUserDto.password,
        new Date(createUserDto.dateOfBirth),
        createUserDto.firstName,
        createUserDto.lastName
    )

    return {
        user: user.properties
    }
}
```

If we run the test again, the two tests should now pass.

```
> api@0.0.1 test:e2e /Users/adam/projects/twitch/api
> jest --forceExit --config ./test/jest-e2e.json

 PASS  test/app.e2e-spec.ts
  AppController (e2e)
    Auth
      POST /auth/register
        ✓ should validate request (254 ms)
        ✓ should return a JWT token on successful registration (128 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        3.338 s, estimated 4 s
Ran all test suites.
```

[A quick query in `cypher-shell`](https://neo4j.com/docs/operations-manual/current/tools/cypher-shell/) should show that the `:User` Node has been created with a hashed password:

```
neo4j@neo4j> MATCH (u:User) WHERE exists(u.email) RETURN u.id, u.email, u.password, u.dateOfBirth;
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| u.id                                   | u.email                               | u.password                                                     | u.dateOfBirth |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| "d786d248-af60-49ca-b389-3fe423b9a1cf" | "0.4030098705180425@adamcowley.co.uk" | "$2b$10$YWBng/jeA7nJVZ1/aCtnG.lHLJCqDctHrVL.7SW/aHpU307xEw1Ry" | 2000-01-01    |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

But at the moment, there is still a problem.  We're currently returning all of the user's properties including the hashed password which isn't a good idea, and also this method will require the user to send another request in order to log in.  Instead, we should generate and return a JWT token with selected information about the user.

### Generating JWT Tokens - `POST /auth/login`

To log in, a user will have to send a `POST` request to `/auth/login` with their username and password.  In exchange, they will receive a JWT token containing some basic user details and an expiry timestamp.

So, the first thing to do is to create a route handler in the `AuthController`:

```ts
// auth.controller.ts
@Post('login')
async postLogin(@Request() request: Request) {
  // ...
}
```

#### Validating Users

To validate the user, we'll create a `validateUser` method in the `AuthService`  This should accept a username and plaintext password, find the User by its email address (with the help of the `UserService`) and then use the `EncryptionService` to check the password.   If the user has been found and the password check is OK, then it should return a `User` object, otherwise it should return null.


```ts
// auth.service.ts
ssync validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email)

    if ( user && this.encryptionService.compare(password, (user.properties as Record<string, any>).password) ) {
        return user
    }

    return null
}
```

**NB:** We should probably create an interface for a User's properties at some point.

Then, in the `UserService`, we need to create a method that will query Neo4j for a User with that email:

```ts
async findByEmail(email: string): Promise<User | undefined> {
  const res = await this.neo4jService.read(`MATCH (u:User {email: $email}) RETURN u`, { email })

  return res.records.length ? res.records[0].get('u') : undefined;
}
```

In order to generate a token, we'll use Passport. Passport acts as a _middleware_, authenticating requests using using *strategies*.  In basic terms, a strategy is a class which implements a a `validate` method.  The validate method will check the context of the request (ie. check the user's credentials or a token) and stop the request by throwing an error if anything goes wrong.

The `@nestjs/passport` library contains all of the helper functions required to integrate Passport into Nest.

<!-- `@nestjs/passport` is a utility library which includes handy clases for implementing [Guard](https://docs.nestjs.com/guards). -->

Alongside Passport, we will use [Passport Local](http://www.passportjs.org/packages/passport-local/), an out-of-the-box add-on for Passport that allows you to perform basic authenticating using a Username and Password.

#### Installing Passport and Passport Local Dependencies

```sh
npm i --save @nestjs/passport passport passport-local
npm i --save-dev @types/passport-local
```

#### Building a Local Strategy

To implement a local strategy, we can extend the `PassportStrategy` from the package and register it as a provider in the `AuthModule`.

For the local-strategy, Passport expects a `validate` method with the following signature: `validate(username: string, password:string): any`.  The strategy will be `@Injectable` so we can use it in any modules that import the `AuthModule`.  Inside the auth folder, create a new file called `local.strategy.ts`:

```sh
touch src/auth/local.strategy.ts
```

```ts
// local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

By default the LocalStrategy will look for a field in the request named `username`, but as we want the user to log in with their email address, we can customise the behaviour by passing an object into the the `super()` call within the constructor stating that the `usernameField` should be instead be the `email` in the request.

The `validate` method on this class calls the `validateUser` method that we created earlier, and if a User object hasn't been returned it will halt the request by throwing an `UnauthorizedException` (imported from `@nestjs/common`).

Then, we need to register it as a provider in the AuthModule so that it can be used within the module.

```ts
// auth.module.ts
import { LocalStrategy } from './local.strategy'

@Module({
  imports: [UserModule, EncryptionModule],
  providers: [AuthService, EncryptionService, LocalStrategy], // <-- appended to array
  controllers: [AuthController],
})
export class AuthModule {}
```

#### Adding a Route Guard

To use the strategy above, we'll need to create a class that extends `AuthGuard` - a class provided by `@nestjs/passport`.

 Before a request hits the route handler function, Nest will pass the request through a pipeline of [Guards](https://docs.nestjs.com/guards) which have the responsibility of validating the request and throwing an error if anything goes wrong.

 In this case, the AuthGuard will extract he user's credentials from the request and then pass it to an instance of the `LocalStrategy` class.  If the credentials are correct, it will add a `user` item to the `Request` object with whatever is returned from the `validate` method, otherwise it will throw the `UnauthorizedException` which will be dealt with further down the stack.

```sh
touch src/auth/local-auth.guard.ts
```

```ts
// local-auth.guard.ts
import { AuthGuard } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

We can then tell Nest to use the `LocalAuthGuard` to _guard_ the request using the `UseGuards` decorator.  If all goes well, the guard will set `request.user` to be the user's information.  If there is a problem with the user's credentials then the code in the route handler will never be touched.

```ts
// auth.controller
@UseGuards(AuthGuard('local'))
@Post('login')
async postLogin(@Request() request) {
    return request.user.properties
}
```

#### Generating and Returning a JWT

This route handler will now return the user's properties, including their password which isn't ideal.  Instead, we should be returning a JWT token.  To do that, we will need `passport-jwt`.  Similar to `passport-local`, is a strategy for authenticating users, but instead of using Username and password, it will check a [token](https://jwt.io) provided in the `Authorization` header.

The token will also expire after the expiration time (`exp`), but you can also tell passport to ignore the expiration time.

**Note:** It is important to remember that these keys can be easily decoded, so they shouldn't contain any sensitive information.

To use `passport-jwt` with Nest, we'll also need to install `@nestjs/jwt`.

```sh
npm install @nestjs/jwt passport-jwt
npm install @types/passport-jwt --save-dev
```

Next, we'll need to register the JWTService from `@nestjs/jwt` with the `AuthModule`.  The `JwtModule` requires either a secret or PEM, for now we'll add a secret key to `.env` that we can then retrieve using the `ConfigService`.

The values in `.env` should look something like this:

```env
# .env
JWT_SECRET=mySecret
JWT_EXPIRES_IN=30d
```

Then, like with the `Neo4jModule`, we can import the JwtModule into the `AuthModule` using the `registerAsync` function.

The function takes a Dynamic Module configuration, so we can instruct Nest to import the `ConfigModule`, then inject the `ConfigService` into a factory function (`useFactory`) which will then return the `secret` and `signinOptions` required to instantiate the module.

```ts
// auth.module.ts
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ ConfigModule ],
      inject: [ ConfigService, ],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      })
    }),
    UserModule,
    EncryptionModule,
  ],
  providers: [AuthService, EncryptionService, LocalStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
```

#### JWT Strategy

Just like the Local Strategy, we also need a JWT Strategy.  `passport-jwt` provides an `ExtractJwt.fromAuthHeaderAsBearerToken` function which we can pass through to the `super` call in the PassportStrategy.

```sh
touch src/auth/jwt.strategy.ts
```

The constructor needs an instance of the `ConfigService` to get the secret, otherwise it will fail to validate the token.

```ts
// jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        })
    }

    async validate(payload: any) {
        return this.userService.findByEmail(payload.email)
    }
}
```

Under the hood, Passport JWT will guarantee that the token received by the `validate` method is a valid token, which has been correctly signed and has not expired yet.  Then it is up to us to return the information that will be assigned to `user` on the `Request` object.  For this, I will mimic the value returned from the `LocalStrategy` and return the User node from the database via the `UserService`.

**Note:** We could also ignore the expiry date by setting `ignoreExpiration: true,` in the constructor.  This would be a good idea if, for example, we issued a short-life JWT token but also issued a [refresh token](https://auth0.com/learn/refresh-tokens/) as part of the payload.  We could then check the database for the refresh token and if found, allow the request issue another short-life JWT token.

As with the `LocalAuthGuard`, we'll also need to create a JWT Auth Guard.

```sh
touch src/auth/jwt-auth.guard.ts
```

```ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Then add it as a provider for the `AuthModule`:

```ts
// auth.module.ts
// ...
import { JwtStrategy } from './jwt.strategy';

@Module({
  // ...
  providers: [AuthService, EncryptionService, LocalStrategy, JwtStrategy],
  // ...
})
export class AuthModule {}
```

Then, to prove that the guard works, we can add it as a guard for a route handler using the `@UseGuards` decorator:

```ts
// auth.controller.ts
@UseGuards(JwtAuthGuard)
@Get('user')
async getUser(@Request() request) {
    const { id, email, firstName, lastName } = request.user.properties

    return { id, email, firstName, lastName }
}
```

#### Adding the token to the login request

Now we have can validate the token, we can add a method to generate a new JWT token to the `AuthService`.  To access the JWT Service, we'll need to add it to the constructor of the `AuthService`

```ts
// auth.service.ts
import { JwtService } from '@nestjs/jwt';

// ...
@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly encryptionService: EncryptionService,
        private readonly jwtService: JwtService
    ) {}

    // ...
}
```


As I mentioned earlier, this can be easily decoded so we should be careful about the kind of information we include in the token.  In reality, we only need enough information in the token to validate that it is correct (eg. their email address) but we can also add information that can be used to customise the UI.  In future, we might want to add the subscription types but for now we'll just go with name, email and date of birth.

```ts
// auth.service.ts
async createToken(user: User) {
    const {
        id,
        email,
        dateOfBirth,
        firstName,
        lastName,
    } = <Record<string, any>> user.properties

    return {
        access_token: this.jwtService.sign({
            sub: id,
            email,
            dateOfBirth,
            firstName,
            lastName
        })
    }
}
```

The method takes a User object (in this case a Node), pulls a set of properties from the node and uses the `JwtService` to encode and sign the JWT.  The result of the call to `this.jwtService.sign` is a base64 encoded string similar to the one mentioned at the top of this article.

We can now hook this into the `POST /auth/login` method in the `AuthController`:

```ts
// auth.controller.ts
export class AuthController {

    constructor(
        private readonly userService: UserService,
        // Added authService
        private readonly authService: AuthService
    ) {}

    // ...

    @Post('register')
    async postRegister(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.create(
            createUserDto.email,
            createUserDto.password,
            new Date(createUserDto.dateOfBirth),
            createUserDto.firstName,
            createUserDto.lastName
        )

        // return {
        //     user: user.properties
        // }
        return this.authService.createToken(user)
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async postLogin(@Request() request) {
        // return request.user
        return this.authService.createToken(request.user)
    }

```

If we head back to the end-to-end tests, we can make sure that this entire process works.

By shifting the email, usernamd and password variables into the  `describe('Auth', ...)` block, we can make them available to each test within that group.  That way we can generate a random email address and password that can be used for the duration of the Auth tests.

```ts
// app-e2e.spec.ts
describe('Auth', () => {
  const email = `${Math.random()}@adamcowley.co.uk`
  const password = Math.random().toString()
  let token

  // Tests ...
})
```

To test the login flow, we will need 3 tests  to ensure that the API:
- Rejects a request with a bad username, returning a `401 Unauthorized` status
- Rejects a request with a valid username but incorrect password
- Returns a JWT token when correct credentials are provided.

As part of the final test, I'll also assign the returned JWT token returned by the API to the `token` variable in the parent `describe` block so it can be used in the `GET /auth/user` later on.

```ts
// app-e2e.spec.ts
describe('POST /auth/login', () => {
  it('should return 401 status on bad username', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({
        email: 'unknown@example.com',
        password: 'incorrect',
      })
      .expect(401)
  })
  it('should return 401 status on bad password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({
        email,
        password: 'incorrect',
      })
      .expect(401)
  })

  it('should return a JWT token on successful login', () => {
    return request(app.getHttpServer())
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({
      email,
      password,
    })
    .expect(201)
    .expect(res => {
      expect(res.body.access_token).toBeDefined()
      token = res.body.access_token
    })
  })
})
```

Given the token obtained from the Login request, does it successfully identify the user and do the details returned form the API match the original details the user registered with?

```ts
// app-e2e.spec.ts
describe('GET /auth/user', () => {
  it('should authenticate user with the JWT token', () => {
    return request(app.getHttpServer())
      .get('/auth/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(email)
      })
  })
})
```

Additionally, we'll also want to test that the user won't have access to any route with this guard if they either don't have a token or supply an invalid token.

```ts
// app-e2e.spec.ts
it('should return error if no JWT supplied', () => {
  return request(app.getHttpServer())
    .get('/auth/user')
    .expect(401)
})

it('should return error if incorrect JWT supplied', () => {
  return request(app.getHttpServer())
    .get('/auth/user')
    .set('Authorization', `Bearer ${token.replace(/[0-9]+/g, 'X')}`)
    .expect(401)
})
```

In the code `token.replace(/[0-9]+/g, 'X')` I'm replacing all numbers with an `X`.  In theory this mimics the behaviour of a would-be hacker who may try to change the payload of the token but in reality it doesn't matter what the change is as long as it invalidates the signature.

Then, finally to clean up the database, we can add an `afterAll` hook to delete the user after all of the Auth tests have run.

```ts
describe('Auth', () => {
  const email = `${Math.random()}@adamcowley.co.uk`
  const password = Math.random().toString()
  let token

  afterAll(() => app.get(Neo4jService).write('MATCH (n:User {email: $email}) DETACH DELETE n', { email }))
  // ...
}
```


## Recap

This was a lengthy session but we've covered a lot of ground.  We've:
- Created a User module which provides a service for interacting with Users in the database.  The service will allow you to find a User by its email address and create a user following business rules.
- Created an Auth service which will create users via the UserService, authenticate the User using their email address and password, and issue a JWT token to allow them to access protected API endpoints.
- Created a Guard that will read the JWT token and either permit or deny access to the protected endpoints.
- Created an Auth Controller with routes for registering and signing in.
- Added end-to-end tests to ensure that User Registration and Authentication flow works as expected

Next week we will look at **Authorisation** - ensuring that the User can do what they are trying to.


### Further Reading:
- [Auth0: Get started with JSON Web Tokens](https://auth0.com/learn/json-web-tokens/)
- [Nest Docs: Authentication](https://docs.nestjs.com/techniques/authentication)
- [Nest Docs: Testing](https://docs.nestjs.com/fundamentals/testing)
- [Passport](http://www.passportjs.org/)
- [Passport Local](http://www.passportjs.org/packages/passport-local/)
