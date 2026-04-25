'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type SignInState = {
  errors?: { email?: string; password?: string }
  message?: string
}

async function makeClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )
}

export async function signIn(prev: SignInState, formData: FormData): Promise<SignInState> {
  const email    = (formData.get('email')    as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null)          ?? ''

  const errors: SignInState['errors'] = {}
  if (!email)    errors.email    = 'Email is required.'
  if (!password) errors.password = 'Password is required.'
  if (Object.keys(errors).length) return { errors }

  const supabase = await makeClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { message: error.message }

  redirect('/customers')
}

export async function signOut() {
  const supabase = await makeClient()
  await supabase.auth.signOut()
  redirect('/login')
}
