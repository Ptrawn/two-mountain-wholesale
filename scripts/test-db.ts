import { createClient } from '@supabase/supabase-js'

const EXPECTED_TABLES = [
  'customers',
  'products',
  'orders',
  'order_line_items',
  'invoices',
  'prospects',
] as const

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log(`Connecting to ${url} ...\n`)

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  let passed = 0
  let failed = 0

  for (const table of EXPECTED_TABLES) {
    const { error } = await supabase.from(table).select('id').limit(0)
    if (error) {
      console.error(`  ✗  ${table} — ${error.message}`)
      failed++
    } else {
      console.log(`  ✓  ${table}`)
      passed++
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
