import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Movie data provided by{' '}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              TMDB
            </a>
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <Link href="/about" className="text-sm text-gray-500 hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">Terms</Link>
          </nav>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} debatecultfilm</p>
        </div>
      </div>
    </footer>
  )
}