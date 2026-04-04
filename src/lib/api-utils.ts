import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class APIResponse {
  static success<T>(data: T, status: number = 200) {
    return NextResponse.json(data, { status });
  }

  static error(message: string, status: number = 400, details?: any) {
    return NextResponse.json(
      { error: message, details },
      { status }
    );
  }

  static unauthorized(message: string = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return this.error(message, 403);
  }

  static handle(error: any) {
    console.error('[API_ERROR]', error);
    
    if (error instanceof ZodError) {
      return this.error('Validation Failed', 400, error.issues);
    }
    
    return this.error(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
      500
    );
  }
}
