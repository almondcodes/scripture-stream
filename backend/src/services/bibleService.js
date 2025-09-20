const axios = require('axios');
const { BIBLE_VERSIONS, POPULAR_VERSES, BOOK_MAP } = require('../config/bibleConfig');

class BibleService {
  constructor() {
    this.baseUrl = process.env.BIBLE_API_URL || 'https://api.scripture.api.bible/v1';
    this.apiKey = process.env.BIBLE_API_KEY;
    this.versionMap = BIBLE_VERSIONS;
    this.dynamicVersionMap = new Map(); // For dynamic version mapping
    
    if (!this.apiKey) {
      throw new Error('BIBLE_API_KEY environment variable is required');
    }
  }

  /**
   * Get Bible ID for a version key, with fallback to dynamic mapping
   * @param {string} version - Version key (e.g., 'kjv', 'niv')
   * @returns {string} Bible ID
   */
  getBibleId(version) {
    console.log(`Getting Bible ID for version: ${version}`);
    
    // First try static mapping
    if (this.versionMap[version]) {
      console.log(`Found in static mapping: ${this.versionMap[version]}`);
      return this.versionMap[version];
    }
    
    // Then try dynamic mapping
    if (this.dynamicVersionMap.has(version)) {
      console.log(`Found in dynamic mapping: ${this.dynamicVersionMap.get(version)}`);
      return this.dynamicVersionMap.get(version);
    }
    
    // Fallback to KJV
    console.log(`Using fallback KJV: ${this.versionMap['kjv'] || 'de4e12af7f28f599-02'}`);
    return this.versionMap['kjv'] || 'de4e12af7f28f599-02';
  }

  /**
   * Build dynamic version mapping from available Bibles
   * @param {Array} availableBibles - Array of Bible objects from API
   */
  buildDynamicVersionMap(availableBibles) {
    console.log(`Building dynamic version map from ${availableBibles.length} Bibles`);
    
    const versionPatterns = {
      'kjv': /king james|kjv/i,
      'asv': /american standard|asv/i,
      'web': /world english|web/i,
      'bsb': /berean standard|bsb/i,
      'niv': /new international|niv/i,
      'esv': /english standard|esv/i,
      'nasb': /new american standard|nasb/i
    };

    Object.entries(versionPatterns).forEach(([key, pattern]) => {
      const match = availableBibles.find(bible => 
        pattern.test(bible.name) || pattern.test(bible.abbreviation)
      );
      if (match) {
        console.log(`Mapped ${key} -> ${match.id} (${match.name})`);
        this.dynamicVersionMap.set(key, match.id);
      } else {
        console.log(`No match found for ${key}`);
      }
    });
    
    console.log(`Dynamic version map built with ${this.dynamicVersionMap.size} entries`);
  }

  /**
   * Fetch a Bible verse by reference
   * @param {string} reference - Bible verse reference (e.g., "John 3:16" or "James 1:2-9")
   * @param {string} version - Bible version (default: "kjv")
   * @returns {Promise<Object>} Verse data
   */
  async getVerse(reference, version = 'kjv') {
    try {
      // Check if this is a verse range
      const rangeMatch = reference.match(/^(.+?)(\d+):(\d+)-(\d+)$/);
      
      if (rangeMatch) {
        // Try to use the passages endpoint for ranges first
        try {
          return await this.getPassageRange(reference, version);
        } catch (error) {
          console.warn(`Passage endpoint failed for ${reference}, falling back to individual verses:`, error.message);
          // Fallback to individual verses if passage endpoint fails
          return await this.getIndividualVersesInRange(reference, version);
        }
      } else {
        // Single verse
        return await this.getSingleVerse(reference, version);
      }
    } catch (error) {
      throw new Error(`Failed to fetch verse: ${error.message}`);
    }
  }

