import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  // 分页相关字段
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // SSE / @Res() 手动响应 — 直接透传
        if (response.headersSent) return data;

        if (data?.data !== undefined) {
          return {
            success: true,
            statusCode: response.statusCode,
            message: data?.message || 'Success',
            data: data.data,
            timestamp: new Date().toISOString(),
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            totalPages: data.totalPages,
          };
        }

        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Success',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
