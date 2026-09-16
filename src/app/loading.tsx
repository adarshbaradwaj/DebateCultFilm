export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-12">
        {['TRENDING', 'CULT', 'NEW'].map(title => (
          <section key={title} className="mb-12">
            <h2 className="text-lg font-medium text-white mb-4 h-6 bg-gray-800 rounded w-1/4" />
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
                  <div className="aspect-[2/3] rounded-lg bg-gray-800" />
                  <div className="mt-2 h-4 bg-gray-800 rounded w-3/4" />
                  <div className="mt-1 h-3 bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}