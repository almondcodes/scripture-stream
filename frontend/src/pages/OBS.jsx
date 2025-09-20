import { Monitor, Wifi, WifiOff, Settings, Plus } from 'lucide-react'

export default function OBS() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Monitor className="h-8 w-8 text-primary-600 mr-3" />
              OBS Integration
            </h1>
            <p className="mt-2 text-gray-600">
              Connect and manage your OBS Studio instances for seamless verse streaming.
            </p>
          </div>
          <button className="btn btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Monitor className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No OBS connections</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect to your OBS Studio instance to start streaming Bible verses.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Wifi className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Connect to OBS</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Settings className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Configure Sources</p>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <WifiOff className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Test Connection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
