'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { SearchBar } from './SearchBar'
import { Button } from './ui/Button'
import { Suspense } from 'react'

function SearchBarWrapper() {
  return <SearchBar placeholder="Search movies..." />
}

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-medium text-white tracking-tight hover:opacity-80 transition-opacity">
              debatecultfilm
            </Link>

            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Home</Link>
              <Link href="/trending" className="text-sm text-gray-400 hover:text-white transition-colors">Trending</Link>
              <Link href="/cult" className="text-sm text-gray-400 hover:text-white transition-colors">Cult</Link>
              <Link href="/new" className="text-sm text-gray-400 hover:text-white transition-colors">New</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Suspense fallback={<div className="w-64 h-10 bg-gray-800 rounded animate-pulse" />}>
              <SearchBarWrapper />
            </Suspense>

            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" aria-hidden="true" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  {session.user?.name || session.user?.email}
                  {session.user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded uppercase">
                      MOD
                    </span>
                  )}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}