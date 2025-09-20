import { useState, useEffect } from 'react'
import { BookOpen, Search, Star, Clock, Send, RefreshCw, Heart, HeartOff } from 'lucide-react'
import { versesAPI, obsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Verses() {
  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [randomVerse, setRandomVerse] = useState(null)
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)
  const [obsConnections, setObsConnections] = useState([])

  // Load favorites and history on component mount
  useEffect(() => {
    loadFavorites()
    loadHistory()
    loadRandomVerse()
    loadObsConnections()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await versesAPI.getFavorites()
      setFavorites(response.data.data || [])
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await versesAPI.getHistory()
      setHistory(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const loadRandomVerse = async () => {
    setIsLoadingRandom(true)
    try {
      const response = await versesAPI.getRandomVerse()
      setRandomVerse(response.data.data)
    } catch (error) {
      console.error('Failed to load random verse:', error)
      toast.error('Failed to load random verse')
    } finally {
      setIsLoadingRandom(false)
    }
  }

  const loadObsConnections = async () => {
    try {
      const response = await obsAPI.getConnections()
      setObsConnections(response.data.data || [])
    } catch (error) {
      console.error('Failed to load OBS connections:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await versesAPI.searchVerses(searchQuery)
      setSearchResults(response.data.data || [])
      setActiveTab('search')
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetVerse = async (reference) => {
    try {
      const response = await versesAPI.getVerse(reference)
      const verse = response.data.data
      
      // Add to history
      await versesAPI.addToHistory(verse)
      loadHistory()
      
      toast.success(`Loaded: ${verse.reference}`)
      return verse
    } catch (error) {
      console.error('Failed to get verse:', error)
      toast.error('Failed to load verse')
    }
  }

  const toggleFavorite = async (verse) => {
    try {
      const isFavorite = favorites.some(fav => fav.reference === verse.reference)
      
      if (isFavorite) {
        await versesAPI.removeFromFavorites(verse.reference)
        toast.success('Removed from favorites')
      } else {
        await versesAPI.addToFavorites(verse)
        toast.success('Added to favorites')
      }
      
      loadFavorites()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast.error('Failed to update favorites')
    }
  }

  const sendToOBS = async (verse) => {
    try {
      if (obsConnections.length === 0) {
        toast.error('No OBS connections found. Please add an OBS connection first.')
        return
      }
      
      // Find the first active connection
      const activeConnection = obsConnections.find(conn => conn.connected || conn.liveStatus?.connected)
      
      if (!activeConnection) {
        toast.error('No active OBS connections found. Please check your OBS connection status.')
        return
      }
      
      // Send verse to OBS
      await obsAPI.sendVerse(activeConnection.id, {
        verseRef: verse.reference,
        verseText: verse.text,
        version: verse.version
      })
      
      toast.success(`Sent "${verse.reference}" to OBS successfully!`)
    } catch (error) {
      console.error('Failed to send to OBS:', error)
      
      // Handle specific OBS not available error
      if (error.response?.data?.code === 'OBS_NOT_AVAILABLE') {
        toast.error(
          `OBS Studio is not running. Please start OBS Studio and reconnect your "${activeConnection.name}" connection.`,
          { duration: 6000 }
        )
      } else {
        toast.error('Failed to send to OBS: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const isFavorite = (reference) => {
    return favorites.some(fav => fav.reference === reference)
  }

  const VerseCard = ({ verse, showActions = true }) => (
    <div className="bg-white rounded-lg shadow p-4 border">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">{verse.reference}</h3>
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => toggleFavorite(verse)}
              className={`p-2 rounded-full ${
                isFavorite(verse.reference) 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              {isFavorite(verse.reference) ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => sendToOBS(verse)}
              className={`p-2 rounded-full ${
                obsConnections.some(conn => conn.connected || conn.liveStatus?.connected)
                  ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              disabled={!obsConnections.some(conn => conn.connected || conn.liveStatus?.connected)}
              title={
                obsConnections.some(conn => conn.connected || conn.liveStatus?.connected)
                  ? 'Send to OBS'
                  : 'No active OBS connection'
              }
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <p className="text-gray-700 leading-relaxed">{verse.text}</p>
      <div className="mt-2 text-sm text-gray-500">
        {verse.translation_name} • {verse.translation_note}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
              Bible Verses
            </h1>
            <p className="mt-2 text-gray-600">
              Search, send, and manage Bible verses for your streams.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              obsConnections.some(conn => conn.connected || conn.liveStatus?.connected) 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-500">
              OBS {obsConnections.some(conn => conn.connected || conn.liveStatus?.connected) ? 'Connected' : 'Disconnected'}
            </span>
            <button
              onClick={loadObsConnections}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Refresh OBS status"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Random Verse */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Verse of the Moment</h2>
          <button
            onClick={loadRandomVerse}
            disabled={isLoadingRandom}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRandom ? 'animate-spin' : ''}`} />
            New Verse
          </button>
        </div>
        {randomVerse ? (
          <VerseCard verse={randomVerse} />
        ) : (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-gray-500">Loading random verse...</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'search', label: 'Search', icon: Search },
              { id: 'favorites', label: 'Favorites', icon: Star },
              { id: 'history', label: 'History', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex space-x-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for verses (e.g., 'love', 'John 3:16')"
                  className="flex-1 input input-bordered"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="btn btn-primary"
                >
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results ({searchResults.length})
                  </h3>
                  {searchResults.map((verse, index) => (
                    <VerseCard key={index} verse={verse} />
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8">
                  <Search className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-500">No verses found for "{searchQuery}"</p>
                </div>
              )}
              </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favorites.length > 0 ? (
                favorites.map((verse, index) => (
                  <VerseCard key={index} verse={verse} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-500">No favorite verses yet</p>
                  <p className="text-sm text-gray-400">Search for verses and add them to your favorites</p>
                </div>
              )}
              </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((verse, index) => (
                  <VerseCard key={index} verse={verse} showActions={false} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-500">No verse history yet</p>
                  <p className="text-sm text-gray-400">Search for verses to build your history</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
