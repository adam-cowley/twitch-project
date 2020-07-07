## Week 1 - Nest fundamentals & Neo4j Integration

Nest comes with a CLI with many helpers for starting and developing a project.  You can install it by running:

```
npm i --global @nestjs/cli
nest --help
```

Once it's installed, you can use the `new` or `n` command to create a new project.
```
nest new api
```

After selecting the package manager of your choice, the CLI command will generate a new project and install any dependencies.  Once it's done, you can `cd` into the directory and then run `npm run start:dev` to fire up the development server.

In the generated `src/` folder, you'll see:
- `main.ts` - The main entrypoint of the file, this creates a Nest application instance
- `app.module.ts` - This is the root module of the application, where you define the child modules that are used in the application
- `app.controller.ts` - This is a basic controller, where you can define REST endpoints on the server


### Nest modules

Functionality in Nest is grouped into *modules*, the [official documentation uses Cats](https://docs.nestjs.com/modules) as its example.  Modules are a way of grouping related functionality together. In the Cats example, the module *provides* a CatsService which handles the applications interactions with Cats, and a Cats controller which registers routes which define how the Cats are accessed.

Module classes are defined by a `@Module` annotation, which in turn defines which child modules are imported into module, any controllers that are defined in the module, and any classes that are exported from the module and made available for dependency injection.

Take the annotation on the [Cats example in the documentation](https://docs.nestjs.com/modules#module-re-exporting), this is saying that the CatsModule registers a single controller `CatsController` and provides the `CatsService`.

```
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
```

The CatService is registered with the Nest instance and can then be *injected* into any class.


### `@Injectable()` classes

Classes annotated with `@Injectable()` are automatically injected into a class using some under-the-hood Nest "magic".  For example, by defining the `CatsService` in the constructor for the `CatsController`, Nest will automatically resolve this dependency and inject it to the class without any additional code.

This is identical to how things work in more mature frameworks like [Spring](https://spring.io) and [Laravel](https://laravel.io).

```ts
import { Controller } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller
export class CatsController {
  constructor(private catsService: CatsService) {}
}
```

Dependency Injection is a software technique where a class will be "injected" with instances of other classes that it depends on.  This makes the testing process easier where instead of instantiating classes.  It also promotes the principles of DRY - don't repeat yourself and SOLID.  Each class should have a single responsibility - for example a `User` service should only be concerned with acting on a User's record, not be concerned with how that record is persisted to a database.


### Nest Integration for Neo4j

In order to use [Neo4j](https://neo4j.com) in services across the application, we can define a Neo4jService for interacting with the graph through the JavaScript driver.  This service should provide the ability to interact with Neo4j but without the service itself needing to know any of the internals.  This service should be wrapped in a module which can be registered in the application.

The first step is to install the Neo4j Driver.

```sh
npm i --save neo4j-driver
```

Then, we can use CLI to generate a new module with the name Neo4j.

```sh
nest g mo neo4j # shorthand for `nest generate module neo4j`
```

The command will create a `neo4j/` folder with its own module.  Next, we can use the CLI to generate the Service:

```sh
nest g s neo4j # shorthand for `nest generate service neo4j`
```

This command will generate `neo4j.service.ts` and append it to the `providers` array in the module so it can be injected into any application that uses the module.

#### Configuration & Dynamic Modules

By default, these modules are registered as static modules.  In order to add configuration to the driver, we'll have add a static method which accepts the user's Neo4j credentials and returns a `DynamicModule`.

The first thing to do is generate an interface that will define the details allowed when instantiating the module.

```sh
nest g interface neo4j-config
```

The driver takes a connection string and an authentication method.  I like to split up the connection string into parts, this way we can validate the scheme.

The scheme (or protocol) at the start of the URI should be a string, and one of the following options:

```ts
export type Neo4jScheme = 'neo4j' | 'neo4j+s' | 'neo4j+scc' | 'bolt' | 'bolt+s' | 'bolt+scc'
```

The host should be a string, port should either be a number or a string, then username, password should be a string.  The database should be an optional string, if the driver connects to a 3.x version of Neo4j then this isn't a valid option and if none is supplied then the driver will connect to the default database (as defined in neo4j.conf - `dbms.default_database`).

```ts
export interface Neo4jConfig {
    scheme: Neo4jScheme;
    host: string;
    port: number | string;
    username: string;
    password: string;
    database?: string;
}
```

Next, for the static method which registers the dynamic module.  The documentation recommends using the naming convention of `forRoot` or `register`.  The function should return a [`DynamicModule`](https://docs.nestjs.com/fundamentals/dynamic-modules) - this is basically an object that contains metadata about the module.

The module property should return the Type of the module - in this case `Neo4jModule`.  This module will provide the `Neo4jService` so we can add the class to the `provides` array.

```ts
// ,,
export class Neo4jModule {
    static forRoot(config: object): DynamicModule {
        return {
            module: Neo4jModule,
            provides: [
                Neo4jService,
            ]
        }
    }

    // ,,
}
```

Because we are providing a configuration object, we'll need to register it as a provider so that it can be injected into the `Neo4jService`.  For providers that are not defined globally, we can define a unique reference to the provider and assign it to a variable.  We will use this later on when injecting the config into the service.  The `useValue` property instructs Nest to use the config value provided as the first argument.

```ts
// Reference for Neo4j Connection details
const NEO4J_OPTIONS = 'NEO4J_OPTIONS'

export class Neo4jModule {
    static forRoot(config: object): DynamicModule {
        return {
            module: Neo4jModule,
            provides: [
                {
                    // Inject this value into a class @Inject(NEO4J_OPTIONS)
                    provide: NEO4J_OPTIONS,
                    useValue: config
                },
                Neo4jService,
            ],
        }
    }

    // ,,
}
```

If the user supplies incorrect credentials, we don't want the application to start.  We can create an instance of the Driver and verify the connectivity using an [Asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers).  An async provider is basically a function that given a set of configuration parameters, returns an instance of the module that is configured at runtime.

In a new file `neo4j.utils.ts`, create an `async` function to create an instance of the driver and call the `verifyConnectivity()` to verify that the connection has been successful.  If this function throws an Error, the application will not start.


```ts
import neo4j from 'neo4j-driver'
import { Neo4jConfig } from './interfaces/neo4j-config.interface'

export const createDriver = async (config: Neo4jConfig) => {
    // Create a Driver instance
    const driver = neo4j.driver(
        `${config.scheme}://${config.host}:${config.port}`,
        neo4j.auth.basic(config.username, config.password)
    )

    // Verify the connection details or throw an Error
    await driver.verifyConnectivity()

    // If everything is OK, return the driver
    return driver
}
```

The function accepts the `Neo4jConfig` object as the only argument.  Because this has already been defined as a provider, we can define it in the `injects` array when defining it as a provider.

```ts
// Import the factory function
import { createDriver } from './neo4j.utils.ts'

// Reference for Neo4j Driver
const NEO4J_DRIVER = 'NEO4J_DRIVER'

export class Neo4jModule {
    static forRoot(config: object): DynamicModule {
        return {
            module: Neo4jModule,
            provides: [
                {
                    provide: NEO4J_OPTIONS,
                    useValue: options
                },
                {
                    // Define a key for injection
                    provide: NEO4J_DRIVER,

                    // Inject NEO4J_OPTIONS defined above as the
                    inject: [NEO4J_OPTIONS],

                    // Use the factory function created above to return the driver
                    useFactory: async (config: Neo4jOptions) => createDriver(config)
                },
                Neo4jService,
            ],
        }
    }
}
```

Now that the driver has been defined, it can be injected into any class in it's own right by using the `@Inject()` annotation.  But in this case, we will add some useful methods to the `Neo4jService` to make it easier to read from and write to Neo4j.  Because we have defined `NEO4J_DRIVER` in the `provides` array for the dynamic module, we can pass the `NEO4J_DRIVER` as a single parameter to the `@Inject` directive in the constructor.

```ts
import { Injectable, Inject } from '@nestjs/common';
import { NEO4J_DRIVER } from './neo4j.constants'

@Injectable
export class Neo4jService {
    constructor(
        @Inject(NEO4J_CONFIG) private readonly config,
        @Inject(NEO4J_DRIVER) private readonly driver
    ) {}
}
```

Each Cypher query run against Neo4j takes place through a Session, so it makes sense to expose this as an option from the service.  The default access mode of the session allows the Driver to route the query to the right member of a Causal Cluster - this can be either `READ` or `WRITE`.  There is also an optional parameter for the database when using [multi-tenancy in Neo4j 4.0](https://adamcowley.co.uk/neo4j/multi-tenancy-neo4j-4.0/).  As I mentioned earlier, if none is supplied then the query is run against the default database.

So the user doesn't need to worry about the specifics of read or write transactions, we should create a method for each mode - both with an optional parameter for the database.  There is also a database specified in the `Neo4jConfig` object, so we should fall back to this if none is explicitly specified.


```ts
import { Driver, Session, session, Result } from 'neo4j-driver'
//...

export class Neo4jService {
    constructor(@Inject(NEO4J_DRIVER) private readonly driver) {}

    getReadSession(database?: string): Session {
        return this.driver.session({
            database: database || this.config.database,
            defaultAccessMode: session.READ,
        })
    }

    getWriteSession(database?: string): Session  {
        return this.driver.session({
            database: database || this.config.database,
            defaultAccessMode: session.WRITE,
        })
    }

}
```

These methods make use of `NEO4J_CONFIG` and `NEO4J_DRIVER` which were injected into the constructor.


So with that in mind, it would be useful to create a method to read data from Neo4j.  The driver accepts parameterised queries as a string (eg. queries with literal variables replaced with parameters - `$myParam`) and an object of parameters so these will be the arguments for the query.  Optionally, we may want to specify which database this query is run against so it makes sense to include that as an optional third parameter.  The query then returns a `Result` statement which includes the result and some additional statistics.

```ts
read(cypher: string, params: Record<string, any>, database?: string): Result {
    const session = this.getReadSession(database)
    return session.run(cypher, params)
}
```

Over the course of the application, this will save us a few lines of code.  The same can be done for a write query:

```ts
write(cypher: string, params: Record<string, any>, database?: string): Result {
    const session = this.getWriteSession(database)
    return session.run(cypher, params)
}
```

### Using the Service in the Application

Now we have a service that is registered in the main application through the `Neo4jModule` that can be injected into any class in the application.  So as an example, let's modify the Controller that was generated in the initial command.  By default, the route at '/' returns a hello world message, but instead let's use it to return the number of Nodes in the database.

To do this, we should first inject the `Neo4jService` into the controller:

```ts
import { Controller, Get } from '@nestjs/common';
import { Neo4jService } from './neo4j/neo4j.service'

@Controller()
export class AppController {
  constructor(private readonly neo4jService: Neo4jService) {}
    // ...
}
```

Now, we can modify the `getHello` method to return a string.  The constructor will automatically assign the `Neo4jService` to the class so it is accessible through `this.neo4jService`.  From there we can use the `.read()` method that we've just created to execute a query against the database.

```ts
async getHello(): Promise<any> {
    const res = await this.neo4jService.read(`MATCH (n) RETURN count(n) AS count`)

    return `There are ${res.records[0].get('count')} nodes in the database`
  }
```

Navigating in the browser to http://localhost:3000 should now show a message including the number of nodes in the database.

