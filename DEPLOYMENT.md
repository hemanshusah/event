# Deployment Guide - Growth Catalyst Platform

## 🚀 Overview

This guide covers the complete deployment process for The Growth Catalyst Platform, including CI/CD pipeline setup, environment configurations, and production deployment strategies.

## 📋 Prerequisites

### Required Tools
- Docker & Docker Compose
- Node.js 18+
- Git
- Access to GitHub repository
- Docker Hub account (for image publishing)
- Cloud provider account (AWS/GCP/Azure)

### Required Secrets
Set up the following secrets in your GitHub repository:

#### Docker Hub
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password

#### Security
- `SNYK_TOKEN`: Snyk security scanning token
- `JWT_SECRET`: JWT signing secret
- `POSTGRES_PASSWORD`: Database password
- `REDIS_PASSWORD`: Redis password

#### Cloud Services
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `SMTP_PASS`: Email service password
- `FCM_SERVER_KEY`: Firebase Cloud Messaging key

#### Mobile App Stores
- `ANDROID_KEYSTORE`: Android keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Android keystore password
- `ANDROID_KEY_PASSWORD`: Android key password
- `ANDROID_KEY_ALIAS`: Android key alias
- `APP_STORE_CONNECT_API_KEY`: Apple App Store Connect API key
- `GOOGLE_PLAY_SERVICE_ACCOUNT`: Google Play service account JSON

## 🔄 CI/CD Pipeline

### Workflow Overview

The platform uses GitHub Actions for continuous integration and deployment with the following workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Lint checking
   - Unit and integration tests
   - Security scanning
   - Docker image building
   - Deployment to staging/production

2. **Mobile Release** (`.github/workflows/mobile-release.yml`)
   - Triggered by mobile version tags
   - Builds iOS and Android apps
   - Publishes to app stores

### Pipeline Stages

#### 1. Lint & Format Check
- Backend code linting (ESLint)
- Frontend code linting (ESLint)
- Mobile app linting (ESLint)
- Code formatting validation

#### 2. Testing
- **Backend Tests**: Unit tests, integration tests, database tests
- **Frontend Tests**: Component tests, integration tests
- **Mobile Tests**: Unit tests, component tests
- **Coverage Reports**: Code coverage tracking with Codecov

#### 3. Security Scanning
- NPM audit for vulnerabilities
- Snyk security scanning
- Dependency vulnerability checks

#### 4. Build & Package
- Docker image building
- Multi-platform builds
- Artifact storage

#### 5. Deployment
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch
- **Mobile**: Manual deployment with version tags

## 🏗️ Environment Configurations

### Development Environment
```bash
# Start development environment
./start-dev.sh

# Access points
Web Admin: http://localhost:3001
API Gateway: http://localhost:3000
Database: localhost:5432
Redis: localhost:6379
```

### Staging Environment
```bash
# Deploy to staging
./deploy.sh --environment staging --version v1.0.0

# Access points
Web Admin: https://staging-admin.growthcatalyst.com
API Gateway: https://staging-api.growthcatalyst.com
```

### Production Environment
```bash
# Deploy to production
./deploy.sh --environment production --version v1.0.0

# Access points
Web Admin: https://admin.growthcatalyst.com
API Gateway: https://api.growthcatalyst.com
```

## 🐳 Docker Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3
```

### Docker Images

#### API Gateway
```dockerfile
# Build
docker build -t growth-catalyst-api:latest ./backend/api-gateway

# Run
docker run -p 3000:3000 growth-catalyst-api:latest
```

#### Web Admin
```dockerfile
# Build
docker build -t growth-catalyst-web:latest ./web-admin

