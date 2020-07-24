import { Neo4jErrorInterceptor } from './neo4j-error.interceptor';

describe('Neo4jErrorInterceptor', () => {
  it('should be defined', () => {
    expect(new Neo4jErrorInterceptor()).toBeDefined();
  });
});
