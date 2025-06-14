import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add authentication check here later
  return NextResponse.next();
}

export const config = {
  matcher: '/autograde/:path*',
};
