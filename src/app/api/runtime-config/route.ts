import { NextResponse } from 'next/server';

import { resolveRuntimeConfigFromHeaders } from '@/lib/runtime-config/server';

export async function GET(request: Request) {
  const config = resolveRuntimeConfigFromHeaders(request.headers);

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
