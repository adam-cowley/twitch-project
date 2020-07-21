import { Neo4jTypeInterceptor } from './neo4j-type.interceptor';
import { tap } from 'rxjs/operators'
import { Observable, Subscriber } from 'rxjs';

describe('Neo4jTypeInterceptor', () => {
  const interceptor: Neo4jTypeInterceptor = new Neo4jTypeInterceptor()

  it('should convert a Node', () => {

    const callHandler = {
      handle: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnValue( new Observable(subscriber => {
        subscriber.next('foo')
      }) )
    };

    // TODO: ????

    // @ts-ignore
    console.log(interceptor.intercept({}, callHandler))

    expect(callHandler.handle).toBeCalledTimes(1);
    expect(callHandler.pipe).toBeCalledTimes(1);
  })
});
