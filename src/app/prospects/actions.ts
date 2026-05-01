'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProspectInput = {
  store_name:            string
  address:               string | null
  city:                  string | null
  state:                 string | null
  zip:                   string | null
  liquor_license_number: string
  license_type:          'on_premise' | 'off_premise'
  phone:                 string | null
}

export type ImportResult = {
  inserted: number
  skipped:  number
  error?:   string
}

// Called in batches of ~500 rows from the client
export async function importProspectBatch(rows: ProspectInput[]): Promise<ImportResult> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 }

  const supabase = createServerClient()
  const licenses = rows.map((r) => r.liquor_license_number)

  // Count how many of these license numbers already exist so we can report skips accurately
  const { count: existing, error: countErr } = await supabase
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .in('liquor_license_number', licenses)

  if (countErr) return { inserted: 0, skipped: 0, error: countErr.message }

  const { error } = await supabase
    .from('prospects')
    .upsert(rows, { onConflict: 'liquor_license_number', ignoreDuplicates: true })

  if (error) return { inserted: 0, skipped: 0, error: error.message }

  revalidatePath('/prospects')

  const skipped  = existing ?? 0
  const inserted = rows.length - skipped
  return { inserted, skipped }
}
