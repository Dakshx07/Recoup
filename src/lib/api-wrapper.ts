/**
 * Standard API Route Wrapper
 *
 * Ensures all API routes catch errors, log them, and return a standardized
 * JSON response. Prevents unhandled rejections from crashing the server
 * and prevents internal stack traces from leaking to the client.
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function withApiAuthAndErrorHandling(
  handler: (req: Request) => Promise<NextResponse | Response>,
) {
  return async (req: Request): Promise<NextResponse | Response> => {
    try {
      // In a real system, you would check auth here.
      // For this MVP, we assume the reviewer is authenticated if they hit the route,
      // or we handle auth inside the route itself.
      
      return await handler(req);
    } catch (error) {
      console.error('[API Error]', req.url, error);
      
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      return NextResponse.json(
        { success: false, error: message } satisfies ApiErrorResponse,
        { status: 500 }
      );
    }
  };
}

/**
 * Standard 400 Bad Request response generator
 */
export function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiErrorResponse,
    { status: 400 }
  );
}

/**
 * Standard 401 Unauthorized response generator
 */
export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiErrorResponse,
    { status: 401 }
  );
}
