'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="text-6xl font-medium text-white mb-4">404</h1>
      <p className="text-gray-400 mb-8">Page not found</p>
      <Link href="/">
        <Button variant="primary">Go home</Button>
      </Link>
    </div>
  )
}