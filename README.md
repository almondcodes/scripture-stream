# 📖 ScriptureStream

A full-stack Bible verse streaming application designed for OBS Studio integration. Stream God's Word to your audience with real-time collaboration, playlists, and advanced OBS controls.

## ✨ Features

- 🔐 **User Authentication** - Secure login and user management
- 📖 **Multiple Bible Versions** - KJV, NIV, ESV, and more
- 🎵 **Playlist Management** - Create and manage verse playlists
- 👥 **Real-time Collaboration** - Multi-user support with Socket.io
- 🎨 **Custom Templates** - Pre-designed verse layouts
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Auto-advance** - Timer-based verse progression
- 📊 **Analytics** - Usage tracking and popular verses
- 🎯 **OBS Integration** - Advanced WebSocket controls

## 🏗️ Architecture

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io for live updates

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and OBS settings
   ```

3. **Set up database:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

## 📁 Project Structure

```
scripture-stream/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API integration
│   │   └── utils/         # Helper functions
│   └── package.json
└── docs/                   # Documentation
```

## 🔧 Configuration

### OBS Studio Setup
1. Install OBS Studio
2. Enable WebSocket server in OBS (Tools → WebSocket Server Settings)
3. Set password and port (default: 4455)
4. Create a text source named "Bible Verse"

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/scripture_stream"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# OBS
OBS_DEFAULT_URL="ws://localhost:4455"
OBS_DEFAULT_PASSWORD="your-obs-password"

# API
PORT=3001
NODE_ENV=development
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Verses
- `GET /api/verses/search?q=john+3:16` - Search verses
- `GET /api/verses/random` - Get random verse
- `GET /api/verses/daily` - Get verse of the day

### Playlists
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist

### OBS Integration
- `POST /api/obs/send-verse` - Send verse to OBS
- `GET /api/obs/status` - Get OBS connection status
- `POST /api/obs/connect` - Connect to OBS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Bible API: https://bible-api.com/
- OBS Studio: https://obsproject.com/
- React: https://reactjs.org/
- Node.js: https://nodejs.org/