# Run
docker run -p 80:80 growth-catalyst-web:latest
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)
1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name growth-catalyst
   ```

2. **Create Task Definition**
   ```json
   {
     "family": "growth-catalyst-api",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "api-gateway",
         "image": "your-account/growth-catalyst-api:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ]
       }
     ]
   }
   ```

3. **Create Service**
   ```bash
   aws ecs create-service \
     --cluster growth-catalyst \
     --service-name api-gateway \
     --task-definition growth-catalyst-api:1 \
     --desired-count 2
   ```

#### Using EKS (Elastic Kubernetes Service)
1. **Create EKS Cluster**
   ```bash
   eksctl create cluster --name growth-catalyst --region us-east-1
   ```

2. **Deploy with Helm**
   ```bash
   helm install growth-catalyst ./helm-charts/growth-catalyst
   ```

### Google Cloud Platform

#### Using Cloud Run
1. **Deploy API Gateway**
   ```bash
   gcloud run deploy api-gateway \
     --image gcr.io/project-id/growth-catalyst-api:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Deploy Web Admin**
   ```bash
   gcloud run deploy web-admin \
     --image gcr.io/project-id/growth-catalyst-web:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Azure

#### Using Container Instances
1. **Create Resource Group**
   ```bash
   az group create --name growth-catalyst --location eastus
   ```

2. **Deploy Container Group**
   ```bash
   az container create \
     --resource-group growth-catalyst \
     --name growth-catalyst \
     --image your-registry/growth-catalyst-api:latest \
     --dns-name-label growth-catalyst-api \
     --ports 3000
   ```

## 📱 Mobile App Deployment

### iOS App Store

#### Prerequisites
- Apple Developer Account
- Xcode installed
- App Store Connect API key

#### Build Process
1. **Create Release Tag**
   ```bash
   git tag mobile-v1.0.0
   git push origin mobile-v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build iOS app
   - Create archive
   - Upload to App Store Connect

#### Manual Upload
```bash
# Build for release
cd mobile-apps/ios
npm run build:ios

# Archive
xcodebuild -workspace ios/GrowthCatalyst.xcworkspace \
  -scheme GrowthCatalyst \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath GrowthCatalyst.xcarchive \
  archive

# Upload to App Store
xcrun altool --upload-app \
  -f GrowthCatalyst.ipa \
  -u your-apple-id \
  -p your-app-specific-password
```

### Android Google Play

#### Prerequisites
- Google Play Console account
- Android keystore file
- Service account JSON

#### Build Process
1. **Create Release Tag**
   ```bash
   git tag mobile-v1.0.0
   git push origin mobile-v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build Android APK
   - Sign with keystore
   - Upload to Google Play

#### Manual Upload
```bash
# Build for release
cd mobile-apps/android
npm run build:android

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore your-keystore.jks \
  -storepass your-store-password \
  -keypass your-key-password \
  app-release-unsigned.apk \
  your-key-alias

# Upload to Google Play
fastlane supply --apk app-release.apk
```

## 🔧 Environment Variables

### Required Environment Variables

#### Database
```bash
POSTGRES_DB=growth_catalyst
POSTGRES_USER=gc_user
POSTGRES_PASSWORD=your-secure-password
DATABASE_URL=postgresql://gc_user:password@host:5432/growth_catalyst
```

#### Redis
```bash
REDIS_URL=redis://:password@host:6379
REDIS_PASSWORD=your-redis-password
```

#### JWT
```bash
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

#### File Storage
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=growth-catalyst-files
```

#### Email
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Push Notifications
```bash
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
```

## 📊 Monitoring & Logging

### Health Checks
- **API Gateway**: `GET /health`
- **Web Admin**: `GET /health`
- **Database**: Connection check
- **Redis**: Ping check

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation and analysis

### Log Management
```bash
# View application logs
docker-compose logs -f api-gateway

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

## 🔒 Security Considerations

### SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirects
- Set up HSTS headers

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups

### Application Security
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### Secrets Management
- Use environment variables
- Never commit secrets to git
- Use secret management services (AWS Secrets Manager, Azure Key Vault)
- Rotate secrets regularly

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database status
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### API Gateway Not Responding
```bash
# Check API Gateway status
docker-compose ps api-gateway

# Check logs
docker-compose logs api-gateway

# Restart API Gateway
docker-compose restart api-gateway
```

#### Web Admin Not Loading
```bash
# Check nginx status
docker-compose ps nginx

# Check nginx logs
docker-compose logs nginx

# Restart nginx
docker-compose restart nginx
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=*
export NODE_ENV=development

# Start with debug mode
docker-compose up
```

## 📈 Performance Optimization

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas

### Application Optimization
- Caching strategies
- CDN usage
- Image optimization
- Code splitting

### Infrastructure Optimization
- Auto-scaling
- Load balancing
- Resource monitoring
- Cost optimization

## 🔄 Backup & Recovery

### Database Backups
```bash
# Create backup
docker-compose exec postgres pg_dump -U gc_user growth_catalyst > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U gc_user growth_catalyst < backup.sql
```

### File Backups
- S3 versioning enabled
- Cross-region replication
- Regular backup verification

### Disaster Recovery
- Multi-region deployment
- Automated failover
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)

## 📞 Support

For deployment issues:
1. Check the logs
2. Review this documentation
3. Check GitHub issues
4. Contact the DevOps team

---

**Last Updated**: October 5, 2025  
**Version**: 1.0  
**Maintainer**: Dazuservices DevOps Team
