'use client'

import { useActionState } from 'react'
import { signIn } from '@/app/auth/actions'
import type { SignInState } from '@/app/auth/actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, {})

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Two Mountain Wholesale
          </h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form action={formAction} className="space-y-4">
            {state.message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass(!!state.errors?.email)}
              />
              {state.errors?.email && <FieldError msg={state.errors.email} />}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClass(!!state.errors?.password)}
              />
              {state.errors?.password && <FieldError msg={state.errors.password} />}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    'mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
    'placeholder:text-slate-400 outline-none transition-colors',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-slate-300 bg-white hover:border-slate-400',
  ].join(' ')
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}
