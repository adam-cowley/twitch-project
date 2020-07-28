// lambda.ts
import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../app.module';
import { ValidationPipe } from '@nestjs/common';
import { Neo4jTypeInterceptor } from '../neo4j/neo4j-type.interceptor';
import express from 'express';
import { ConfigService } from '@nestjs/config';
import { Neo4jErrorFilter } from '../neo4j/neo4j-error.filter';

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp))
        nestApp.setGlobalPrefix('api')
        nestApp.use(eventContext());
        nestApp.useGlobalPipes(new ValidationPipe());
        nestApp.useGlobalInterceptors(new Neo4jTypeInterceptor());
        nestApp.useGlobalFilters(new Neo4jErrorFilter());

        await nestApp.init();
        cachedServer = createServer(expressApp);
    }
    return cachedServer;
}

// Export the handler : the entry point of the Lambda function
export const handler: Handler = async (event: any, context: Context) => {
    cachedServer = await bootstrapServer();
    return proxy(cachedServer, event, context, 'PROMISE').promise;
}