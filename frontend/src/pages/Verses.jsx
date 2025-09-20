import { BookOpen, Search, Star, Clock } from 'lucide-react'

export default function Verses() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
          Bible Verses
        </h1>
        <p className="mt-2 text-gray-600">
          Search, send, and manage Bible verses for your streams.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Verse Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will include verse search, favorites, history, and OBS integration.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Search className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Search Verses</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Star className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Favorites</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">History</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
