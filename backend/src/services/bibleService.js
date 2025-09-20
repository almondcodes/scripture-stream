const axios = require('axios');
const { BIBLE_VERSIONS, POPULAR_VERSES, BOOK_MAP } = require('../config/bibleConfig');

class BibleService {
  constructor() {
    this.baseUrl = process.env.BIBLE_API_URL || 'https://api.scripture.api.bible/v1';
    this.apiKey = process.env.BIBLE_API_KEY;
    this.versionMap = BIBLE_VERSIONS;
    
    if (!this.apiKey) {
      throw new Error('BIBLE_API_KEY environment variable is required');
    }
  }

  /**
   * Fetch a Bible verse by reference
   * @param {string} reference - Bible verse reference (e.g., "John 3:16")
   * @param {string} version - Bible version (default: "kjv")
   * @returns {Promise<Object>} Verse data
   */
  async getVerse(reference, version = 'kjv') {
    try {
      const bibleId = this.versionMap[version] || this.versionMap['kjv'];
      
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
      const bibleId = this.versionMap[version] || this.versionMap['kjv'];
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

    // Convert chapter:verse format to chapter.verse
    const chapterVerseFormatted = chapterVerse.replace(':', '.');
    
    return `${bookName}.${chapterVerseFormatted}`;
  }

  /**
   * Get supported Bible versions
   * @returns {Array} Array of supported versions
   */
  getSupportedVersions() {
    return Object.keys(this.versionMap);
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
