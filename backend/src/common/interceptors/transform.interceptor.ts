import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface ResponseFormat<T> {
  success: boolean;
  msg: string;
  data: T;
}


/**
 * interceptor for cotnroller reponse msg Api
 * demo:
 * {
 *    success: true,
 *    msg: 'MESSAGE_RESPONSE_HERE',
 *    data: [...]
 * }
 * 
 */

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const messageFromDecorator = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        if ( data && typeof data === 'object' && 'success' in data && 'msg' in data) {
          return data;
        }

        let msg = messageFromDecorator || 'Success';
        let responseData = data;

        // return object data
        if (data && typeof data === 'object' && 'message' in data) {
          const keys = Object.keys(data);
          if (keys.length === 1 && typeof (data as any).message === 'string') {
            msg = (data as any).message;
            responseData = null;
          } else {
            msg = (data as any).message || msg;
            const { message, ...rest } = data as any;
            responseData = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        return {
          success: true,
          msg,
          data: responseData !== undefined ? responseData : null,
        };
      }),
    );
  }
}
