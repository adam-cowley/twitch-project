import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Neo4jService } from './neo4j/neo4j.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private neo4jService: Neo4jService,
    private configService: ConfigService,
    ) {}

  @Get()
  async getHello(): Promise<string> {
    const greeting = await this.appService.getHello()
    return greeting
  }


  @Get('/config')
  async getConfig() {
    return {
      scheme: this.configService.get('NEO4J_SCHEME'),
      host: this.configService.get('NEO4J_HOST'),
      port: this.configService.get('NEO4J_PORT'),
      username: this.configService.get('NEO4J_USERNAME'),
    }
  }


  @Get('/test')
  async get() {
    return await this.neo4jService.read(`
      UNWIND range(1, 10) AS row
      RETURN
        row,
        1 as int,
        1.2 as float,
        'string' as string,
        date() as date,
        datetime() as datetime,
        localdatetime() as localdatetime,
        time() as time,
        point({latitude: 1.2, longitude: 3.4}) as latlng,
        point({latitude: 1.2, longitude: 3.4, height: 2}) as latlngheight,
        point({x:1, y:2}) as xy,
        point({x:1, y:2, z:3}) as xyz
    `)
  }
}
