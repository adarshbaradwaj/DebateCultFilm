'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      const result = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // Use NextAuth signIn
      const signInResponse = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, csrfToken: '' }),
      })

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-medium text-white mb-2">Create account</h1>
      <p className="text-gray-400 mb-8">Join debatecultfilm to rate movies and start debates</p>

      {error && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" loading={isLoading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-400">
        Already have an account?{' '}
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-white underline hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  )
}