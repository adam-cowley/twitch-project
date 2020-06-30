export type Neo4jScheme = 'neo4j' | 'neo4j+s' | 'neo4j+ssc' | 'bolt' | 'bolt+s' | 'bolt+ssc' ;

export interface Neo4jConfig {
    scheme: Neo4jScheme;
    host: string;
    port: number | string;
    username: string;
    password: string;
    database?: string;
}