  /**
   * Get a passage range using the passages endpoint
   * @param {string} reference - Verse reference (e.g., "James 1:2-9")
   * @param {string} version - Bible version
   * @returns {Promise<Object>} Passage data
   */
  async getPassageRange(reference, version = 'kjv') {
    try {
      const bibleId = this.getBibleId(version);
      
      // Convert to API.Bible passage format (e.g., "JAS.1.2-JAS.1.9")
      const passageId = this.convertRangeToPassageFormat(reference);
      
      const url = `${this.baseUrl}/bibles/${bibleId}/passages/${passageId}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'api-key': this.apiKey,
          'User-Agent': 'ScriptureStream/1.0'
        }
      });

      if (!response.data || !response.data.data) {
        throw new Error('Passage not found');
      }

      const passage = response.data.data;
      
      // Parse individual verses from the passage content
      const verses = this.parseVersesFromPassage(passage, reference);
      
      return {
        reference: reference,
        text: passage.content.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
        version: version,
        translation_name: version.toUpperCase(),
        translation_note: 'API.Bible',
        verses: verses // Include individual verses for processing
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Passage not found');
      }
      throw new Error(`Failed to fetch passage: ${error.message}`);
    }
  }

  /**
   * Parse individual verses from a passage
   * @param {Object} passage - Passage data from API.Bible
   * @param {string} originalReference - Original reference
   * @returns {Array} Array of individual verses
   */
  parseVersesFromPassage(passage, originalReference) {
    const rangeMatch = originalReference.match(/^(.+?)(\d+):(\d+)-(\d+)$/);
    if (!rangeMatch) return [];

    const [, book, chapter, startVerse, endVerse] = rangeMatch;
    const start = parseInt(startVerse);
    const end = parseInt(endVerse);
    
    const verses = [];
    const text = passage.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    // Try to split by verse numbers
    const versePattern = /(\d+)([A-Za-z][^0-9]*?)(?=\d+[A-Za-z]|$)/g;
    let match;
    const textParts = [];
    
    while ((match = versePattern.exec(text)) !== null) {
      textParts.push(match[1] + match[2]);
    }
    
    for (let i = start; i <= end; i++) {
      const verseIndex = i - start;
      let verseText = '';
      
      if (verseIndex < textParts.length) {
        verseText = textParts[verseIndex].replace(/^\d+/, '').trim();
      }
      
      if (verseText) {
        verses.push({
          reference: `${book} ${chapter}:${i}`,
          text: verseText,
          version: passage.bibleId,
          translation_name: passage.bibleId,
          translation_note: 'API.Bible'
        });
      }
    }
    
    return verses;
  }

  /**
   * Get individual verses in a range (fallback method)
   * @param {string} reference - Verse reference (e.g., "James 1:2-9")
   * @param {string} version - Bible version
   * @returns {Promise<Object>} Verse data
   */
  async getIndividualVersesInRange(reference, version = 'kjv') {
    const rangeMatch = reference.match(/^(.+?)(\d+):(\d+)-(\d+)$/);
    const [, book, chapter, startVerse, endVerse] = rangeMatch;
    const start = parseInt(startVerse);
    const end = parseInt(endVerse);
    
    const verses = [];
    let combinedText = '';
    
    for (let i = start; i <= end; i++) {
      try {
        const singleRef = `${book} ${chapter}:${i}`;
        const verse = await this.getSingleVerse(singleRef, version);
        verses.push(verse);
        combinedText += `${i}${verse.text.replace(/^\d+/, '')}`;
      } catch (error) {
        // Skip missing verses in range
        console.warn(`Verse ${book} ${chapter}:${i} not found, skipping`);
      }
    }
    
    if (verses.length === 0) {
      throw new Error('No verses found in range');
    }
    
    return {
      reference: reference,
      text: combinedText,
      version: version,
      translation_name: version.toUpperCase(),
      translation_note: 'API.Bible',
      verses: verses // Include individual verses for processing
    };
  }

  /**
   * Fetch a single Bible verse (helper method)
   * @param {string} reference - Bible verse reference (e.g., "John 3:16")
   * @param {string} version - Bible version (default: "kjv")
   * @returns {Promise<Object>} Verse data
   */
  async getSingleVerse(reference, version = 'kjv') {
    try {
      const bibleId = this.getBibleId(version);
      
      // Convert reference to API.Bible format (e.g., "John 3:16" -> "JHN.3.16")
      const apiReference = this.convertReferenceToApiFormat(reference);
      
      const url = `${this.baseUrl}/bibles/${bibleId}/passages/${apiReference}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'api-key': this.apiKey,
          'User-Agent': 'ScriptureStream/1.0'
        }
      });

      if (!response.data || !response.data.data) {
        throw new Error('Verse not found');
      }

      const passage = response.data.data;
      return {
        reference: passage.reference,
        text: passage.content.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
        version: version,
        translation_name: version.toUpperCase(),
        translation_note: 'API.Bible'
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Verse not found');
      }
      throw new Error(`Failed to fetch verse: ${error.message}`);
    }
  }

  /**
   * Search for verses containing specific text
   * @param {string} query - Search query
   * @param {string} version - Bible version
   * @returns {Promise<Array>} Array of matching verses
   */
  async searchVerses(query, version = 'kjv') {
    try {
      const trimmedQuery = query.trim();
      
      // If the query looks like a verse reference, try to fetch it
      if (this.validateReference(trimmedQuery)) {
        try {
          const verse = await this.getVerse(trimmedQuery, version);
          return [verse];
        } catch (error) {
          // If the specific reference fails, return empty
          return [];
        }
      }
      
      // Use API.Bible search functionality
      const bibleId = this.getBibleId(version);
      const url = `${this.baseUrl}/bibles/${bibleId}/search`;
      
      const response = await axios.get(url, {
        params: {
          query: trimmedQuery,
          limit: 10,
          offset: 0
        },
        headers: {
          'api-key': this.apiKey,
          'User-Agent': 'ScriptureStream/1.0'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.data || !response.data.data.verses) {
        return [];
      }

      const verses = response.data.data.verses;
      const results = [];

      for (const verse of verses) {
        try {
          results.push({
            reference: verse.reference,
            text: verse.text.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
            version: version,
            translation_name: version.toUpperCase(),
            translation_note: 'API.Bible'
          });
        } catch (error) {
          continue;
        }
      }
      
      return results;
    } catch (error) {
      console.warn('Search failed:', error.message);
      return [];
    }
  }

  /**
   * Get a random verse
   * @param {string} version - Bible version
   * @returns {Promise<Object>} Random verse data
   */
  async getRandomVerse(version = 'kjv') {
    try {
      const randomReference = POPULAR_VERSES[Math.floor(Math.random() * POPULAR_VERSES.length)];
      return await this.getVerse(randomReference, version);
    } catch (error) {
      throw new Error(`Failed to get random verse: ${error.message}`);
    }
  }

  /**
   * Get verse of the day
   * @param {string} version - Bible version
   * @returns {Promise<Object>} Verse of the day
   */
  async getVerseOfTheDay(version = 'kjv') {
    try {
      // Use date to determine verse of the day
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      const verseIndex = dayOfYear % POPULAR_VERSES.length;
      const reference = POPULAR_VERSES[verseIndex];
      
      return await this.getVerse(reference, version);
    } catch (error) {
      throw new Error(`Failed to get verse of the day: ${error.message}`);
    }
  }

  /**
   * Validate verse reference format
   * @param {string} reference - Verse reference to validate
   * @returns {boolean} Whether reference is valid
   */
  validateReference(reference) {
    if (!reference || typeof reference !== 'string') {
      return false;
    }

    // Basic validation for common verse reference formats
    const versePattern = /^[1-9]?\s*[A-Za-z]+\s+[0-9]+(?::[0-9]+(?:-[0-9]+)?)?(?:\s*,\s*[0-9]+(?::[0-9]+(?:-[0-9]+)?)?)*$/;
    return versePattern.test(reference.trim());
  }

  /**
   * Convert verse reference to API.Bible format
   * @param {string} reference - Verse reference (e.g., "John 3:16")
   * @returns {string} API.Bible format (e.g., "JHN.3.16")
   */
  convertReferenceToApiFormat(reference) {
    const parts = reference.trim().split(/\s+/);
    if (parts.length < 2) return reference;

    let bookName = '';
    let chapterVerse = '';

    // Handle multi-word book names
    if (parts.length > 2) {
      const possibleBook = parts.slice(0, -1).join(' ');
      if (BOOK_MAP[possibleBook]) {
        bookName = BOOK_MAP[possibleBook];
        chapterVerse = parts[parts.length - 1];
      } else {
        bookName = BOOK_MAP[parts[0]] || parts[0];
        chapterVerse = parts.slice(1).join(' ');
      }
    } else {
      bookName = BOOK_MAP[parts[0]] || parts[0];
      chapterVerse = parts[1];
    }

    // Handle verse ranges (e.g., "1:2-9" or "1:2-9,15-20")
    if (chapterVerse.includes(':')) {
      const [chapter, versePart] = chapterVerse.split(':');
      
      // Check if it's a range
      if (versePart.includes('-')) {
        // For ranges, API.Bible expects format like "JAS.1.2-9"
        const verseRange = versePart.replace('-', '-');
        return `${bookName}.${chapter}.${verseRange}`;
      } else {
        // Single verse
        return `${bookName}.${chapter}.${versePart}`;
      }
    }
    
    // Just chapter reference
    return `${bookName}.${chapterVerse}`;
  }

  /**
   * Convert verse range to API.Bible passage format
   * @param {string} reference - Verse reference (e.g., "James 1:2-9")
   * @returns {string} API.Bible passage format (e.g., "JAS.1.2-JAS.1.9")
   */
  convertRangeToPassageFormat(reference) {
    const rangeMatch = reference.match(/^(.+?)(\d+):(\d+)-(\d+)$/);
    
    if (!rangeMatch) {
      return this.convertReferenceToApiFormat(reference);
    }
    
    const [, book, chapter, startVerse, endVerse] = rangeMatch;
    const bookName = BOOK_MAP[book.trim()] || book.trim();
    
    // API.Bible passage format: BOOK.CHAPTER.VERSE-BOOK.CHAPTER.VERSE
    return `${bookName}.${chapter}.${startVerse}-${bookName}.${chapter}.${endVerse}`;
  }

  /**
   * Get supported Bible versions
   * @returns {Array} Array of supported versions
   */
  getSupportedVersions() {
    return Object.keys(this.versionMap);
  }

  /**
   * Get available Bible versions from API.Bible
   * @returns {Promise<Array>} Array of available Bible versions
   */
  async getAvailableBibles() {
    try {
      const url = `${this.baseUrl}/bibles`;
      const response = await axios.get(url, {
        timeout: 30000, // Increased timeout to 30 seconds
        headers: {
          'api-key': this.apiKey,
          'User-Agent': 'ScriptureStream/1.0'
        }
      });

      if (!response.data || !response.data.data) {
        return [];
      }

      const bibles = response.data.data.map(bible => ({
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation,
        language: bible.language?.name || 'Unknown',
        description: bible.description || '',
        copyright: bible.copyright || ''
      }));

      // Build dynamic version mapping
      this.buildDynamicVersionMap(bibles);

      return bibles;
    } catch (error) {
      console.error('Failed to fetch available Bibles:', error.message);
      
      // Return fallback common Bible versions if API fails
      const fallbackBibles = [
        {
          id: 'de4e12af7f28f599-02',
          name: 'King James (Authorised) Version',
          abbreviation: 'engKJV',
          language: 'English',
          description: 'Protestant',
          copyright: ''
        },
        {
          id: '06125adad2d5898a-01',
          name: 'The Holy Bible, American Standard Version',
          abbreviation: 'ASV',
          language: 'English',
          description: 'Bible',
          copyright: ''
        },
        {
          id: '9879dbb7cfe39e4d-04',
          name: 'World English Bible',
          abbreviation: 'WEB',
          language: 'English',
          description: 'Protestant',
          copyright: ''
        },
        {
          id: 'bba9f40183526463-01',
          name: 'Berean Standard Bible',
          abbreviation: 'BSB',
          language: 'English',
          description: 'Berean Standard Bible',
          copyright: ''
        }
      ];
      
      console.log('Using fallback Bible versions:', fallbackBibles.length);
      return fallbackBibles;
    }
  }

  /**
   * Format verse for display
   * @param {Object} verse - Verse object
   * @param {Object} options - Formatting options
   * @returns {string} Formatted verse text
   */
  formatVerse(verse, options = {}) {
    const {
      includeReference = true,
      includeVersion = false,
      maxLength = null
    } = options;

    let formatted = '';
    
    if (includeReference) {
      formatted += `${verse.reference}: `;
    }
    
    formatted += verse.text;
    
    if (includeVersion && verse.version) {
      formatted += ` (${verse.version.toUpperCase()})`;
    }

    if (maxLength && formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }

    return formatted;
  }
}

module.exports = new BibleService();
