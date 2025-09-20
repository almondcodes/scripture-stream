const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Validation middleware
const templateValidation = [
  body('name').notEmpty().withMessage('Template name is required'),
  body('description').optional().isString(),
  body('config').isObject().withMessage('Template configuration is required'),
  body('isPublic').optional().isBoolean()
];

// Get all public templates
router.get('/public', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.template.count({
      where: { isPublic: true }
    });

    res.json({
      success: true,
      data: templates,
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

// Get user's templates
router.get('/my', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const templates = await prisma.template.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.template.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: templates,
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

// Get template by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      },
      include: {
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

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/', templateValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, description, config, isPublic = false } = req.body;

    const template = await prisma.template.create({
      data: {
        name,
        description,
        config,
        isPublic,
        userId: req.user.id
      }
    });

    // Log to analytics
    await prisma.analytics.create({
      data: {
        userId: req.user.id,
        action: 'template_created',
        metadata: { templateId: template.id, name }
      }
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/:id', templateValidation, async (req, res, next) => {
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
    const { name, description, config, isPublic } = req.body;

    const template = await prisma.template.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name,
        description,
        config,
        isPublic,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    await prisma.template.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Clone template
router.post('/:id/clone', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const originalTemplate = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      }
    });

    if (!originalTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    const clonedTemplate = await prisma.template.create({
      data: {
        name: name || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        config: originalTemplate.config,
        isPublic: false, // Cloned templates are private by default
        userId: req.user.id
      }
    });

    // Log to analytics
    await prisma.analytics.create({
      data: {
        userId: req.user.id,
        action: 'template_cloned',
        metadata: { 
          originalTemplateId: id, 
          clonedTemplateId: clonedTemplate.id,
          name: clonedTemplate.name
        }
      }
    });

    res.status(201).json({
      success: true,
      data: clonedTemplate,
      message: 'Template cloned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get default templates
router.get('/defaults/list', (req, res) => {
  const defaultTemplates = [
    {
      id: 'default-1',
      name: 'Classic White',
      description: 'Clean white background with black text',
      config: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }
    },
    {
      id: 'default-2',
      name: 'Dark Theme',
      description: 'Dark background with light text',
      config: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(255,255,255,0.1)'
      }
    },
    {
      id: 'default-3',
      name: 'Elegant Gold',
      description: 'Elegant gold theme with serif font',
      config: {
        backgroundColor: '#f8f4e6',
        textColor: '#8b4513',
        fontSize: '26px',
        fontFamily: 'Georgia, serif',
        textAlign: 'center',
        padding: '25px',
        borderRadius: '12px',
        border: '2px solid #d4af37',
        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
      }
    },
    {
      id: 'default-4',
      name: 'Modern Blue',
      description: 'Modern blue gradient theme',
      config: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff',
        fontSize: '24px',
        fontFamily: 'Helvetica, sans-serif',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
      }
    }
  ];

  res.json({
    success: true,
    data: defaultTemplates
  });
});

module.exports = router;
