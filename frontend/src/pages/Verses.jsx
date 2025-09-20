import { useState, useEffect, useCallback } from 'react'
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
  const [availableBibles, setAvailableBibles] = useState([])
  const [selectedBible, setSelectedBible] = useState('kjv')
  const [isLoadingBibles, setIsLoadingBibles] = useState(false)
  
  // Filter popular English Bible versions from API response
  const getPopularBibleVersions = () => {
    console.log('getPopularBibleVersions called, availableBibles length:', availableBibles.length)
    if (!availableBibles.length) {
      console.log('No available Bibles, returning empty array')
      return []
    }
    
    // Define popular English Bible version patterns
    const popularPatterns = [
      { pattern: /king james|kjv/i, key: 'kjv' },
      { pattern: /american standard|asv/i, key: 'asv' },
      { pattern: /world english|web/i, key: 'web' },
      { pattern: /berean standard|bsb/i, key: 'bsb' },
      { pattern: /new international|niv/i, key: 'niv' },
      { pattern: /english standard|esv/i, key: 'esv' },
      { pattern: /new american standard|nasb/i, key: 'nasb' }
    ]
    
    const popularVersions = []
    
    // Find matching versions from API response
    popularPatterns.forEach(({ pattern, key }) => {
      const match = availableBibles.find(bible => 
        pattern.test(bible.name) || pattern.test(bible.abbreviation)
      )
      if (match) {
        console.log(`Found match for ${key}:`, match.name, match.abbreviation)
        popularVersions.push({
          key,
          name: match.name,
          abbreviation: match.abbreviation,
          apiId: match.id,
          language: match.language
        })
      }
    })
    
    console.log('Final popularVersions:', popularVersions)
    return popularVersions
  }

  // Load favorites and history on component mount
  useEffect(() => {
    loadFavorites()
    loadHistory()
    loadRandomVerse()
    loadObsConnections()
    loadAvailableBibles()
  }, [])

  // Debug: Log when availableBibles changes
  useEffect(() => {
    console.log('availableBibles changed:', availableBibles.length, 'Bibles')
    if (availableBibles.length > 0) {
      console.log('First few Bibles:', availableBibles.slice(0, 3))
    }
  }, [availableBibles])

  // Reload random verse when selectedBible changes
  useEffect(() => {
    if (selectedBible) {
      console.log('selectedBible changed, reloading random verse with:', selectedBible)
      loadRandomVerse()
    }
  }, [selectedBible])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        console.log('Searching with version:', selectedBible)
        const response = await versesAPI.searchVerses(query, selectedBible)
        const results = response.data.data || []
        
        // Process results to split individual verses
        const processedResults = processSearchResults(results)
        setSearchResults(processedResults)
        setActiveTab('search')
      } catch (error) {
        console.error('Search failed:', error)
        toast.error('Search failed. Please try again.')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500), // 500ms delay
    [selectedBible]
  )

  // Process search results to split individual verses
  const processSearchResults = (results) => {
    const processedResults = []
    
    results.forEach(result => {
      // Check if the reference contains a range (e.g., "James 1:1-27")
      const rangeMatch = result.reference.match(/^(.+?)(\d+):(\d+)-(\d+)$/)
      
      if (rangeMatch) {
        const [, book, chapter, startVerse, endVerse] = rangeMatch
        const start = parseInt(startVerse)
        const end = parseInt(endVerse)
        
        // Try multiple methods to split the text
        let textParts = []
        
        // Method 1: Split by verse numbers followed by letters (e.g., "1James", "2My", "3Knowing")
        const versePattern = /(\d+)([A-Za-z][^0-9]*?)(?=\d+[A-Za-z]|$)/g
        let match
        while ((match = versePattern.exec(result.text)) !== null) {
          textParts.push(match[1] + match[2])
        }
        
        // Method 2: If that doesn't work, try splitting by verse numbers at start of line
        if (textParts.length <= 1) {
          textParts = result.text.split(/(?=\d+[A-Za-z])/).filter(part => part.trim())
        }
        
        // Method 3: If still no good split, try splitting by verse numbers anywhere
        if (textParts.length <= 1) {
          textParts = result.text.split(/(\d+[A-Za-z])/).filter(part => part.trim())
        }
        
        // Create individual verses
        for (let i = start; i <= end; i++) {
          const verseIndex = i - start
          let verseText = ''
          
          if (verseIndex < textParts.length) {
            verseText = textParts[verseIndex]
          } else {
            // If we don't have enough parts, try to extract from the original text
            const verseNumPattern = new RegExp(`${i}([^0-9]*?)(?=${i + 1}[^0-9]|$)`, 'g')
            const verseMatch = verseNumPattern.exec(result.text)
            if (verseMatch) {
              verseText = i + verseMatch[1]
            }
          }
          
          if (verseText.trim()) {
            // Clean up the verse text
            verseText = verseText.replace(/^\d+/, '').trim()
            if (verseText) {
              processedResults.push({
                ...result,
                reference: `${book} ${chapter}:${i}`,
                text: verseText,
                originalReference: result.reference
              })
            }
          }
        }
      } else {
        // Single verse, add as is
        processedResults.push(result)
      }
    })
    
    return processedResults
  }

  // Debounce utility function
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

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
      console.log('Loading random verse with version:', selectedBible)
      const response = await versesAPI.getRandomVerse(selectedBible)
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

  const loadAvailableBibles = async () => {
    console.log('Loading available Bibles...')
    setIsLoadingBibles(true)
    try {
      const response = await versesAPI.getAvailableBibles()
      console.log('Available Bibles response:', response.data?.length || 0, 'Bibles')
      setAvailableBibles(response.data || [])
    } catch (error) {
      console.error('Failed to load available Bibles:', error)
      if (error.code === 'ECONNABORTED') {
        toast.error('Bible versions are loading slowly. Using default versions.')
      } else {
        toast.error('Failed to load Bible versions. Using default versions.')
      }
      // Set fallback versions
      setAvailableBibles([
        { id: 'de4e12af7f28f599-02', name: 'King James Version', abbreviation: 'KJV', language: 'English' },
        { id: '06125adad2d5898a-01', name: 'American Standard Version', abbreviation: 'ASV', language: 'English' },
        { id: '9879dbb7cfe39e4d-04', name: 'World English Bible', abbreviation: 'WEB', language: 'English' },
        { id: 'bba9f40183526463-01', name: 'Berean Standard Bible', abbreviation: 'BSB', language: 'English' }
      ])
    } finally {
      setIsLoadingBibles(false)
    }
  }

  const handleBibleVersionChange = (newVersion) => {
    console.log('Bible version changed to:', newVersion)
    setSelectedBible(newVersion)
    
    // If there's a current search query, re-search with the new version
    if (searchQuery.trim()) {
      console.log('Re-searching with new version:', newVersion, 'query:', searchQuery)
      debouncedSearch(searchQuery)
    }
    // Don't clear search results - let them update with new version
  }

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedSearch(query)
  }

  // Handle search form submission (for manual search button)
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    debouncedSearch(searchQuery)
  }

  const handleGetVerse = async (reference) => {
    try {
      const response = await versesAPI.getVerse(reference, selectedBible)
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
                  onChange={handleSearchInputChange}
                  placeholder="Search for verses (e.g., 'love', 'John 3:16')"
                  className="flex-1 input input-bordered"
                />
                <div className="relative">
                  <div className="text-xs text-gray-500 mb-1">Current: {selectedBible}</div>
                  <select
                    value={selectedBible}
                    onChange={(e) => {
                      console.log('Dropdown changed to:', e.target.value)
                      handleBibleVersionChange(e.target.value)
                    }}
                    className="select select-bordered w-32"
                    disabled={isLoadingBibles}
                  >
                    {isLoadingBibles ? (
                      <option>Loading...</option>
                    ) : getPopularBibleVersions().length > 0 ? (
                      getPopularBibleVersions().map(bible => (
                        <option key={bible.key} value={bible.key}>
                          {bible.abbreviation}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="kjv">KJV</option>
                        <option value="asv">ASV</option>
                        <option value="web">WEB</option>
                        <option value="bsb">BSB</option>
                      </>
                    )}
                  </select>
                </div>
                <button
                  type="submit"
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
                    <VerseCard key={`${verse.reference}-${index}`} verse={verse} />
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Searching...</p>
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
                  <VerseCard key={`fav-${verse.reference}-${index}`} verse={verse} />
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
                  <VerseCard key={`hist-${verse.reference}-${index}`} verse={verse} showActions={false} />
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
