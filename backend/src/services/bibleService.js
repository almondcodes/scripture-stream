const axios = require('axios');

class BibleService {
  constructor() {
    this.baseUrl = process.env.BIBLE_API_URL || 'https://bible-api.com';
    this.supportedVersions = (process.env.SUPPORTED_VERSIONS || 'kjv,niv,esv,nasb').split(',');
  }

  /**
   * Fetch a Bible verse by reference
   * @param {string} reference - Bible verse reference (e.g., "John 3:16")
   * @param {string} version - Bible version (default: "kjv")
   * @returns {Promise<Object>} Verse data
   */
  async getVerse(reference, version = 'kjv') {
    try {
      if (!this.supportedVersions.includes(version)) {
        throw new Error(`Unsupported Bible version: ${version}`);
      }

      const url = `${this.baseUrl}/${encodeURIComponent(reference)}?translation=${version}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'ScriptureStream/1.0'
        }
      });

      if (!response.data || !response.data.text) {
        throw new Error('Verse not found');
      }

      return {
        reference: response.data.reference,
        text: response.data.text.trim(),
        version: version,
        translation_name: response.data.translation_name,
        translation_note: response.data.translation_note
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
      // Note: bible-api.com doesn't support search, so we'll implement a basic search
      // In a production app, you'd want to use a more comprehensive Bible API
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { q: query, translation: version },
        timeout: 10000
      });

      return response.data || [];
    } catch (error) {
      console.warn('Search not available, returning empty results');
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
      // Popular verses for random selection
      const popularVerses = [
        'John 3:16',
        'Romans 8:28',
        'Philippians 4:13',
        'Jeremiah 29:11',
        'Proverbs 3:5-6',
        'Psalm 23:1',
        'Matthew 28:20',
        'Isaiah 40:31',
        '2 Corinthians 5:17',
        'Ephesians 2:8-9',
        'Galatians 5:22-23',
        '1 Corinthians 13:4-7',
        'Matthew 6:33',
        'Psalm 46:10',
        'Romans 12:2'
      ];

      const randomReference = popularVerses[Math.floor(Math.random() * popularVerses.length)];
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
      
      const dailyVerses = [
        'John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Jeremiah 29:11',
        'Proverbs 3:5-6', 'Psalm 23:1', 'Matthew 28:20', 'Isaiah 40:31',
        '2 Corinthians 5:17', 'Ephesians 2:8-9', 'Galatians 5:22-23',
        '1 Corinthians 13:4-7', 'Matthew 6:33', 'Psalm 46:10', 'Romans 12:2',
        'Psalm 91:1-2', 'Isaiah 41:10', 'Matthew 11:28-30', 'John 14:6',
        'Romans 10:9-10', 'Ephesians 3:20', 'Philippians 1:6', 'Colossians 3:23',
        '1 Thessalonians 5:16-18', '2 Timothy 1:7', 'Hebrews 11:1', 'James 1:2-3',
        '1 Peter 5:7', '1 John 4:19', 'Revelation 3:20', 'Psalm 37:4'
      ];

      const verseIndex = dayOfYear % dailyVerses.length;
      const reference = dailyVerses[verseIndex];
      
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
   * Get supported Bible versions
   * @returns {Array} Array of supported versions
   */
  getSupportedVersions() {
    return this.supportedVersions;
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
