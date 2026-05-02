import type { Metadata } from 'next'
import { ImportTool } from '@/components/import/import-tool'

export const metadata: Metadata = { title: 'Import — Two Mountain Wholesale' }

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Historical Data Import</h1>
        <p className="mt-1 text-sm text-slate-500">
          Import historical orders from an Excel spreadsheet. Existing receipts are skipped automatically.
        </p>
      </div>

      <ImportTool />
    </div>
  )
}
