import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEETS_ID',
  ]

  const result: Record<string, boolean> = {}
  for (const v of vars) {
    result[v] = !!process.env[v]
  }

  return NextResponse.json(result)
}
