# Bible Configuration

This directory contains configuration files for the Bible service.

## Files

### `bibleConfig.js`

Contains all Bible-related configuration including:

- **BIBLE_VERSIONS**: Mapping of version codes to API.Bible IDs
- **POPULAR_VERSES**: Array of popular verses for random selection and daily verses
- **BOOK_MAP**: Mapping of book names to API.Bible abbreviations

## Adding New Bible Versions

To add a new Bible version:

1. Get the Bible ID from [API.Bible](https://scripture.api.bible/)
2. Add the mapping to `BIBLE_VERSIONS` in `bibleConfig.js`:

```javascript
const BIBLE_VERSIONS = {
  'kjv': 'de4e12af7f28f599-02',
  'niv': '06125adad2d5898a-01',
  'esv': '65eec8e0b60e656b-01',
  'nasb': 'bbd1e3b4b8b4c8b5-01',
  'your-new-version': 'your-bible-id-here'  // Add new version
};
```

3. Update the `SUPPORTED_VERSIONS` environment variable in your `.env` file:

```bash
SUPPORTED_VERSIONS="kjv,niv,esv,nasb,your-new-version"
```

## Adding Popular Verses

To add more verses to the popular verses list:

1. Add verse references to the `POPULAR_VERSES` array in `bibleConfig.js`
2. Use standard Bible reference format (e.g., "John 3:16", "Romans 8:28")

## Environment Variables

Make sure to set the following environment variables:

- `BIBLE_API_URL`: API.Bible base URL (default: https://api.scripture.api.bible/v1)
- `BIBLE_API_KEY`: Your API.Bible API key (required)
- `SUPPORTED_VERSIONS`: Comma-separated list of supported version codes
