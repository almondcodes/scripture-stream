/**
 * Bible Configuration
 * Contains Bible version mappings and popular verses
 */

// Bible version mappings (API.Bible IDs)
const BIBLE_VERSIONS = {
  'kjv': 'de4e12af7f28f599-02', // King James Version
  'asv': '06125adad2d5898a-01', // American Standard Version
  'web': '9879dbb7cfe39e4d-04', // World English Bible (Protestant)
  'bsb': 'bba9f40183526463-01'  // Berean Standard Bible
};

// Popular verses for random selection and daily verses
const POPULAR_VERSES = [
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
  'Romans 12:2',
  'Psalm 91:1-2',
  'Isaiah 41:10',
  'Matthew 11:28-30',
  'John 14:6',
  'Romans 10:9-10',
  'Ephesians 3:20',
  'Philippians 1:6',
  'Colossians 3:23',
  '1 Thessalonians 5:16-18',
  '2 Timothy 1:7',
  'Hebrews 11:1',
  'James 1:2-3',
  '1 Peter 5:7',
  '1 John 4:19',
  'Revelation 3:20',
  'Psalm 37:4'
];

// Book name mapping for API.Bible format conversion
const BOOK_MAP = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR',
  'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Psalm': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC',
  'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC',
  'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
  'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
  'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
  '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
};

module.exports = {
  BIBLE_VERSIONS,
  POPULAR_VERSES,
  BOOK_MAP
};
