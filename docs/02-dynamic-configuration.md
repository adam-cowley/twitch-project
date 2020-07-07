# Dynamic Neo4j Configuration

Currently, the configuration for the Neo4j Driver is static and hardcoded into the app.  Creating a `constants.js` to hold the configuration details would be a step forward, but instead a better practise would be to use environment variables to configure the database connection.  This way it is a lot easier to change the configuration between dev, test and production environments.  Most cloud providers and CI pipelines offer some sort of mechanism for [setting environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html).

NestJS provides a ` @nestjs/config` library which pulls configuration from a `.env` file and makes them accessible via `process.env`.  After registering a `ConfigModule`, we can then inject a `ConfigService` into services using the Dependency Injector.

The first thing we need to do is install the dependency:

```
npm i --save @nestjs/config
```

Then register the `ConfigModule` in the app using it's static `forRoot` method:

```ts
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: 'localhost',
      port: 7687,
      username: 'neo4j',
      password: 'neo',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
```

Next, we'll create a new `.env` file in the application's root and copy in the Neo4j connection details from `app.module.ts`.  Env files follow the _SCREAMING_SNAKE_CASE_ naming convention which makes it easy.

```
#.env
NEO4J_SCHEME=neo4j
NEO4J_HOST=localhost
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo
NEO4J_PORT=7687
```

Under the hood, the `ConfigModule` will call read the config and make it available via a `get` method on the `configService`:

```
configService.get<string>('NEO4J_USERNAME') // neo
```

[More about configuration in NestJS](https://docs.nestjs.com/techniques/configuration)


Because the config is now coming from another service rather than static variables, we'll also need to tweak the constructor.

For this, we'll create a new static `forRootAsync` method on the `AppModule`.  This will take a single argument, an object, which will be used to pass a dynamic provider that will use the `useFactory` option to get the environment variables from the `ConfigService` and register it as `NEO4J_CONFIG` ready to be injected.

This a bit of a hack but it seems to work.

```ts
static forRootAsync(configProvider): DynamicModule {
    return {
        module: Neo4jModule,
        imports: [ ConfigModule ],

        providers: [
            {
                provide: NEO4J_CONFIG,
                ...configProvider
            } as Provider<any>,
            {
                provide: NEO4J_DRIVER,
                inject: [ NEO4J_CONFIG ],
                useFactory: async (config: Neo4jConfig) => createDriver(config),
            },
            Neo4jService,
        ],
        exports: [
            Neo4jService,
        ]
    }
}
```

The method uses the spread operator to take the `configProvider` object, then register it in the IoC container was `NEO4J_CONFIG`.  The rest of the function is the same as the `forRoot` method, taking the value from `NEO4J_CONFIG` to create an instance of the driver and verify a connection.  That driver is then injected into the `Neo4jService`.

Back in `app.module.ts`, we need to define the provider that will pass through the config.  For this, we can use the `useFactory` option to provide a function that, when injected with the `ConfigService`, will build and return a `Neo4jConfig` object.



```ts
// app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot(),
    Neo4jModule.forRootAsync({
      imports: [ ConfigModule ],
      inject: [ ConfigService, ],
      useFactory: (configService: ConfigService) => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      })
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
```

The async provider requires access to the ConfigService, so the async provider should `import` the `ConfigModule`.  The `inject` property then defines that the `ConfigService` will be injected into the factory function.

