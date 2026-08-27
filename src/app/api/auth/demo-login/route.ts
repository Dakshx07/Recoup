import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServerClient } from '@/infra/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    const admin = getServerClient();

    // 1. Generate magiclink token for the reviewer user via server-side admin client
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'reviewer@example.com',
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Failed to generate demo session token:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate demo reviewer session' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawRedirect = body?.redirect || request.nextUrl.searchParams.get('redirect');
    const safeRedirect = (typeof rawRedirect === 'string' && rawRedirect.startsWith('/app'))
      ? rawRedirect
      : '/app';

    let response = NextResponse.json({ success: true, redirect: safeRedirect });

    // 2. Initialize SSR cookie client and verify OTP to set standard Supabase auth cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('Failed to verify demo session OTP:', verifyError);
      return NextResponse.json(
        { error: 'Failed to establish demo session' },
        { status: 500 }
      );
    }

    return response;
  } catch (err) {
    console.error('Demo login route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
