# Authorisation

Previously, we looked at **Authentication**; how we could verify that the User is who they say they are.  Now, we'll look at ensuring that a User is actually able to do what they want - in other words **Authorisation**.  To clarify the difference, let's take a look at a scenario for Neoflix.

When a User first registers for Neoflix they will should automatically be given a 30 day free trial which will give them access to all content on the site.  After this free trial ends, they will be required to buy a Subscription which will automatically renew every 30 days unless the user cancels the subscription.

The fact that the User has valid user credentials (in our case email and password) means that the API can correctly **authenticate** them.  Although they have valid credentials, the absence of a current subscription means that we can't **authorise** their request.  Authorisation may also extend to users who are under 18 years old but are trying to access adult content.

## Adding Subscriptions to the Database

To build authorisation into the API, we'll first need to add nodes to represent Packages and Subscriptions to the database.

Our packages will be uniquely identified by an ID, so the first thing to do is to create the constraint in the database.  Subscriptions will also be created with a unique ID so we can also create the constraint on `:Subscription` nodes.

```cypher
CREATE CONSTRAINT ON (p:Package) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT ON (s:Subscription) ASSERT s.id IS UNIQUE;
```

[I have created a CSV file](https://github.com/adam-cowley/twitch-project/blob/master/data/packages.csv) with 6 packages, each of which has a unique ID (`integer`), name, price (`float`) and the number of days that a Package is valid for for that price.  Similar to Sky Movies subscriptions, Packages will provide access to one or more Genres - these are represented in the CSV file as a pipe delimited list of the Genres.

```sh
head -n 3 data/packages.csv

id,name,price,days,genres
1,Childrens,4.99,30,Animation|Comedy|Family|Adventure
2,Bronze,7.99,30,Animation|Comedy|Family|Adventure|Fantasy|Romance|Drama
```

This CSV file can be imported in using `LOAD CSV`.  As mentioned in the [session on Modelling](./03-modelling.md), all data loaded by `LOAD CSV` is cast as a string by default, so we'll have to convert the package to an integer using `toInteger` and the price into a float using `toFloat()`.  We can convert the days column into a native Neo4j duration using a string in a format recognised by a [Java `Duration`](https://www.baeldung.com/java-period-duration).  In this case we're interested in the number of days, for example `P{X}D` where `{X}` is the number of days.


```cypher
LOAD CSV WITH HEADERS FROM 'file:///packages.csv' AS row
MERGE (p:Package {id: toInteger(row.id)})
SET p.name = row.name,
  p.duration = duration('P'+ row.days +'D'),
  p.price = toFloat(row.price)

FOREACH (name IN split(row.genres, '|') |
	MERGE (g:Genre {name: name})
  MERGE (p)-[:PROVIDES_ACCESS_TO]->(g)
)
```

The `FOREACH` statement at the end of the query splits the genres column by pipe (`|`), finds or creates the Genre node on its name and then creates a relationship to the package, signifying that a valid subscription for this Package provides access to Movies within the Genre.

### Checking Subscriptions using Cypher

To show the power of querying this data as a graph, we can also provide access to movies produced by a certain Production Company.  For example, the Bronze Package provides access to films in the genres of `Animation|Comedy|Family|Adventure|Fantasy|Romance|Drama`.  Meaning we can traverse from the `:User` node, through the `:Subscription` and `:Package` to the `:Genre` all in real-time.  A User will be able to access any `:Movie` node with a relationship.

```cypher
(:User)-[:HAS_SUBSCRIPTION]->(:Subscription {expiresAt: datetime})
    -[:FOR_PACKAGE]->(:Package)
    -[:PROVIDES_ACCESS_TO]->(:Genre)<-[:IN_GENRE]-(:Movie)
```

Cypher also allows us to be flexible.  Say we also want to grant access to videos produced by certain `:ProductionCompany` nodes, we can create a relationship type with the same name and remove the label check on the node between the `:Package` and `:Movie` and add another Relationship Type.

```cypher
(:Package)-[:PROVIDES_ACCESS_TO]->( )<-[:IN_GENRE|PRODUCED_BY]-(:Movie)
```

So, let's find some Production Companies to provide additional access to:

```cypher
MATCH (p:ProductionCompany)<-[:PRODUCED_BY]-(m)-[:IN_GENRE]->(g)
WITH p, collect(distinct g.name) AS genres, count(distinct m) AS movies
WHERE none(g in genres WHERE g in split("Animation|Comedy|Family|Adventure|Fantasy|Romance|Drama", "|"))
RETURN * LIMIT 10
```
The companies `Bluehorse Films` (id: 93174), `InPictures` (id: 12912) and `Ciak Filmproduktion`  (id: 83201) seem like good options, they have all produced a single film listed as `Documentary`.  We can use the `IN` predicate to find the production companies by their IDs and create a new `PROVIDES_ACCESS_TO` relationship between the Bronze package and the Production Company.

```cypher
MATCH (p:Package {id: 2})
MATCH (c:ProductionCompany)
WHERE m.id IN [93174, 12912, 83201]
CREATE (p)-[:PROVIDES_ACCESS_TO]->(c)
```

If we create a test user, we can demonstrate how we can check the user is allowed access to a Movie:

```cypher
MATCH (p:Package {id: 2})
CREATE (u:User {
    id: 'test',
    email: 'bronze.user@neoflix.com',
    firstName: 'Test',
    lastName: 'User'
})
CREATE (u)-[:HAS_SUBSCRIPTION]->(s:Subscription {
    expiresAt: datetime() + duration('P2D')
})-[:FOR_PACKAGE]->(p)
```

The `:Subscription` node has an `expiresAt` property which contains a [Neo4j `datetime`](https://adamcowley.co.uk/neo4j/temporal-native-dates/) - for the subscription to be active, that date should be greater than the current date and time (`s.expiresAt >= datetime()`).

```cypher
MATCH (u:User {id: 'test'})-[:HAS_SUBSCRIPTION]->(s)-[:FOR_PACKAGE]->(p)-[:PROVIDES_ACCESS_TO]->(g)<-[:IN_GENRE]-(m)
WHERE s.expiresAt > datetime()
RETURN * LIMIT 10
```

Given a few films selected at random, we can check the path between the User and the movie to check whether the User has access from a valid subscription:

```cypher
MATCH (u:User {id: 'test'})-[:HAS_SUBSCRIPTION]->(s)-[:FOR_PACKAGE]->(p)
WHERE s.expiresAt >= datetime()

MATCH (m:Movie)
WITH u, s, p, m ORDER BY rand() LIMIT 10

RETURN
    m.id,
    m.title,
    exists((m)-[:IN_GENRE|PRODUCED_BY]->()<-[:PROVIDES_ACCESS_TO]-(p)) AS canAccess
```

<!-- After finding the active subscription and the related package, the query takes 10 movies at random and then follows a path back to the `:Package` node (`p`).  In a single line of code, Cypher can traverse two paths.  Either
`(:Movie)-[:IN_GENRE]->(:Genre)<-[:PROVIDES_ACCESS_TO]-(:Package)` or `(:Movie)-[:PRODUCED_BY]->(:ProductionCompany)<-[:PROVIDES_ACCESS_TO]-(:Package)`. -->

```
╒══════╤════════════════════════════╤═══════════╕
│"m.id"│"m.title"                   │"canAccess"│
╞══════╪════════════════════════════╪═══════════╡
│31527 │"The Scarlet Empress"       │true       │
├──────┼────────────────────────────┼───────────┤
│4988  │"Semi-Tough"                │true       │
├──────┼────────────────────────────┼───────────┤
│12623 │"Suspect"                   │true       │
├──────┼────────────────────────────┼───────────┤
│11896 │"Throw Momma from the Train"│true       │
├──────┼────────────────────────────┼───────────┤
│25538 │"Yi Yi"                     │true       │
├──────┼────────────────────────────┼───────────┤
│17971 │"Midnight Madness"          │true       │
├──────┼────────────────────────────┼───────────┤
│6498  │"Nightwatch"                │false      │
├──────┼────────────────────────────┼───────────┤
│5923  │"The Sand Pebbles"          │true       │
├──────┼────────────────────────────┼───────────┤
│15497 │"Twelve O'Clock High"       │true       │
├──────┼────────────────────────────┼───────────┤
│21876 │"Von Ryan's Express"        │true       │
└──────┴────────────────────────────┴───────────┘

Started streaming 10 records in less than 1 ms and completed after 5 ms.
```

## Adding Subscriptions to the API

To add Subscription functionality to the API, we'll need to create a Subscription module and service.  We'll do this using the Nest CLI:

```sh
nest g mo subscription # or nest generate module subscription
nest g s subscription  # or nest generate service subscription
```

Inside the `SubscriptionService` we should create a method to create a new subscription for a User called `createSubscription`. As the user will always exist and the node already assigned to the request by the `JwtAuthGuard`, we can pass this through as the first parameter.   To save the extra database query, we'll pass through the Package ID as a number as this will most likely be passed as part of the request body.  Optionally, we can add a parameter to override the number of days until the subscription expires.  If that number isn't provided, we'll fall back to the duration property on the Package node.

```ts
// subscription.service.ts
export type Subscription = Node
// ...
async createSubscription(user: User, packageId: number, days: number = null): Promise<Subscription> {
    // ...
}
```

For the Cypher query itself, we want to find the user and package by their ID's, then create a `:Subscription` node.  The subscription node should have its own id (generated with cypher's `randomUUID` function), a `createdAt` datetime and also the expiration date and time.

```ts
const userId = (<Record<string, any>> user.properties).id
const res = await this.neo4jService.write(`
    MATCH (u:User {id: $userId})
    MATCH (p:Package {id: $packageId})
    CREATE (u)-[:PURCHASED]->(s:Subscription {
        id: randomUUID(),
        createdAt: datetime(),
        expiresAt: datetime() +
            CASE WHEN $days IS NOT NULL
            THEN duration('P'+ $days +'D')
            ELSE p.duration END
    })-[:FOR_PACKAGE]->(p)
    RETURN s
`, { userId, packageId: this.neo4jService.int(packageId), days })

return res.records[0].get('s')
```

### Note: Working with Integers

So far we've not worked with Integers in Neo4j so the `this.neo4jService.int` function will need some explaining.  The Neo4j type system uses 64bit integers with a max value of  `922337203685477600` - considerably higher than the maximum value that JavaScript can safely represent as an Integer (`Number.MIN_SAFE_INTEGER` or `9007199254740991`).  For this reason, the Neo4j driver comes with its own `Integer` value (exported under `neo4j.types.Integer`).  Any number that isn't explicitly converted to this Integer type will be passed to the driver as a `Float`.

For this reason, we'll either need to explicitly convert our Integers to this `Integer` type using the `int` function provided by the Driver or use the `toInteger` function in Cypher to convert the number back from a float.

For this reason, I've added a method to the Neo4j service which will uses the `int` function exported from the Neo4j Driver.

```ts
// neo4j.service.ts
import { int } from 'neo4j-driver'

// ...

toInteger(value: number) {
    return int(value)
}
```

[More on Integers with the Neo4j Driver](https://github.com/neo4j/neo4j-javascript-driver#numbers-and-the-integer-type)

### Using the SubscriptionService within the AuthModule

To use the new subscription service, we need to add the `SubscriptionModule` to the imports for the `AuthModule`:

```ts
// subscription.module.ts
import { SubscriptionModule } from '../subscription/subscription.module';

// ...
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ ConfigModule, ],
      inject: [ ConfigService ],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      })
    }),
    UserModule,
    EncryptionModule,
    SubscriptionModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
```

Then we can inject the `SubscriptionService` into the `AuthController`.

```ts
// auth.controller.ts
import { SubscriptionService } from '../subscription/subscription.service';

// ...
export class AuthController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    // ...
}
```

### Creating a new "Free Trial" Package

We'll also need to create a "Free Trial" Package to automatically subscribe new customers to. Let's go ahead and create a new Package with an ID of 0 so it can be easily found, give it a price of 0.00 and a default duration of 30 days.

To give the User the best experience, we'll also create :PROVIDES_ACCESS_TO relationships to each of the Genre nodes.

```cypher
CREATE (p:Package {
  id: 0,
  name: "Free Trial",
  price: 0.00,
  duration: duration('P30D')
})
WITH p
MATCH (g:Genre)
CREATE (p)-[:PROVIDES_ACCESS_TO]->(g)
```

Then, in the `postRegister` route handler, we can add the call to the new createSubscription method on the Subscription Service.

```ts
// auth.controller.ts
@Post('register')
async postRegister(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(
        createUserDto.email,
        createUserDto.password,
        new Date(createUserDto.dateOfBirth),
        createUserDto.firstName,
        createUserDto.lastName
    )

    // Create a free subscription
    await this.subscriptionService.createSubscription(user, 0)

    return await this.authService.createToken(user)
}
```

**Note:** Currently this executes two separate database transactions. That's fine for small workloads, but these two operations should really take place within the same database transaction. We'll sort that out at a later date.


### Testing the new Subscription Module

We've not introduced any breaking changes so running the end-to-end tests should still pass.

```
 npm run test:e2e

> api@0.0.1 test:e2e /Users/adam/projects/twitch/api
> jest --detectOpenHandles --config ./test/jest-e2e.json

 PASS  test/app.e2e-spec.ts
  AppController (e2e)
    Auth
      POST /auth/register
        ✓ should validate the request (238 ms)
        ✓ should return HTTP 200 successful on successful registration (165 ms)
      POST /auth/login
        ✓ should return 401 if username does not exist (41 ms)
        ✓ should return 401 if password is incorrect (96 ms)
        ✓ should return 201 if username and password are correct  (89 ms)
      GET /auth/user
        ✓ should return unauthorised if no token is provided (30 ms)
        ✓ should return unauthorised on incorrect token (25 ms)
        ✓ should authenticate a user with the JWT token (30 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        1.834 s, estimated 2 s
```

If we check in the database, there should now also be a `:Subscription` node connected to the newly created `:Package` node.

```
MATCH (p:Package {id: 0})
RETURN size((p)<-[:PURCHASED]-()) // 1
```

## Getting Genres from  a User's Subscriptions

Now that we have a Subscription node related to a User, we can use the graph to provide a list of Genres that a User has access to.  Let's create a Genre module, Service and Controller to take care of this.

```sh
nest g mo genre
nest g s genre
nest g co genre
```

In the `GenreController`, we'll want to create a route handler to listen for `GET` requests to the `genres/` endpoint and return a list of Genres.  The route will be guarded by the `JwtAuthGuard` to ensure that the user is logged in.  We can then use the `@Request` decorator to inject the request object into the method, where we can get the `user` Node.

```ts
// genre.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GenreService } from './genre.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('genres')
export class GenreController {

    constructor(private readonly genreService: GenreService) {}

    @UseGuards(JwtAuthGuard)
    @Get('/')
    async getIndex() {
        // ...
    }

}
```

The `GenreService` will need a `getGenres` method.  This should take the `User` as its only argument, which we will use to find the starting point for the cypher query.  From there, we will traverse the graph through to the genres that the user has permission to access.

So far we've been working with Neo4j Driver's `Node` data type, but as this is public facing data, we should instead define a typescript interface to represent properties that will represent the Genre in the response.

```ts
// genre.service.ts
export interface Genre {
    id: number;
    name: string
}
```

Then in the `GenreService` class, we can do some processing inside the service return the information outlined in the interface.

```ts
// genre.service.ts
async getGenresForUser(user: User): Promise<Genre[]> {
    const res = await this.neo4jService.read(`
        MATCH (u:User {id: $id})-[:PURCHASED]->(s:Subscription)-[:FOR_PACKAGE]->(p)-[:PROVIDES_ACCESS_TO]->(g)
        WHERE s.expiresAt >= datetime()
        RETURN g ORDER BY g.name ASC
    `, {id: (user.properties as Record<string, any>).id})

    return res.records.map(row => ({
        ...row.get('g').properties,
        id: row.get('g').properties.id.toNumber(),
    }))
}
```

The `read` method on the `Neo4jService` returns a `Result` - which in turn exposes an array of `records`.  The return statement runs the `map` function on that array, transforming the list of nodes into an array of plain objects.  For each `g` value returned from Neo4j, I've used the spread operator to mass-assign the properties to the node to the object, and then the final line converts the ID property from a Neo4j integer into a JavaScript integer.

```ts
return res.records.map(row => ({
    ...row.get('g').properties,
    id: row.get('g').properties.id.toNumber(),
}))
```

Because we're using a Neo4j Integer type, we'll need to call to `toNumber` method to convert it back into a Neo4j integer.  If the number is within a safe range (`Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`) the number will be returned as a `number`, otherwise it will be returned as a `string`.

All of the hard work is done within the service, so all that is left is to add the call to the new method into the `GenreController`:

```ts
// genre.controller.ts
@UseGuards(JwtAuthGuard)
@Get('/')
async getIndex(@Request() request) {
    return this.genreService.getGenresForUser(request.user)
}
```

We can add another group to the end-to-end tests and another test to ensure that the functionality works correctly.  The first two tests to check the the `JwtAuthGuard` is working correctly can be copied and pasted from the `GET /auth/user`, changing the URL inside `.get(...)`.  Then to test the response, we can check that all 20 genre rows have been returned, and for each of those rows there should be keys for the `id` and `name` properties for the Genre.

```ts
describe('GET /genres', () => {
    it('should return unauthorised if no token is provided', () => {
        return request(app.getHttpServer())
            .get('/genres')
            .expect(401)
    })

    it('should return unauthorised on incorrect token', () => {
        return request(app.getHttpServer())
            .get('/genres')
            .set('Authorization', `Bearer incorrect`)
            .expect(401)
    })

    it('should return a list of genres in exchange for a valid token', () => {
        return request(app.getHttpServer())
            .get('/genres')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect(res => {
                // User should have access to all 20 genres
                expect(res.body.length).toEqual(20)

                // Each one of those genres should have id and name keys
                res.body.forEach(row => {
                    expect(Object.keys(row)).toEqual(expect.arrayContaining(['id', 'name']))
                })
            })
    })
})
```

## Listing videos in a Genre

The next feature that we should add to the API is an endpoint for the User to list Movies within a Genre that their subscription grants them access to.  We'll add a route handler in the `GenreController` for `GET` requests to `/genre/:id`.  As with the previous route, this route should be guarded by the `JwtAuthGuard`, requiring a valid token to be sent with each request.

We can use decorators in the method while defining the method to inject the variables that we are interested in, and also use some pre-built [Pipes](https://docs.nestjs.com/pipes) to coerce the values into the correct format.  In order to process this request we will need:

- The User node as added to the Auth the JwtAuthGuard - `@Request() request`
- The ID parameter included in the URL - we can inject this by using the `@Param` decorator, supplying the value that has been prefixed with `:` in the path as defined in the `@Get` decorator.  In this case, we need a `number` so we can use the `ParseIntPipe` decorator as the second argument to ensure that Nest validates the input and converts it to a number.
- Optionally, the user may also provide some query parameters - for example if they click the _Previous_ or _Next_ buttons in the UI.  These can all be extracted from `request.query` object using the `@Query` decorator.  We can also use the `DefaultValuePipe` to supply a default value if none has been supplied.
  - The user may want to order the results, so we can expose an `orderBy` property - by default this should be the Movie title - `@Query('orderBy', new DefaultValuePipe('title'))`
  - Rather than the UI deciding the _skip_ parameter to pass through to the Cypher, we'll allow the UI to send a page parameter which it can easily increment/decrement.  If no value has been supplied this should default to the first page.  We also want this to be parsed into a number - `@Query('page', new DefaultValuePipe(1), ParseIntPipe)`
  - The user may want to change the limit to view more results in the UI: `@Query('limit', new DefaultValuePipe(10), ParseIntPipe)`

Piecing these values together, we'll get a route handler that looks like this:

```ts
// genre.controller.ts
@UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getGenre(
      @Request() request, // Request object to get the User
      @Param('id', ParseIntPipe) id: number,  // Extract the ID
      @Query('orderBy', new DefaultValuePipe('title')) orderBy: string,  // Which property to order by
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  // Page number defaulting to the first page
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number  // Total number of results to return, default 10
  ) {
      // ...
  }
```

To process this request, we'll pass on the responsibility to the `GenreService` by creating a `getMoviesForGenre` method.  Like the `getGenresForUser` method, we'll take the User node as the first parameter and add the rest of the parameters.

```ts
// genre.service.ts
async getMoviesForGenre(user: User, genreId: number, orderBy: string = 'title', limit: number = 10, page: number = 1) {
    // ...
}
```

In this method, we'll traverse the graph from the User, through their Subscriptions to a Package which provides access to the requested Genre.  The subscriptions should be filtered to only include nodes that expire on or after the current date and time.


```cypher
MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)-[:PROVIDES_ACCESS_TO]->(g:Genre {id: $genreId})
WHERE s.expiresAt >= datetime()
```

If the User doesn't have a subscription to this package then no rows will be returned.  For now that is fine because the request is for available videos in the Genre but in future we may want to return a `HTTP 403 Forbidden` response so that the UI can encourage the user to buy a new subscription.

We should also add in a check on the User's age - if they are under 18 years they shouldn't be able to access any movie with the `:Adult` label applied to it.

```cypher
u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult
```

Then we can traverse the `IN_GENRE` relationship to the movie and then apply the ordering and pagination.  Piecing this all together in the service will look like this:

```ts
/// genre.service.ts
async getMoviesForGenre(user: User, genreId: number, orderBy: string = 'title', limit: number = 10, page: number = 1) {
    const res = await this.neo4jService.read(`
        MATCH (u:User {id: $userId})-[:PURCHASED]->(s)-[:FOR_PACKAGE]->(p)-[:PROVIDES_ACCESS_TO]->(g:Genre {id: $genreId})<-[:IN_GENRE]-(m)
        WHERE s.expiresAt >= datetime() AND (u.dateOfBirth <= datetime() - duration('P18Y') OR NOT m:Adult)
        RETURN m,
            [ (m)-[:IN_GENRE]->(g) | g ] as genres,
            [ (m)<-[:CAST_FOR]-(p) | p ][0..5] as cast
        ORDER BY m.title ASC
        SKIP $skip
        LIMIT $limit
    `, {
        userId: (user.properties as Record<string, any>).id,
        genreId: int(genreId),
        skip: int( (page - 1) * limit),
        limit: int(limit),
    })

    return res.records.map(row => ({
        ...row.get('m').properties,
        id: row.get('m').properties.id.toNumber(),
        genres: row.get('genres'),
        cast: row.get('cast'),
    }))
}
```

In the `RETURN` portion of the statement I have added a couple of [Pattern Comprehension](https://neo4j.com/docs/cypher-manual/current/syntax/lists/#cypher-pattern-comprehension)s to retrieve some extra information about the movie.

The response will look something like this:

```json
{

  "popularity": 6.183889,
  "original_language": "en",
  "vote_count": 23,
  "average_vote": 6.7,
  "id": 31527,
  "release_date": "1934-05-09",
  "status": "Released",
  "revenue": 0,
  "overview": "Young German princess Sophia is married off to Russia's half-mad Grand Duke Peter in the hope of improving the royal blood line.",
  "budget": 900000,
  "title": "The Scarlet Empress",
  "imdb_id": "tt0025746",
  "original_title": "The Scarlet Empress",
  "poster_path": "/xa4t3CU168cVaNYL2g2dRMtSMDH.jpg",
  "runtime": 104,
  "cast": [
    {
      "profile_path": "/dKLUrgJSkcq7iPGliG81xL8Fdrw.jpg",
      "id": 133470,
      "gender": 0,
      "name": "John Lodge"
    },
    {
      "profile_path": "/geGrMcqxcFtMKKJO36OFpVwZFFW.jpg",
      "id": 8515,
      "gender": 1,
      "name": "Jane Darwell"
    },
    {
      "name": "Erville Alderson",
      "id": 589728,
      "gender": 2,
      "profile_path": "/yi3crBgbU5m4jfsH3H15YNNPrpg.jpg"
    },
    {
      "profile_path": "/iBqiyZ7nXnnLfFgXtMfwwazBx8X.jpg",
      "id": 1070625,
      "gender": 0,
      "name": "Olive Tell"
    },
    {
      "name": "Ruthelma Stevens",
      "id": 1082774,
      "gender": 0,
      "profile_path": "/nOKxAwLIxUNrU2DFxGeLaV2nyLd.jpg"
    }
  ],
  "genres": [
    {
      "id": 18,
      "name": "Drama"
    },
    {
      "id": 10749,
      "name": "Romance"
    },
    {
      "id": 36,
      "name": "History"
    }
  ],
}
```

Again, to test this endpoint we can create another group in the end-to-end tests.  When provided with a valid token, the API should return 10 movies:

```ts
describe('GET /genres/:id', () => {
    it('should return a list of genres in exchange for a valid token', () => {
        return request(app.getHttpServer())
            .get(`/genres/1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect(res => {
                expect(res.body.length).toEqual(10)
            })
    })
})
```

Then, if a limit is supplied (in this case 20), the API should return that number of results:

```ts
it('should return a paginated list of genres in exchange for a valid token', () => {
    const limit = 20
    return request(app.getHttpServer())
        .get(`/genres/$1?limit=${limit}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
            expect(res.body.length).toEqual(limit)
        })
})
```

You can make the tests more sophisticated than this but for now it demonstrates the functionality works as intended.


## Recap

In this session we've covered how to run some basic authentication using the structure of the graph.  When a user registers, they will have access to everything as part of a 30 day trial.  Once that trial expires, they will be required to purchase a subscription.

We already have the methods available to create the new subscription in the `SubscriptionService`, all we need to do is create another route handler to process the request.  The tests are also pretty basic at the moment, so it is worth spending some time testing for different scenarios, for example if a user tries to access a Genre that their subscription doesn't provide access to.

The API now also return data in Neo4j specific formats - for example `datetime`s or `duration`s which currently take a lot of repetitive code to convert.  We'll look at this in more detail in the next session.

<!-- All of the code plus a write-up of each session is available on Github at https://github.com/adam-cowley/twitch-project.  -->
If you have any questions, comments or if you would like to see a feature added to the API, feel free to [open a Github Issue](https://github.com/adam-cowley/twitch-project/issues/new).


### Further Reading

- [Neo4j Javascript Driver Manual](https://github.com/neo4j/neo4j-javascript-driver)
- [Cypher Manual: Load CSV](https://neo4j.com/docs/cypher-manual/current/clauses/load-csv/)
- [Authentication and Authorization (Auth0)](https://auth0.com/docs/authorization/concepts/authz-and-auth)
- [Stackoverflow: 403 Forbidden vs 401 Unauthorized HTTP responses](https://stackoverflow.com/questions/3297048/403-forbidden-vs-401-unauthorized-http-responses)
- [Nest Docs: Pipes](https://docs.nestjs.com/pipes)
- [Temporal Date Types in Neo4j](https://adamcowley.co.uk/neo4j/temporal-native-dates/)