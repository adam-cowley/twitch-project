import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, } from 'rxjs';
import { map, } from 'rxjs/operators';
import neo4j, {
    isDuration,
    isLocalTime,
    isTime,
    isDate,
    isDateTime,
    isLocalDateTime,
    isInt,
    isPoint,
 } from 'neo4j-driver'
import { isNode, isRelationship } from 'neo4j-driver/lib/graph-types'
import Result from 'neo4j-driver/lib/result'

const toNative = (value: any, showLabelsOrType?: boolean, showIdentity?: boolean): any => {
    if ( value === null || value === undefined ) return undefined
    else if ( value instanceof Result || value.records ) {
        return value.records.map(row => Object.fromEntries(
            row.keys.map(key => [ key, toNative(row.get(key)) ])
        ))
    }
    else if ( Array.isArray(value) ) return value.map(value => toNative(value))
    else if ( isNode(value) ) return toNative({
        _id: showIdentity ?  toNative(value.identity) : null,
        _labels: showLabelsOrType ? toNative(value.labels) : null,
        ...toNative(value.properties),
    })
    else if ( isRelationship(value) ) return toNative({
        _id: toNative(value.identity),
        _type: showLabelsOrType? toNative(value.type) : null,
        ...toNative(value.properties),
    })
    // Number
    else if ( isInt(value) ) return value.toNumber()

    // Temporal
    else if (
        isDuration(value)  ||
        isLocalTime(value) ||
        isTime(value) ||
        isDate(value) ||
        isDateTime(value) ||
        isLocalDateTime(value)
    ) {
        return value.toString()
    }

    // Spatial
    if ( isPoint(value) ) {
        switch (value.srid.toNumber()) {
            case 4326:
                return { longitude: value.y, latitude: value.x }

            case 4979:
                return { longitude: value.y, latitude: value.x, height: value.z }

            default:
                return toNative({ x: value.x, y: value.y, z: value.z })
        }

    }

    // Object
    else if ( typeof value === 'object' ) {
        return Object.fromEntries(

            Object.keys(value).map(key => [key, toNative(value[ key ], showLabelsOrType, showIdentity)])
        )
    }

    return value
}

@Injectable()
export class Neo4jTypeInterceptor implements NestInterceptor {
    constructor(private readonly showLabelsOrType: boolean = false, private readonly showIdentity: boolean = false) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle()
            .pipe(
                map(data => toNative(data, this.showLabelsOrType, this.showIdentity))
            );
    }
}
