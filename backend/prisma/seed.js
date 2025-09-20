const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@scripturestream.com' },
    update: {},
    create: {
      email: 'admin@scripturestream.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample user
  const sampleUser = await prisma.user.upsert({
    where: { email: 'user@scripturestream.com' },
    update: {},
    create: {
      email: 'user@scripturestream.com',
      username: 'sampleuser',
      password: hashedPassword,
      firstName: 'Sample',
      lastName: 'User'
    }
  });

  console.log('✅ Sample user created:', sampleUser.email);

  // Create default templates
  const defaultTemplates = [
    {
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
      },
      isPublic: true,
      userId: adminUser.id
    },
    {
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
      },
      isPublic: true,
      userId: adminUser.id
    },
    {
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
      },
      isPublic: true,
      userId: adminUser.id
    },
    {
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
      },
      isPublic: true,
      userId: adminUser.id
    }
  ];

  for (const template of defaultTemplates) {
    // Check if template already exists
    const existingTemplate = await prisma.template.findFirst({
      where: { name: template.name }
    });
    
    if (!existingTemplate) {
      await prisma.template.create({
        data: template
      });
    }
  }

  console.log('✅ Default templates created');

  // Create sample playlist
  const samplePlaylist = await prisma.playlist.create({
    data: {
      name: 'Inspirational Verses',
      description: 'A collection of uplifting Bible verses',
      isPublic: true,
      userId: sampleUser.id
    }
  });

  // Add sample verses to playlist
  const sampleVerses = [
    {
      verseRef: 'John 3:16',
      verseText: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      version: 'niv',
      order: 0
    },
    {
      verseRef: 'Romans 8:28',
      verseText: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
      version: 'niv',
      order: 1
    },
    {
      verseRef: 'Philippians 4:13',
      verseText: 'I can do all this through him who gives me strength.',
      version: 'niv',
      order: 2
    }
  ];

  for (const verse of sampleVerses) {
    await prisma.playlistItem.create({
      data: {
        playlistId: samplePlaylist.id,
        ...verse
      }
    });
  }

  console.log('✅ Sample playlist created');

  // Create sample OBS connection
  await prisma.obsConnection.create({
    data: {
      userId: sampleUser.id,
      name: 'Local OBS',
      url: 'ws://localhost:4455',
      password: 'laL2j8s2E7Sfnj7x',
      sourceName: 'Bible Verse',
      isActive: false
    }
  });

  console.log('✅ Sample OBS connection created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
