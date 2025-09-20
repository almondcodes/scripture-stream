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

### Option 1: Docker (Recommended)

The easiest way to get started is using Docker Compose, which handles all database setup automatically:

```bash
# Start all services (PostgreSQL, backend, frontend, Redis)
docker compose up

# Or run in background
docker compose up -d
```

**Access points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

### Option 2: Manual Setup

If you prefer to run without Docker:

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database and user:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE scripture_stream;
   # Note: On Pop!_OS/Ubuntu, the postgres user typically exists without a password
   # If you need to set a password, run: ALTER USER postgres PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE scripture_stream TO postgres;
   \q
   ```

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and OBS settings
   # For Pop!_OS/Ubuntu, the DATABASE_URL should be:
   # DATABASE_URL="postgresql://postgres@localhost:5432/scripture_stream"
   ```

5. **Set up database:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```
   
   **Note:** The seed script creates default users:
   - Admin: `admin@scripturestream.com` / `admin123`
   - User: `user@scripturestream.com` / `admin123`

6. **Start development servers:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

8. **Login with seeded accounts:**
   - Admin: `admin@scripturestream.com` / `admin123`
   - User: `user@scripturestream.com` / `admin123`

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

### Database Setup

#### Using Docker (Automatic)
When using `docker compose up`, PostgreSQL is automatically configured with:
- Database: `scripture_stream`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

#### Manual PostgreSQL Setup

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Start PostgreSQL service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create database and user:**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   
   # Create database
   CREATE DATABASE scripture_stream;
   
   # On Pop!_OS/Ubuntu, the postgres user typically exists without a password
   # If you need to set a password, run: ALTER USER postgres PASSWORD 'postgres';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE scripture_stream TO postgres;
   
   # Exit psql
   \q
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Verify database setup:**
   ```bash
   # Open Prisma Studio to view your database
   npx prisma studio
   ```

### OBS Studio Setup
1. Install OBS Studio
2. Enable WebSocket server in OBS (Tools → WebSocket Server Settings)
3. Set password and port (default: 4455)
4. Create a text source named "Bible Verse"

### Environment Variables
```env
# Database (for Pop!_OS/Ubuntu - no password needed)
DATABASE_URL="postgresql://postgres@localhost:5432/scripture_stream"

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

## 🔧 Troubleshooting

### Database Issues

#### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
```

#### Permission Denied
```bash
# On Pop!_OS/Ubuntu, the postgres user typically doesn't have a password
# If you need to set one, run:
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
\q

# Or update your .env file to remove the password:
# DATABASE_URL="postgresql://postgres@localhost:5432/scripture_stream"
```

#### Database Doesn't Exist
```bash
# Recreate database
sudo -u postgres psql
DROP DATABASE IF EXISTS scripture_stream;
CREATE DATABASE scripture_stream;
GRANT ALL PRIVILEGES ON DATABASE scripture_stream TO postgres;
\q

# Run migrations again
cd backend
npx prisma migrate dev
```

#### Prisma Migration Issues
```bash
# Reset database and run migrations
cd backend
npx prisma migrate reset
npx prisma db seed
```

#### Seed Script Issues
If you encounter template seeding errors, the seed script has been updated to handle the Template model correctly. The script now uses `findFirst` and `create` instead of `upsert` for templates.

### Docker Issues

#### Permission Denied (Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, then try:
docker compose up
```

#### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :3001  # Backend
sudo lsof -i :5173  # Frontend

# Stop conflicting services or change ports in docker-compose.yml
```

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
