# Production Deployment Guide

## Prerequisites
- Docker & Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- MongoDB Atlas account (or self-hosted MongoDB)
- Redis Cloud account (or self-hosted Redis)
- Cloudinary account
- Server (AWS EC2, DigitalOcean, Azure VM, etc.)

## Quick Start with Docker

### 1. Clone and Configure
```bash
git clone <your-repo-url>
cd jobportal
cp .env.example .env
# Edit .env with your production credentials
```

### 2. Deploy with Docker Compose
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api-docs

## Environment Variables

### Required
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobportal
REDIS_URL=redis://username:password@redis-host:6379
JWT_SECRET=<generate-with-openssl-rand-base64-32>
FRONTEND_URL=https://yourdomain.com
```

### Cloudinary (Required for file uploads)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Third-Party Services (Optional)
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-key
```

## AWS Deployment

### 1. EC2 Instance Setup
```bash
# Launch Ubuntu 22.04 instance (t2.medium or higher)
# Configure security groups:
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 22 (SSH)

# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Setup Application
```bash
git clone <your-repo>
cd jobportal
nano .env  # Add production credentials
./deploy.sh
```

### 3. Setup Nginx Reverse Proxy
```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/jobportal

# Add:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## DigitalOcean Deployment

### 1. Create Droplet
- Ubuntu 22.04
- 2 GB RAM minimum
- Add SSH key

### 2. Deploy
```bash
ssh root@your-droplet-ip
git clone <your-repo>
cd jobportal
./deploy.sh
```

### 3. Configure Firewall
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

## MongoDB Atlas Setup

1. Create account at mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Add IP whitelist (0.0.0.0/0 for all IPs or specific IP)
4. Create database user
5. Get connection string
6. Update MONGODB_URI in .env

## Redis Cloud Setup

1. Create account at redis.com/cloud
2. Create free database (30MB)
3. Get connection details
4. Update REDIS_URL in .env

## Monitoring Setup

### Sentry (Error Tracking)
```bash
npm install @sentry/node
# Add to backend/index.js
```

### PM2 (Process Management)
```bash
npm install -g pm2
pm2 start backend/index.js --name jobportal-backend
pm2 startup
pm2 save
```

## Backup Strategy

### MongoDB Backup (Daily)
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGODB_URI" --out="/backups/mongo-$DATE"
# Upload to S3 or cloud storage
```

### Automated Backups
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## CI/CD with GitHub Actions

The pipeline automatically:
- Runs tests on push
- Builds Docker images
- Pushes to Docker Hub
- Deploys to production (configure in workflow)

Required GitHub Secrets:
- DOCKER_USERNAME
- DOCKER_PASSWORD
- SSH_PRIVATE_KEY (for deployment)
- SERVER_HOST
- SERVER_USER

## Health Checks

Monitor your application:
```bash
# Backend health
curl http://localhost:8000/api/v1/monitoring/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600
}
```

## Troubleshooting

### Check logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Database connection issues
```bash
docker-compose exec mongodb mongosh
# Check connection
```

## Performance Optimization

1. **Enable Caching**: Redis is already configured
2. **Database Indexing**: Run optimization script
   ```bash
   node backend/scripts/create-indexes.js
   ```
3. **CDN**: Use Cloudflare for static assets
4. **Load Balancer**: Use AWS ELB or Nginx for multiple instances

## Security Checklist

- ✅ HTTPS enabled (SSL certificate)
- ✅ Environment variables secured
- ✅ Database auth enabled
- ✅ Firewall configured
- ✅ Regular backups
- ✅ Security headers (Helmet)
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ CSRF protection
- ✅ XSS protection

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
  scale: 3
```

### Load Balancer
```bash
# Use Nginx upstream
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## Support

- Documentation: /api-docs
- Health Check: /api/v1/monitoring/health
- Logs: docker-compose logs

---

**Deployment Date**: January 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
