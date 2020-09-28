import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Neo4jTypeInterceptor } from './neo4j/neo4j-type.interceptor';
import { Neo4jErrorFilter } from './neo4j/neo4j-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new Neo4jTypeInterceptor());
  app.useGlobalFilters(new Neo4jErrorFilter());
  app.enableCors()

  await app.listen(3000);
}
bootstrap();
