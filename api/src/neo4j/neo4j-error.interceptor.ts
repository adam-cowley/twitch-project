import { CallHandler, ExecutionContext, Injectable, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Neo4jError } from 'neo4j-driver';

@Injectable()
export class Neo4jErrorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle()
            .pipe(
                catchError(err => {
                    if (err instanceof Neo4jError) {
                        if (err.message.includes('already exists with')) {
                            const [ label, property ] = err.message.match(/`([a-z0-9]+)`/gi)

                            return throwError( new BadRequestException([`${property.replace(/`/g, '')} already exists`]) )
                        }
                        else if (err.message.includes('must have the property')) {
                            const property = err.message.match(/`([a-z0-9]+)`/gi).pop()

                            return throwError( new BadRequestException([`${property.replace(/`/g, '')} is required`]) )
                        }
                    }

                    return throwError(err)
                })
            );
    }
}
