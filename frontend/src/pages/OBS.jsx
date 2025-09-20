import { useState, useEffect } from 'react'
import { Monitor, Wifi, WifiOff, Settings, Plus, Trash2, Edit, Play, Pause, AlertCircle } from 'lucide-react'
import { obsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function OBS() {
  const [connections, setConnections] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConnection, setNewConnection] = useState({
    name: '',
    url: 'ws://localhost:4455',
    password: '',
    sourceName: 'Bible Verse'
  })

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setIsLoading(true)
    try {
      const response = await obsAPI.getConnections()
      setConnections(response.data.data || [])
    } catch (error) {
      console.error('Failed to load connections:', error)
      toast.error('Failed to load OBS connections')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddConnection = async (e) => {
    e.preventDefault()
    try {
      await obsAPI.connect(newConnection)
      toast.success('OBS connection added successfully')
      setShowAddForm(false)
      setNewConnection({
        name: '',
        url: 'ws://localhost:4455',
        password: '',
        sourceName: 'Bible Verse'
      })
      loadConnections()
    } catch (error) {
      console.error('Failed to add connection:', error)
      toast.error('Failed to add OBS connection')
    }
  }

  const handleDeleteConnection = async (id) => {
    if (!confirm('Are you sure you want to delete this connection?')) return
    
    try {
      await obsAPI.deleteConnection(id)
      toast.success('Connection deleted')
      loadConnections()
    } catch (error) {
      console.error('Failed to delete connection:', error)
      toast.error('Failed to delete connection')
    }
  }

  const testConnection = async (connection) => {
    try {
      const response = await obsAPI.getStatus(connection.id)
      if (response.data.connected) {
        toast.success('Connection is active')
      } else {
        toast.error('Connection is not active')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      toast.error('Connection test failed')
    }
  }

  const reconnectToOBS = async (connection) => {
    try {
      await obsAPI.connect({
        name: connection.name,
        url: connection.url,
        password: connection.password,
        sourceName: connection.sourceName
      })
      toast.success('Reconnected to OBS successfully')
      loadConnections()
    } catch (error) {
      console.error('Reconnection failed:', error)
      toast.error('Failed to reconnect to OBS: ' + (error.response?.data?.message || error.message))
    }
  }

  const ConnectionCard = ({ connection }) => (
    <div className="bg-white rounded-lg shadow p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
          <p className="text-sm text-gray-500">{connection.url}</p>
          <p className="text-sm text-gray-500">Source: {connection.sourceName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connection.connected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-500">
            {connection.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => testConnection(connection)}
          className="btn btn-outline btn-sm"
        >
          <Wifi className="h-4 w-4 mr-2" />
          Test
        </button>
        {!connection.connected && (
          <button
            onClick={() => reconnectToOBS(connection)}
            className="btn btn-outline btn-sm text-blue-600 hover:bg-blue-50"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Reconnect
          </button>
        )}
        <button
          onClick={() => handleDeleteConnection(connection.id)}
          className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>
    </div>
  )

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
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add OBS Connection</h2>
          <form onSubmit={handleAddConnection} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name
              </label>
              <input
                type="text"
                value={newConnection.name}
                onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                placeholder="My OBS Studio"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WebSocket URL
              </label>
              <input
                type="text"
                value={newConnection.url}
                onChange={(e) => setNewConnection({...newConnection, url: e.target.value})}
                placeholder="ws://localhost:4455"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (Optional)
              </label>
              <input
                type="password"
                value={newConnection.password}
                onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                placeholder="Leave empty if no password is set"
                className="input input-bordered w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Name
              </label>
              <input
                type="text"
                value={newConnection.sourceName}
                onChange={(e) => setNewConnection({...newConnection, sourceName: e.target.value})}
                placeholder="Bible Verse"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <button type="submit" className="btn btn-primary">
                Add Connection
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connections List */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading connections...</p>
          </div>
        ) : connections.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">OBS Connections</h2>
            {connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">OBS Studio Setup</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">To use OBS integration:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Install the OBS WebSocket plugin in OBS Studio</li>
                <li>Enable WebSocket server in OBS Tools → WebSocket Server Settings</li>
                <li>Set a password and note the port (default: 4455)</li>
                <li>Create a text source named "Bible Verse" in your scene</li>
                <li>Add the connection above with your OBS WebSocket details</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
