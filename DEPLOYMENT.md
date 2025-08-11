# YouTube Shorts Automation - Deployment Guide

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd yt-auto

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Start the application
npm run dev

# 4. Test video generation
curl -X POST http://localhost:3000/api/test/quick-video
```

## 📦 Prerequisites

### Required Software
- **Node.js** 18+ (https://nodejs.org)
- **Python** 3.8+ (https://python.org)
- **FFmpeg** (https://ffmpeg.org)
- **PostgreSQL** 15+ (https://postgresql.org)

### Python Packages
```bash
pip3 install torch torchaudio chatterbox-tts
```

## 🐳 Docker Deployment (Recommended for Production)

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build image
docker build -t ytauto-app .

# Run with external PostgreSQL
docker run -d \
  --name ytauto \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/ytauto" \
  -e REDIS_URL="redis://host:6379" \
  -v $(pwd)/output:/app/output \
  ytauto-app
```

## ☁️ Cloud Deployment

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy to Render
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy with these settings:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`

### Deploy to AWS EC2

```bash
# 1. SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Install dependencies
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip ffmpeg postgresql

# 3. Clone and setup
git clone <your-repo>
cd yt-auto
./setup.sh

# 4. Install PM2 for process management
npm install -g pm2

# 5. Start with PM2
pm2 start npm --name "ytauto" -- start
pm2 save
pm2 startup
```

### Deploy to DigitalOcean

```bash
# 1. Create a Droplet (Ubuntu 22.04)

# 2. SSH and install dependencies
ssh root@your-droplet-ip
apt update && apt upgrade -y
apt install -y nodejs npm python3 python3-pip ffmpeg postgresql nginx

# 3. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE ytauto;
CREATE USER ytauto WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE ytauto TO ytauto;
\q

# 4. Clone and setup application
cd /var/www
git clone <your-repo>
cd yt-auto
npm install
npx prisma migrate deploy

# 5. Setup Nginx reverse proxy
cat > /etc/nginx/sites-available/ytauto << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/ytauto /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 6. Start with PM2
npm install -g pm2
pm2 start npm --name ytauto -- start
pm2 save
pm2 startup systemd
```

## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/ytauto?schema=public"

# Redis (optional, for job queues)
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=production

# API Keys (optional for full features)
OPENAI_API_KEY="your-key"  # For script generation
YOUTUBE_CLIENT_ID="your-id"  # For YouTube uploads
YOUTUBE_CLIENT_SECRET="your-secret"

# Security
JWT_SECRET="your-32-char-secret"
ENCRYPTION_KEY="exactly-32-characters-long-key!"
```

## 📊 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up SSL certificates (use Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up monitoring (PM2, New Relic, or DataDog)
- [ ] Configure backup strategy for database
- [ ] Set up log rotation
- [ ] Configure CDN for video delivery (optional)
- [ ] Set up Redis for job queues (optional)

## 🔍 Monitoring

### Using PM2
```bash
# View logs
pm2 logs ytauto

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U ytauto -d ytauto -h localhost

# Reset database
npx prisma migrate reset
npx prisma migrate deploy
```

### Python/Chatterbox Issues
```bash
# Reinstall Python packages
pip3 install --upgrade torch torchaudio chatterbox-tts

# Test Python script
python3 scripts/simple_tts.py "Test" output/test.wav
```

### FFmpeg Issues
```bash
# Check FFmpeg installation
ffmpeg -version

# Reinstall FFmpeg
# macOS
brew reinstall ffmpeg

# Ubuntu/Debian
sudo apt-get remove ffmpeg
sudo apt-get install ffmpeg
```

### Permission Issues
```bash
# Fix output directory permissions
chmod -R 755 output/
chown -R $USER:$USER output/
```

## 📈 Scaling Considerations

### For High Traffic
1. Use a load balancer (Nginx, HAProxy)
2. Deploy multiple app instances
3. Use Redis for session management
4. Implement CDN for video delivery
5. Use S3 or similar for video storage

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_videos_status ON "Video"(status);
CREATE INDEX idx_scripts_created ON "Script"("createdAt");
```

### Resource Requirements
- **Minimum**: 2 CPU cores, 4GB RAM
- **Recommended**: 4 CPU cores, 8GB RAM
- **Storage**: 50GB+ for videos

## 🔐 Security Best Practices

1. Always use HTTPS in production
2. Keep API keys in environment variables
3. Use strong database passwords
4. Implement rate limiting
5. Regular security updates
6. Use firewall rules to restrict access

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs` or `docker-compose logs`
- Database issues: `npx prisma studio`
- Create an issue on GitHub