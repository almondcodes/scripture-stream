const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const bibleService = require('../services/bibleService');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Validation middleware
const verseValidation = [
  query('reference').notEmpty().withMessage('Verse reference is required'),
  query('version').optional().isIn(bibleService.getSupportedVersions())
];

const searchValidation = [
  query('q').notEmpty().withMessage('Search query is required'),
  query('version').optional().isIn(bibleService.getSupportedVersions())
];

// Get verse by reference
router.get('/get', verseValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { reference, version = 'kjv' } = req.query;

    if (!bibleService.validateReference(reference)) {
      return res.status(400).json({
        error: 'Invalid verse reference format',
        code: 'INVALID_REFERENCE'
      });
    }

    const verse = await bibleService.getVerse(reference, version);

    // Log to analytics if user is authenticated
    if (req.user) {
      await prisma.analytics.create({
        data: {
          userId: req.user.id,
          action: 'verse_fetched',
          metadata: { reference, version }
        }
      });
    }

    res.json({
      success: true,
      data: verse
    });
  } catch (error) {
    next(error);
  }
});

// Search verses
router.get('/search', searchValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { q: query, version = 'kjv' } = req.query;
    const results = await bibleService.searchVerses(query, version);

    // Log to analytics if user is authenticated
    if (req.user) {
      await prisma.analytics.create({
        data: {
          userId: req.user.id,
          action: 'verse_searched',
          metadata: { query, version, resultCount: results.length }
        }
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
});

// Get random verse
router.get('/random', async (req, res, next) => {
  try {
    const { version = 'kjv' } = req.query;
    const verse = await bibleService.getRandomVerse(version);

    // Log to analytics if user is authenticated
    if (req.user) {
      await prisma.analytics.create({
        data: {
          userId: req.user.id,
          action: 'random_verse_fetched',
          metadata: { version }
        }
      });
    }

    res.json({
      success: true,
      data: verse
    });
  } catch (error) {
    next(error);
  }
});

// Get verse of the day
router.get('/daily', async (req, res, next) => {
  try {
    const { version = 'kjv' } = req.query;
    const verse = await bibleService.getVerseOfTheDay(version);

    // Log to analytics if user is authenticated
    if (req.user) {
      await prisma.analytics.create({
        data: {
          userId: req.user.id,
          action: 'daily_verse_fetched',
          metadata: { version }
        }
      });
    }

    res.json({
      success: true,
      data: verse
    });
  } catch (error) {
    next(error);
  }
});

// Get supported Bible versions
router.get('/versions', (req, res) => {
  res.json({
    success: true,
    data: bibleService.getSupportedVersions()
  });
});

// Add verse to favorites (requires authentication)
router.post('/favorite', authenticateToken, async (req, res, next) => {
  try {
    const { reference, text, version = 'kjv' } = req.body;

    if (!reference || !text) {
      return res.status(400).json({
        error: 'Reference and text are required',
        code: 'MISSING_FIELDS'
      });
    }

    const favorite = await prisma.favoriteVerse.upsert({
      where: {
        userId_verseRef: {
          userId: req.user.id,
          verseRef: reference
        }
      },
      update: {
        verseText: text,
        version,
        createdAt: new Date()
      },
      create: {
        userId: req.user.id,
        verseRef: reference,
        verseText: text,
        version
      }
    });

    res.json({
      success: true,
      data: favorite,
      message: 'Verse added to favorites'
    });
  } catch (error) {
    next(error);
  }
});

// Remove verse from favorites
router.delete('/favorite/:reference', authenticateToken, async (req, res, next) => {
  try {
    const { reference } = req.params;

    await prisma.favoriteVerse.deleteMany({
      where: {
        userId: req.user.id,
        verseRef: reference
      }
    });

    res.json({
      success: true,
      message: 'Verse removed from favorites'
    });
  } catch (error) {
    next(error);
  }
});

// Get user's favorite verses
router.get('/favorites', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const favorites = await prisma.favoriteVerse.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.favoriteVerse.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's verse history
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const history = await prisma.verseHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.verseHistory.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add verse to history
router.post('/history', authenticateToken, async (req, res, next) => {
  try {
    const { reference, text, version = 'kjv' } = req.body;

    if (!reference || !text) {
      return res.status(400).json({
        error: 'Reference and text are required',
        code: 'MISSING_FIELDS'
      });
    }

    const historyEntry = await prisma.verseHistory.create({
      data: {
        userId: req.user.id,
        verseRef: reference,
        verseText: text,
        version
      }
    });

    res.json({
      success: true,
      data: historyEntry,
      message: 'Verse added to history'
    });
  } catch (error) {
    next(error);
  }
});

// Get available Bible versions
router.get('/bibles', async (req, res, next) => {
  try {
    const bibles = await bibleService.getAvailableBibles();

    res.json({
      success: true,
      data: bibles,
      count: bibles.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
