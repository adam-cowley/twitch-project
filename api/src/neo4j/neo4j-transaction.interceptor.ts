import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";
import { Observable } from "rxjs";
import { Transaction } from "neo4j-driver";
import { tap, catchError } from "rxjs/operators";

@Injectable()
export class Neo4jTransactionInterceptor implements NestInterceptor {

    constructor(private readonly neo4jService: Neo4jService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const transaction: Transaction = this.neo4jService.beginTransaction()

        context.switchToHttp().getRequest().transaction = transaction

        return next.handle()
            .pipe(
                tap(() => {
                    transaction.commit()
                }),
                catchError(e => {
                    transaction.rollback()
                    throw e
                })
            )

    }

}