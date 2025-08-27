# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALL-I-PROJECT is a full-stack animal adoption platform with AI-generated imagery capabilities. The system connects users with adoptable animals, provides AI tools for content generation, and manages user accounts with secure authentication.

## Architecture

**Frontend (client/):**
- React 19 + Vite with React Router DOM for SPA routing
- Component-based architecture with shared Header/Footer layout
- Axios-based API client with automatic JWT token handling and 401 response interceptors
- Vite proxy configuration routes `/api` calls to backend (port 3003)
- Protected routes using AuthContext for authentication state management

**Backend (server/):**
- Express.js server on port 3003 with MySQL database
- JWT-based authentication using bcryptjs for password hashing
- RESTful API with controller-model-route separation pattern
- Comprehensive database schema for users, animals, shelters, images, and AI interactions
- Custom middleware for authentication, CORS, and request validation

**Key Architectural Patterns:**
- Frontend: React Context for global auth state, Axios interceptors for token management
- Backend: Express middleware pattern, bcrypt + JWT for secure authentication
- Database: Foreign key relationships, enum types for status fields, timestamp tracking
- API: Consistent JSON responses, error handling middleware

## Development Commands

### Full-stack Development
```bash
npm run dev          # Starts both frontend (5174) and backend (3003) concurrently
```

### Frontend (client/)
```bash
cd client
npm run dev          # Vite dev server on port 5174
npm run build        # Production build
npm run lint         # ESLint checking
npm run preview      # Preview production build
```

### Backend (server/)
```bash
cd server
npm run dev          # Development with nodemon
npm run start        # Production start
npm run sync:once    # Run animal data synchronization
```

### Database Management
```bash
cd server
node scripts/setup_database.js     # Initialize database with schema
node scripts/insert_test_data.js   # Insert test data (users, shelters, animals)
node scripts/test_db_connection.js # Verify database connectivity
node scripts/test_real_api.js      # End-to-end API testing
```

## Database Setup

Complete schema in `server/db/schema.sql` includes:
- **users**: Authentication, profiles (bcrypt hashed passwords)
- **animals**: Shelter animals with adoption status and metadata
- **shelters**: Animal care facilities with contact information
- **user_images**: User-uploaded content
- **generated_images**: AI-generated images with prompts
- **prompts**: AI interaction history
- **llm_logs**: API usage tracking

Test accounts available:
- testuser / test@example.com / Test123!@#
- admin / admin@allipet.com / Admin123!@#
- demo / demo@allipet.com / Demo123!@#

## Authentication Flow

The application uses a complete JWT-based authentication system:
1. **Registration/Login**: bcrypt hashing, JWT token generation
2. **Token Storage**: localStorage with automatic header injection
3. **Protected Routes**: AuthContext + ProtectedRoute component pattern
4. **Auto-logout**: 401 response interceptor clears tokens and redirects
5. **Backend Validation**: JWT middleware verifies tokens on protected endpoints

## Commit Conventions

Enforced gitemoji conventions with Korean/English support:
- 🎉 프로젝트 초기화 (Project initialization)
- ✨ 새로운 기능 추가 (New feature)
- 🐛 버그 수정 (Bug fix)
- ♻️ 리팩터링 (Refactoring)
- 📝 문서 작업 (Documentation)
- 🔐 보안 관련 (Security)

Git hooks automatically validate commit message format. See `docs/commit-convention.md` for complete guidelines.

## Key Configuration Files

- `client/vite.config.js` - Vite dev server (5174) with API proxy to backend
- `client/axios.js` - Axios instance with JWT interceptors and error handling  
- `server/config/database.js` - MySQL connection configuration
- `server/middleware/auth.js` - JWT authentication middleware
- `server/utils/hash.js` & `server/utils/jwt.js` - Authentication utilities

## API Endpoints

### Authentication
```
POST /api/register          # User registration with bcrypt hashing
POST /api/login             # JWT token-based authentication
```

### Core Resources
```
GET  /api/users             # User management (protected)
GET  /api/animals           # Available animals for adoption
GET  /api/shelters          # Shelter information and locations
```

### External Integration
```
GET  /api/external/animals  # Government animal data (apis.data.go.kr)
```

## Component Architecture

### Frontend Component Structure
The application follows a feature-based component organization:

**Core Layout Components:**
- `Header/` - Navigation with authentication state
- `Footer/` - Site-wide footer
- `Main/` - Landing page with animal showcase

**Authentication Flow:**
- `Login/` & `LoginModal/` - Authentication forms
- `Register/` - User registration with validation
- `ForgotId/` & `ForgotPassword/` - Account recovery
- `ProtectedRoute/` - Route guard component

**User Management:**
- `MyAccount/` - User profile management
- `Account/` - Account deletion functionality
- `AdoptionHistory/` - User adoption tracking

**Animal & Shelter Features:**
- `Animals/` - Animal listing with filtering
- `ShelterMap/` - Interactive shelter location map
- `AdoptionApply/` - Adoption application process

**AI Features:**
- `Maker/` - AI image generation interface
- `MakerResult/` - Generated content display
- `ImageUploader/` - File upload handling

### Backend Architecture Patterns

**Model Layer (`server/models/`):**
- Database abstraction with MySQL2 connection pooling
- Static methods for CRUD operations
- Input validation and sanitization

**Controller Layer (`server/controllers/`):**
- Business logic separation from routes
- Consistent error handling and response formatting
- JWT token validation for protected endpoints

**Middleware (`server/middleware/`):**
- Authentication middleware with JWT verification
- Request validation using express-validator
- Rate limiting and security headers

## Development Environment

**Prerequisites:**
- Node.js 18+ and npm
- MySQL 8.0+ with local instance on port 3306
- Development database credentials configured in `server/config/database.js`

**Quick Start:**
1. Clone repository and install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. Set up database:
   ```bash
   cd server
   node scripts/setup_database.js
   node scripts/insert_test_data.js
   ```

3. Start development servers:
   ```bash
   # From project root
   npm run dev  # Starts both frontend (5174) and backend (3003)
   ```

**Environment Variables:**
- Backend uses default MySQL connection (localhost:3306)
- Frontend Vite proxy automatically routes API calls to backend
- JWT secrets and database credentials should be configured for production

**Testing & Validation:**
- Use `node server/scripts/test_real_api.js` to verify API functionality
- Frontend development server includes hot reload for rapid iteration
- ESLint configured for code quality validation (`npm run lint` in client/)