# Authentication

Authentication is a key part of any subscription or SaaS site.  For every request, we should be able to verify who the user is and whether they have the correct subscription to do what they are trying to do.  As such, API calls to view or stream content will require a valid token.

Nest.js comes with a built in module for [Passport][https://github.com/jaredhanson/passport], a widely used library for authenticating users.  We will be usng it to validate each request, generate [JWT](https://jwt.io/) tokens during the login process, and verify those tokens in subsequent requests.

## Adding Authenticatin to Nest

To follow the examples in nest, we should create an Authentication Service which will handle the authentication, a controller to accept a login request, and then a module to register the components with the main application.

```sh
nest g mo auth
nest g s auth
nest g co auth
```

The Auth Service shouldn't be tasked with querying the user information, so we should also create a Users module and Service to get the user from the database.  Doing things this way means that if we need this functionality anywhere else in the application, we can just inject the service in and use the method rather than duplicating code.


```sh
nest g mo user
nest g s user
```

In our case, the user's will be identified their email address and password, so before we write any code we should create a contraint in Neo4j:

```cypher
CREATE CONSTRAINT ON (u:User) ASSERT u.email IS UNIQUE
```


### Registering as a User - `POST /auth/register`

Before we can authenticate a User, it has to exist in the database.  So the first thing to do would be to create an endpoint to allow a User to create an account.

We'll need to create a [DTO](https://docs.nestjs.com/controllers#request-payloads) (Data Transfer Object) to represent the payload that the function should receive.  By using the `@Body()` decorator, Nest will coerce the request body into the class.

The root folder of the module is getting a little crowded already, so I personally prefer to create a `dto/` folder to hold the DTO classes.

```sh
mkdir src/user/dto
touch src/user/dto/create-user.dto.ts
```

An added benefit of DTO's is that if we add decorators to the properties, Nest will automatically validate the request and reject any requests that don't meet the requirements that have been set out.

`@nest/core` comes with a [ValidationPipe](https://docs.nestjs.com/techniques/validation) that we'll need to register with the app.

[Pipes](https://docs.nestjs.com/pipes) are injectable classes that either transform or validate inputs into the aplication. - For example, the `ParseIntPipe` can be used to transform a URL parameter into a `number` type.

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

We'll add some validation on the date to ensure that the the user is at least 13 years old in accodance with UK law.  To do this, we can use the `moment` package - `npm i moment` and subtract 13 years.


The `create-user.dto.ts` should look something like this:

```sh
import moment from 'moment'
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


**Note:** At the time of writing, moment wasn't playing well with typescript.  After a quick google, I found that adding `"esModuleInterop": true,` to `compilerOptions` in `tsconfig.json` seemed to do the trick.

Next, the route in `auth.controller.ts`.  Any routes in the auth controller are prefixed with `auth/` as defined in the `@Controller` decorator, so to create a REST endpoint for a POST request to /auth/register, we can create the `@Post` decorator.

```ts
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
1. Add an `exports` array containing `UserService` to `UserModule` so that
    ```ts
    import { UserService } from './user.service';
    @Module({
    providers: [UserService],
    exports: [UserService],
    })
    export class UserModule {}
    ```

There's nothing like a live coding disaster to cement an idea into your head.

To verify this is working, we could write a cURL request or open up postman.  But instead, let's look at writing a test.  So far we've not looked at tests, but you may have noticed that when we ran the `nest g co auth` command, a `auth.controller.spec.ts` file was also generated.

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

If there is a valid request, the API should return a `HTTP 201 Created` status with the User's information.

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

Now, to persist the data.  The AuthController shouldn't hold any logic as to how a User is created, so this responsibility should be passed on to another class - in this case we'll use the `UserService` generated earlier.  So, in `src/users/user.service.ts`, we should create a new method for creating a User.


For now, we don't have any entities in the code, so we can define the `User` type as a Node from `neo4j-driver`.

```ts
import { Node } from 'neo4j-driver';

export type User = Node;
```
Then, the `create` method will take named parameters so that we can reflect the business logic  defined in the `CreateUserDto` (email, password and dateOfBirth are required but the first and last name are optional), then pass on a cypher `CREATE` query to the `Neo4jService`.

```ts
import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Date as Neo4jDate, Node } from 'neo4j-driver';

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
        dateOfBirth: Neo4jDate.fromStandardDate(dateOfBirth)
      }
    })

    return res.records[0].get('u');
  }
}

```

It's a really bad idea to store plain text passwords in the database, so we'll install `bcrypt`:

```sh
npm i --save bcrypt
```

and create a new encryption service which will be responsible for encrypting and comparing passwords.

```sh
nest g mo encryption
nest g s encryption
```

```ts
# encryption.service.ts
import { hash, compare } from 'bcrypt'
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    constructor(private readonly config: ConfigService) {}

    async hash(plain: string): Promise<string> {
        return this.config.get<number>('HASH_ROUNDS', 10))
    }

    async compare(plain: string, encrypted: string): Promise<boolean> {
        return compare(plain, encrypted)
    }
}
```

**Note:**  Here we're using the ConfigService which was previously registered as a global module inside `app.module.ts`.

In order to inject this into other services, this will need to be added to the `exports` array of the EncryptionModule.

```ts
# encryption.module.ts
import { EncryptionService } from './encryption.service';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
```

The `EncryptionModule` can then be added as an import to the `UserModule`:

```ts
# user.module.ts
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
...and injected into the UserService to hash the password.

```ts
# user.service.ts
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
import { EncryptionService } from './encryption/encryption.service';

@Module({
  imports: [UserModule],
  providers: [AuthService, EncryptionService],
  controllers: [AuthController]
})
export class AuthModule {}
```

Then, the `UserService` can be injected and used in the `AuthController`:

```ts
# auth.controller.ts
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

A quick query in `cypher-shell` should show that the user record has been created with a hashed password:

```
neo4j@neo4j> MATCH (u:User) WHERE exists(u.email) RETURN u.id, u.email, u.password, u.dateOfBirth;
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| u.id                                   | u.email                               | u.password                                                     | u.dateOfBirth |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| "d786d248-af60-49ca-b389-3fe423b9a1cf" | "0.4030098705180425@adamcowley.co.uk" | "$2b$10$YWBng/jeA7nJVZ1/aCtnG.lHLJCqDctHrVL.7SW/aHpU307xEw1Ry" | 2000-01-01    |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

But at the moment, there is still a problem.  We're currently returning all of the user's properties including the hashed password which isn't a good idea, and also this method will require the user to send another request in order to log in.  Instead, what we should do is generate and return a JWT token.


### Generating JWT Tokens - `POST /auth/login`

To log in, a user will have to send a `POST` request to `/auth/login` with their username and password.  In exchange, they will receive a JWT token containing their details and a login.

So, the first thing to do is to create a route handler in the `AuthController`:

```ts
# auth.controller.ts
@Post('login')
async postLogin(@Request() request: Request) {
  // ...
}
```

In order to generate a token, we can to use an open-source library called Passport.  Passport acts as a _middleware_,
authenticating requests using using *strategies*.  In basic terms, a Passport Strategy is a class with a `validate` method, which will check the request's context (eg, check and validate a token), and throw an `Error` to stop the request if anything goes wrong.

We can implement Passport into Nest using the `@nestjs/passport` plugin.
<!-- `@nestjs/passport` is a utility library which includes handy clases for implementing [Guard](https://docs.nestjs.com/guards). -->

Alongisde Passport, we will use [Passport Local](http://www.passportjs.org/packages/passport-local/), an out-of-the-box add-on for Passport that allows you to perform basic authenticating using a Uername and Password.

To implement this into Nest, we can use the .  We can create a class extending the `PassportStrategy` or extend a number of built in.  In this session, we'll be using the


#### Installing Dependencies

```sh
npm i --save @nestjs/passport passport passport-local
npm i --save-dev @types/passport-local
```

#### Local Strategy

To implement a local strategy, we can extend the `PassportStrategy` from the package and register it as a provider in the `AuthModule`.


For the local-strategy, Passport expects a validate() method with the following signature: `validate(username: string, password:string): any`.  The strategy will be `@Injectable` so we can use it in any modules that import the `AuthModule`.  Inside the auth folder, create a new file called `local.strategy.ts`:


```ts
# local.strategy.ts
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

By default the LocalStrategy will look for a field named `password`, but as we want the user to log in with their email address, we can customise the behaviour by passing an object into the the `super()` call inside the constructor, stating that the `usernameField` should be pulled from `email` in the request.

The `validate` method on this class calls the `validateUser` method on the injected `AuthService`, and if a valid value hasn't been returned, throws an `UnauthorizedException` (imported from `@nestjs/common`)

<!-- Additionally, if the `Request` object is required in the strategy, you can pass an object in the `super` call from the constructor with `passReqToCallback` set to `true`.

```ts
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }
```
This will change the signature of the validate method to be: `validate(request: Request, username: string, password: string)`. -->

Then, we need to register it as a provider in the AuthModule.

```ts
# auth.module.ts
import { LocalStrategy } from './local.strategy'

@Module({
  imports: [UserModule, EncryptionModule],
  providers: [AuthService, EncryptionService, LocalStrategy], // <-- appended to array
  controllers: [AuthController],
})
export class AuthModule {}
```


#### Validating Users

Next, to implement the `validateUser` method in `AuthService`.  This should accept a username and plaintext password, find the User by it's email address (with the help of the `UserService`) and then use the `EncryptionService` to check the password.  If everything is fine, then it should return the User but otherwise return null.

```ts
# auth.service.ts
async validateUser(email: string, password: string) {
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

#### Adding a Route Guard

To use the strategy above, we'll need to create a class that extends `AuthGuard` - a class provided by `@nestjs/passport`.  The AuthGard will "[Guard](https://docs.nestjs.com/guards)" the route - automatically instantiating the `LocalStrategy`, extracting the user's information and calling the validate method.  If the credentials are correct, it will add a `user` item to the `Request` object, otherwise it will throw the UnauthorizedException which will be caught further down the stack.

```sh
touch src/auth/local-auth.guard.ts
```

```ts
# local-auth.guard.ts
import { AuthGuard } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

If we add this guard to the login route handler, it will run before this route is executed and append the `user`.

```ts
@UseGuards(AuthGuard('local'))
@Post('login')
async postLogin(@Request() request) {
    return request.user
}
```

But this still isn't returning a JWT token.  To do that, we will need `passport-jwt`.  Similar to `passport-local`, is a strategy for autenticating users, but instead of using Username and password, it will check a [token](https://jwt.io) provided in the `Authorization` header.

A JWT is a Base 64 encoded string which contains 3 pieces of information:
- A header containing the type of token and the algorithm used to sign it
- A payload containing information about the user, such as their username (the subject or `sub`), and an expiration time (`exp`)
- A signature

Although it it technically possible to tamper with the payload of a JWT token, because it is encrypted using a secret any changes to the payload will mean that the signature will be invalid.  This will be picked up automatically by the extension.

The token will also expire after the expiration time (`exp`), but you can also tell passport to ignore the expiration time.

**Note:** It is important to remember that these keys can be easily decoded, so they shouldn't contain any sensitive information.

To use `passport-jwt`, we'll also need `@nestjs/jwt`.

```sh
npm install @nestjs/jwt passport-jwt
npm install @types/passport-jwt --save-dev
```

Next, we'll need to register the JWTService from `@nestjs/jwt` with the AuthModule.  The `JwtModule` requires either a secret or PEM, for now we'll use a secret from .env, and obtained through the `ConfigService`.

The values in `.env` should look something like this:

```env
# .env
JWT_SECRET=mySecret
JWT_EXPIRES_IN=30d
```

Then, like the `Neo4jModule`, we can register a dynamic JWT module using the `registerAsync` function - providing a `useFactory` function to return the `JwtModule` configuration.

```ts
// ...
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

Just like the Local Strategy, we also need a JWT Strategy.  `passport-jwt` provides an `ExtractJwt.fromAuthHeaderAsBearerToken` function which we can pass through to the `super` call in the PassportStrategy.

```sh
touch src/auth/jwt.strategy.ts
```

The constructor needs an instance of the `ConfigService` to get the secret, otherwise it will fail to validate the token.

```ts
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

Under the hood, Passport will guarantee that the token received by `validate` is a valid token, which has been correctly signed and has not expired.  Then it is up to us to return the information that will be assigned to `user` on the `Request` object.  For this, I will mimic the value returned from the `LocalStrategy` and return the User node from the database via the `UserService`.

Next, as with the Local Auth Guard, we'll need a Jwt Auth Guard.


```sh
touch src/auth/jwt-auth.guard.ts
```

```ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Then add it as a provider for the `AuthModule`

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

To prove that it works, we can add a new route to the `AuthController`.

```ts
@UseGuards(JwtAuthGuard)
@Get('user')
async getUser(@Request() request) {
    const { id, email, firstName, lastName } = request.user.properties

    return { id, email, firstName, lastName }
}
```

#### Adding the token to the login request

Now we have can validate the token, we can add the generation process to the `AuthService`.  To do this, we'll need to inject the `JwtService` into the `AuthService` and then call the `sign` method with our payload.

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

The method takes a User object (in this case a Node), pulls a set of properties from the node and uses the JwtService to encode that into a string.

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

If I shift the email, username and password variables into the  `describe('Auth', ...)` block, they will be available for each child group.  This way I can generate a random email and password and use it throughout the Auth tests.

```ts
// app-e2e.spec.ts
describe('Auth', () => {
  const email = `${Math.random()}@adamcowley.co.uk`
  const password = Math.random().toString()
  let token

  // Tests ...
})
```

To test the login flow, I will need three tests; one for a bad username, one for bad password and one that verifies that a valid token is returned.  I'll assign the returned token to the `token` variable in the parent `describe` block so I can use it on `GET /auth/user` later.

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

Then, finally, given the token provided above, does it successfully identify the user and do the details returned form the API match the original details the user registered with?

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


## Recap

This was a lengthy session but we've covered a lot of ground.  We've:
- Created a User module which provides a service for interacting with Users in the database.  The service will allow you to find a User by it's email address and create a user following business rules.
- Created an Auth service which will create users via the UserService, authenticate the User using their email address and password, and issue a JWT token to allow them to access protected API endpoints.
- Created a Guard that will read the JWT token and either permit or deny access to the protected endpoints.
- Created an Auth Controller with routes for registering and signing in.
- Added end-to-end tests to ensure that User Registration and Authentication flow works as expected

Next week we will look at **Authorisation** - ensuring that the User can do what they are trying to.


### Further Reading:
- [Nest Docs: Authentication](https://docs.nestjs.com/techniques/authentication)
- [Nest Docs: Testing](https://docs.nestjs.com/fundamentals/testing)
- [Passport](http://www.passportjs.org/)
- [Passport Local](http://www.passportjs.org/packages/passport-local/)
