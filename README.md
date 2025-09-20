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
   
   # IMPORTANT: Change the JWT_SECRET in production!
   # Generate a strong secret: openssl rand -base64 32
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
   
   **⚠️ Security Note:** Change these default passwords immediately in production!

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

# JWT - MUST be changed in production (use a strong, random secret)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# OBS
OBS_DEFAULT_URL="ws://localhost:4455"
OBS_DEFAULT_PASSWORD="your-obs-password"

# API
PORT=3001
NODE_ENV=development

# Security
CORS_ORIGIN="http://localhost:5173"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"
```

### Security Configuration

#### Production Security Checklist
- [ ] Change default JWT secret to a strong, random value
- [ ] Use HTTPS in production
- [ ] Set up proper CORS origins (not `*`)
- [ ] Configure rate limiting appropriately
- [ ] Use environment-specific database credentials
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up proper firewall rules
- [ ] Use a reverse proxy (nginx/Apache)
- [ ] Enable security headers
- [ ] Regular security updates

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

### Security Issues

#### Default Credentials
```bash
# Change default admin password immediately
# Login as admin and update password through the UI
# Or update directly in database:
sudo -u postgres psql -d scripture_stream
UPDATE users SET password = '$2a$12$NEW_HASHED_PASSWORD' WHERE email = 'admin@scripturestream.com';
```

#### JWT Secret Security
```bash
# Generate a strong JWT secret
openssl rand -base64 32

# Update your .env file with the new secret
JWT_SECRET="your-generated-secret-here"
```

#### Database Security
```bash
# Create a dedicated database user (recommended)
sudo -u postgres psql
CREATE USER scripture_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE scripture_stream TO scripture_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scripture_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scripture_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://scripture_user:strong_password@localhost:5432/scripture_stream"
```

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

## 🔒 Security Best Practices

### Development
- Never commit `.env` files or sensitive data
- Use strong, unique passwords for all accounts
- Regularly update dependencies for security patches
- Use HTTPS in production environments
- Implement proper input validation and sanitization

### Production Deployment
- Use environment variables for all sensitive configuration
- Enable database SSL/TLS connections
- Set up proper firewall rules
- Use a reverse proxy (nginx/Apache) with SSL termination
- Implement proper logging and monitoring
- Regular security audits and penetration testing
- Keep all dependencies updated

### Data Protection
- Encrypt sensitive data at rest
- Use secure session management
- Implement proper access controls
- Regular backup and recovery testing
- GDPR/Privacy compliance considerations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Follow security best practices
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Security Disclaimer

This application is provided for educational and development purposes. When deploying to production:

- **Change all default passwords and secrets**
- **Use HTTPS/TLS encryption**
- **Implement proper authentication and authorization**
- **Regular security updates and monitoring**
- **Follow OWASP security guidelines**
- **Conduct security audits before production deployment**

## 🙏 Acknowledgments

- Bible API: https://bible-api.com/
- OBS Studio: https://obsproject.com/
- React: https://reactjs.org/
- Node.js: https://nodejs.org/
- OWASP Security Guidelines: https://owasp.org/
