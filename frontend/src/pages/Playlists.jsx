import { useState, useEffect } from 'react'
import { List, Plus, Play, Edit, Trash2, Clock, Users, Eye } from 'lucide-react'
import { playlistsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    setIsLoading(true)
    try {
      const response = await playlistsAPI.getPlaylists()
      setPlaylists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load playlists:', error)
      toast.error('Failed to load playlists')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault()
    try {
      await playlistsAPI.createPlaylist(newPlaylist)
      toast.success('Playlist created successfully')
      setShowAddForm(false)
      setNewPlaylist({
        name: '',
        description: '',
        isPublic: false
      })
      loadPlaylists()
    } catch (error) {
      console.error('Failed to create playlist:', error)
      toast.error('Failed to create playlist')
    }
  }

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return
    
    try {
      await playlistsAPI.deletePlaylist(id)
      toast.success('Playlist deleted')
      loadPlaylists()
    } catch (error) {
      console.error('Failed to delete playlist:', error)
      toast.error('Failed to delete playlist')
    }
  }

  const PlaylistCard = ({ playlist }) => (
    <div className="bg-white rounded-lg shadow p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{playlist.name}</h3>
            {playlist.isPublic && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Eye className="h-3 w-3 mr-1" />
                Public
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{playlist.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <List className="h-4 w-4 mr-1" />
              {playlist.itemCount || 0} verses
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(playlist.updatedAt).toLocaleDateString()}
            </div>
            {playlist.isPublic && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {playlist.viewCount || 0} views
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button className="btn btn-outline btn-sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </button>
        <button className="btn btn-outline btn-sm">
          <Play className="h-4 w-4 mr-2" />
          Play
        </button>
        <button
          onClick={() => handleDeletePlaylist(playlist.id)}
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
              <List className="h-8 w-8 text-primary-600 mr-3" />
              Playlists
            </h1>
            <p className="mt-2 text-gray-600">
              Create and manage collections of Bible verses for your streams.
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Playlist
          </button>
        </div>
      </div>

      {/* Create Playlist Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Playlist</h2>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Playlist Name
              </label>
              <input
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist({...newPlaylist, name: e.target.value})}
                placeholder="My Favorite Verses"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})}
                placeholder="A collection of inspiring Bible verses..."
                className="textarea textarea-bordered w-full"
                rows={3}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={newPlaylist.isPublic}
                onChange={(e) => setNewPlaylist({...newPlaylist, isPublic: e.target.checked})}
                className="checkbox checkbox-primary mr-2"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this playlist public (others can view and use it)
              </label>
            </div>
            
            <div className="flex space-x-4">
              <button type="submit" className="btn btn-primary">
                Create Playlist
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

      {/* Playlists List */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading playlists...</p>
          </div>
        ) : playlists.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Playlists</h2>
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <List className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No playlists yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first playlist to organize your favorite Bible verses.
            </p>
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Plus className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Create Playlist</p>
                  </div>
                </div>
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Play className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Auto-advance</p>
                  </div>
                </div>
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Edit className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Manage Items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
