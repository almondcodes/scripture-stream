const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Validation middleware
const playlistValidation = [
  body('name').notEmpty().withMessage('Playlist name is required'),
  body('description').optional().isString(),
  body('isPublic').optional().isBoolean()
];

const playlistItemValidation = [
  body('verseRef').notEmpty().withMessage('Verse reference is required'),
  body('verseText').notEmpty().withMessage('Verse text is required'),
  body('version').optional().isString(),
  body('order').optional().isInt({ min: 0 })
];

// Get user's playlists
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, includePublic = false } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id
    };

    if (includePublic === 'true') {
      where.OR = [
        { userId: req.user.id },
        { isPublic: true }
      ];
      delete where.userId;
    }

    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.playlist.count({ where });

    res.json({
      success: true,
      data: playlists,
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

// Get playlist by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    next(error);
  }
});

// Create playlist
router.post('/', playlistValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, description, isPublic = false } = req.body;

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        isPublic,
        userId: req.user.id
      },
      include: {
        items: true
      }
    });

    // Log to analytics
    await prisma.analytics.create({
      data: {
        userId: req.user.id,
        action: 'playlist_created',
        metadata: { playlistId: playlist.id, name }
      }
    });

    res.status(201).json({
      success: true,
      data: playlist,
      message: 'Playlist created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update playlist
router.put('/:id', playlistValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { id },
      data: {
        name,
        description,
        isPublic,
        updatedAt: new Date()
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: updatedPlaylist,
      message: 'Playlist updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete playlist
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    await prisma.playlist.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Add item to playlist
router.post('/:id/items', playlistItemValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const { verseRef, verseText, version = 'kjv', order } = req.body;

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    // Get the next order number if not provided
    let itemOrder = order;
    if (itemOrder === undefined) {
      const lastItem = await prisma.playlistItem.findFirst({
        where: { playlistId: id },
        orderBy: { order: 'desc' }
      });
      itemOrder = lastItem ? lastItem.order + 1 : 0;
    }

    const item = await prisma.playlistItem.create({
      data: {
        playlistId: id,
        verseRef,
        verseText,
        version,
        order: itemOrder
      }
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item added to playlist successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update playlist item
router.put('/:id/items/:itemId', playlistItemValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id, itemId } = req.params;
    const { verseRef, verseText, version, order } = req.body;

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    const item = await prisma.playlistItem.findFirst({
      where: { id: itemId, playlistId: id }
    });

    if (!item) {
      return res.status(404).json({
        error: 'Playlist item not found',
        code: 'ITEM_NOT_FOUND'
      });
    }

    const updatedItem = await prisma.playlistItem.update({
      where: { id: itemId },
      data: {
        verseRef,
        verseText,
        version,
        order
      }
    });

    res.json({
      success: true,
      data: updatedItem,
      message: 'Playlist item updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete playlist item
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const { id, itemId } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    const item = await prisma.playlistItem.findFirst({
      where: { id: itemId, playlistId: id }
    });

    if (!item) {
      return res.status(404).json({
        error: 'Playlist item not found',
        code: 'ITEM_NOT_FOUND'
      });
    }

    await prisma.playlistItem.delete({
      where: { id: itemId }
    });

    res.json({
      success: true,
      message: 'Playlist item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Reorder playlist items
router.put('/:id/reorder', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Items must be an array',
        code: 'INVALID_ITEMS'
      });
    }

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      });
    }

    // Update items in transaction
    await prisma.$transaction(
      items.map(item => 
        prisma.playlistItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Playlist items reordered successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
