'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scale, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-[#060E1B] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(to right, #C9A84C 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mb-4">
            <Scale className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Paul Padda Law</h1>
          <p className="text-xs text-slate-500 mt-1 tracking-widest uppercase">
            Legal Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0D1421] border border-[#1a2332] rounded-xl p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">
            Las Vegas, NV · Authorized Personnel Only
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="attorney@paulpaddalaw.com"
                className={cn(
                  'w-full bg-[#060E1B] border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600',
                  'focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-colors',
                  errors.email ? 'border-red-500/50' : 'border-[#1a2332]'
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  'w-full bg-[#060E1B] border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600',
                  'focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-colors',
                  errors.password ? 'border-red-500/50' : 'border-[#1a2332]'
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C9A84C] hover:bg-[#b8953e] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A1628] font-semibold text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#1a2332]" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-[#1a2332]" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || isSubmitting}
            className="w-full bg-transparent border border-[#1a2332] hover:border-[#2a3848] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 text-sm rounded-lg py-2.5 transition-all flex items-center justify-center gap-2.5"
          >
            {googleLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-6 tracking-wide">
          PAUL PADDA LAW · LAS VEGAS, NV · CONFIDENTIAL SYSTEM
        </p>
      </div>
    </div>
  )
}
