# Development Guide - Growth Catalyst Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Docker & Docker Compose
- React Native CLI (for mobile development)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Setup
1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd growth-catalyst-platform
   ./setup.sh
   ```

2. **Start development:**
   ```bash
   ./start-dev.sh
   ```

3. **Access applications:**
   - Web Admin: http://localhost:3001
   - API Gateway: http://localhost:3000
   - Mobile: Use React Native CLI

## 📁 Project Structure

```
growth-catalyst-platform/
├── 📱 mobile-apps/           # React Native mobile apps
│   ├── ios/                 # iOS app
│   └── android/             # Android app
├── 🌐 web-admin/            # React.js admin dashboard
├── 🔧 backend/              # Node.js backend services
│   └── api-gateway/         # Main API server
├── 🗄️ database/             # Database schemas and seeds
├── 📚 docs/                 # Documentation
├── 🧪 tests/                # Test files
└── 🚀 deployment/           # Deployment configurations
```

## 🛠️ Development Workflow

### Backend Development
```bash
cd backend/api-gateway
npm run dev          # Start development server
npm test            # Run tests
npm run lint        # Lint code
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database
```

### Web Admin Development
```bash
cd web-admin
npm start           # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Lint code
```

### Mobile Development
```bash
# iOS
cd mobile-apps/ios
npm run ios        # Run on iOS simulator

# Android
cd mobile-apps/android
npm run android    # Run on Android emulator
```

## 🗄️ Database Management

### Local Development
The platform uses PostgreSQL with Redis for caching. Docker Compose is configured for local development:

```bash
# Start database services
docker-compose up -d postgres redis

# Run migrations
cd backend/api-gateway
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### Database Schema
- **Users**: Authentication and user management
- **Startups**: Startup profiles and information
- **Investors**: Investor profiles and verification
- **Events**: Event management and scheduling
- **Gamification**: Points, leaderboards, and achievements
- **Notifications**: User notifications and broadcasts

## 🔐 Authentication

The platform uses JWT-based authentication with role-based access control:

- **Founders**: Can create startup profiles, register for events
- **Investors**: Can view startups, request access to details
- **Admins**: Full platform management access

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

## 📱 Mobile App Features

### Navigation Structure
- **Auth Stack**: Login, Register, Onboarding
- **Main Tabs**: Home, Events, Startups, Notifications, Profile
- **Nested Stacks**: Event details, Startup details, Profile settings

### Key Screens
- **Home**: Dashboard with user progress and quick actions
- **Events**: Browse and register for events
- **Startups**: View startup profiles and request access
- **Profile**: User profile and settings
- **Notifications**: Push notifications and alerts

## 🌐 Web Admin Features

### Dashboard
- User statistics and analytics
- Recent activities and notifications
- Quick action buttons
- System health monitoring

### Management Sections
- **Users**: Manage founders, investors, and admins
- **Events**: Create and manage events across all stages
- **Startups**: Review and approve startup profiles
- **Investors**: Verify investor accounts
- **Notifications**: Send broadcasts and manage alerts

## 🎮 Gamification System

### Point System
- Profile completion: 100 points
- Event RSVP: 50 points
- Stage promotion: 500 points
- VDR access request: 200 points

### Leaderboards
- Event-wise leaderboard (resets per event)
- Overall leaderboard (cumulative points)
- Real-time updates and rankings

## 🔧 API Development

### Adding New Endpoints
1. Create route file in `backend/api-gateway/src/routes/`
2. Add validation schemas
3. Implement business logic
4. Add to main server.js
5. Update API documentation

### Database Operations
```javascript
// Query example
const result = await query(
  'SELECT * FROM users WHERE role = $1',
  ['founder']
);

// Transaction example
await transaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO startups ...');
});
```

## 🧪 Testing

### Backend Testing
```bash
cd backend/api-gateway
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd web-admin
npm test                   # Run tests
npm run test:coverage      # Coverage report
```

### Mobile Testing
```bash
cd mobile-apps/ios
npm test                   # Run tests
```

## 🚀 Deployment

### Environment Configuration
1. Copy `env.example` to `.env`
2. Update database URLs and API keys
3. Configure production settings

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# Scale services
docker-compose up -d --scale api-gateway=3
```

### Manual Deployment
1. Build applications
2. Set up production database
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Configure monitoring

## 📊 Monitoring & Analytics

### Health Checks
- API health: `GET /health`
- Database connectivity
- Redis connectivity
- Service status monitoring

### Logging
- Application logs
- Error tracking
- Performance metrics
- User activity logs

## 🔒 Security

### Authentication
- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Role-based access control
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

**Mobile App Won't Start**
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clean and rebuild
cd mobile-apps/ios
npm run clean
npm install
```

**API Gateway Not Responding**
```bash
# Check if port 3000 is available
lsof -i :3000

# Restart service
cd backend/api-gateway
npm run dev
```

### Debug Mode
Set `NODE_ENV=development` in your `.env` file for detailed error messages and logging.

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Documentation](https://reactjs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run linting
5. Submit pull request

## 📞 Support

For technical support or questions:
- Check this documentation
- Review the README.md
- Check GitHub issues
- Contact the development team
