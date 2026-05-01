import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { UploadSection } from '@/components/prospects/upload-section'

export const metadata: Metadata = { title: 'Prospects — Two Mountain Wholesale' }

const PAGE_SIZE = 50

type SP = Promise<{
  q?:    string | string[]
  type?: string | string[]
  city?: string | string[]
  zip?:  string | string[]
  page?: string | string[]
}>

function first(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

function esc(s: string) {
  return s.replace(/[%_]/g, (c) => '\\' + c)
}

export default async function ProspectsPage({ searchParams }: { searchParams: SP }) {
  const sp   = await searchParams
  const q    = first(sp.q)?.trim()    ?? ''
  const type = first(sp.type)?.trim() ?? ''
  const city = first(sp.city)?.trim() ?? ''
  const zip  = first(sp.zip)?.trim()  ?? ''
  const page = Math.max(1, parseInt(first(sp.page) ?? '1') || 1)
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const supabase = createServerClient()

  let query = supabase
    .from('prospects')
    .select('*', { count: 'exact' })
    .order('store_name')
    .range(from, to)

  if (q)    query = query.or(`store_name.ilike.%${esc(q)}%,address.ilike.%${esc(q)}%`)
  if (type === 'on_premise' || type === 'off_premise') query = query.eq('license_type', type)
  if (city) query = query.ilike('city', `%${esc(city)}%`)
  if (zip)  query = query.ilike('zip',  `%${esc(zip)}%`)

  const { data: prospects, count, error } = await query

  // Check which prospects are already customers (by license number)
  const licenses = (prospects ?? [])
    .map((p) => p.liquor_license_number as string)
    .filter(Boolean)

  const customerSet = new Set<string>()
  if (licenses.length > 0) {
    const { data: matches } = await supabase
      .from('customers')
      .select('liquor_license_number')
      .in('liquor_license_number', licenses)
    matches?.forEach((c) => { if (c.liquor_license_number) customerSet.add(c.liquor_license_number) })
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const params = new URLSearchParams()
  if (q)    params.set('q',    q)
  if (type) params.set('type', type)
  if (city) params.set('city', city)
  if (zip)  params.set('zip',  zip)

  function pageLink(p: number) {
    const ps = new URLSearchParams(params)
    if (p > 1) ps.set('page', String(p))
    else ps.delete('page')
    const str = ps.toString()
    return `/prospects${str ? '?' + str : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
        {count !== null && (
          <p className="mt-1 text-sm text-slate-500">
            {count.toLocaleString()} {count === 1 ? 'record' : 'records'}
            {(q || type || city || zip) ? ' matching filters' : ''}
          </p>
        )}
      </div>

      {/* CSV Upload */}
      <UploadSection />

      {/* Filter bar */}
      <form method="GET" action="/prospects" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Store name or address…"
            className="h-9 w-56 rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">License Type</label>
          <select
            name="type"
            defaultValue={type}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="on_premise">On-Premise</option>
            <option value="off_premise">Off-Premise</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">City</label>
          <input
            name="city"
            defaultValue={city}
            placeholder="Filter by city…"
            className="h-9 w-36 rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">ZIP Code</label>
          <input
            name="zip"
            defaultValue={zip}
            placeholder="Filter by ZIP…"
            className="h-9 w-28 rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Filter
        </button>
        {(q || type || city || zip) && (
          <Link
            href="/prospects"
            className="h-9 inline-flex items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {/* Empty */}
      {!error && (prospects?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No prospects found</p>
          <p className="mt-1 text-sm text-slate-500">
            {q || type || city
              ? 'Try adjusting your filters.'
              : 'Import a CSV file above to get started.'}
          </p>
        </div>
      )}

      {/* Desktop table */}
      {!error && (prospects?.length ?? 0) > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Store Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">Address</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">City</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">License #</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 xl:table-cell">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prospects!.map((p) => {
                  const isCustomer = customerSet.has(p.liquor_license_number as string)
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{p.store_name}</td>
                      <td className="px-5 py-3"><TypeBadge type={p.license_type} /></td>
                      <td className="hidden px-5 py-3 text-sm text-slate-600 lg:table-cell">{p.address ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {[p.city, p.state].filter(Boolean).join(', ') || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-slate-500 md:table-cell font-mono">{p.liquor_license_number}</td>
                      <td className="hidden px-5 py-3 text-sm text-slate-500 xl:table-cell">{p.phone ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-3">
                        {isCustomer
                          ? <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Customer</span>
                          : <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Prospect</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!isCustomer && (
                          <Link
                            href={`/customers/new?from_prospect=${p.id}`}
                            className="inline-flex h-7 items-center rounded-md border border-blue-300 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                          >
                            Convert
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {prospects!.map((p) => {
              const isCustomer = customerSet.has(p.liquor_license_number as string)
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{p.store_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[p.city, p.state].filter(Boolean).join(', ') || ''}
                        {p.address ? ` · ${p.address}` : ''}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{p.liquor_license_number}</p>
                      {p.phone && <p className="mt-0.5 text-xs text-slate-500">{p.phone}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <TypeBadge type={p.license_type} />
                      {isCustomer
                        ? <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Customer</span>
                        : (
                          <Link
                            href={`/customers/new?from_prospect=${p.id}`}
                            className="inline-flex h-7 items-center rounded-md border border-blue-300 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                          >
                            Convert
                          </Link>
                        )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing {from + 1}–{Math.min(to + 1, count ?? 0)} of {(count ?? 0).toLocaleString()}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageLink(page - 1)}
                    className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageLink(page + 1)}
                    className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'on_premise') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        On-Premise
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      Off-Premise
    </span>
  )
}
