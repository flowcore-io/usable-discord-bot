# Deployment Guide

This guide covers various deployment options for the Usable Discord Bot.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Heroku Deployment](#heroku-deployment)
- [AWS Deployment](#aws-deployment)
- [VPS Deployment](#vps-deployment)
- [Railway Deployment](#railway-deployment)

## Prerequisites

For all deployment methods:

- Discord bot token and client ID
- Usable API key and workspace ID
- Fragment type IDs from Usable workspace

## Docker Deployment

### Local Docker

```bash
# Build the image
docker build -t usable-discord-bot .

# Run the container
docker run -d \
  --name usable-discord-bot \
  --env-file .env \
  --restart unless-stopped \
  usable-discord-bot
```

### Docker Compose

```bash
# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop the bot
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### GitHub Container Registry

The bot is automatically built and pushed to GitHub Container Registry on every
commit to `main`:

```bash
# Pull the latest image
docker pull ghcr.io/flowcore/usable-discord-bot:latest

# Run with environment variables
docker run -d \
  --name usable-discord-bot \
  -e DISCORD_BOT_TOKEN=your_token \
  -e USABLE_API_KEY=your_key \
  -e USABLE_WORKSPACE_ID=your_workspace_id \
  -e USABLE_ISSUE_FRAGMENT_TYPE_ID=your_fragment_type_id \
  --restart unless-stopped \
  ghcr.io/flowcore/usable-discord-bot:latest
```

## Heroku Deployment

### Using Heroku CLI

```bash
# Login to Heroku
heroku login

# Create a new app
heroku create usable-discord-bot

# Set environment variables
heroku config:set DISCORD_BOT_TOKEN=your_token
heroku config:set DISCORD_CLIENT_ID=your_client_id
heroku config:set USABLE_API_KEY=your_key
heroku config:set USABLE_WORKSPACE_ID=your_workspace_id
heroku config:set USABLE_ISSUE_FRAGMENT_TYPE_ID=your_fragment_type_id
heroku config:set NODE_ENV=production

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Using Heroku Dashboard

1. Create new app in Heroku dashboard
2. Connect to GitHub repository
3. Enable automatic deploys from `main` branch
4. Add config vars in Settings → Config Vars
5. Deploy branch

### Procfile

Create a `Procfile` for Heroku:

```
worker: npm start
```

## AWS Deployment

### AWS ECS (Elastic Container Service)

1. **Push image to ECR**:
   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag image
   docker build -t usable-discord-bot .
   docker tag usable-discord-bot:latest your-account.dkr.ecr.us-east-1.amazonaws.com/usable-discord-bot:latest

   # Push image
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/usable-discord-bot:latest
   ```

2. **Create ECS Task Definition**:
   - Container image:
     `your-account.dkr.ecr.us-east-1.amazonaws.com/usable-discord-bot:latest`
   - Task size: 0.5 vCPU, 1 GB memory
   - Add environment variables
   - Configure CloudWatch logging

3. **Create ECS Service**:
   - Launch type: Fargate
   - Desired tasks: 1
   - Enable auto-restart

### AWS Lambda (Alternative)

For serverless deployment, Lambda isn't ideal for a long-running bot. Consider
ECS or EC2.

### AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/your-org/usable-discord-bot.git
cd usable-discord-bot

# Install dependencies
npm ci --only=production

# Create .env file
nano .env
# Paste your environment variables

# Build project
npm run build

# Install PM2
sudo npm install -g pm2

# Start bot with PM2
pm2 start dist/index.js --name usable-discord-bot

# Save PM2 configuration
pm2 save
pm2 startup
```

## VPS Deployment (DigitalOcean, Linode, Vultr)

### Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential

# Create application user
sudo useradd -m -s /bin/bash botuser
sudo su - botuser
```

### Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/usable-discord-bot.git
cd usable-discord-bot

# Install dependencies
npm ci --only=production

# Create .env file
nano .env
# Add your environment variables

# Build project
npm run build

# Install PM2 globally
sudo npm install -g pm2

# Start bot
pm2 start dist/index.js --name usable-discord-bot

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command PM2 outputs

pm2 save
```

### Nginx Reverse Proxy (Optional, for webhooks)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Railway Deployment

Railway offers simple, one-click deployment:

1. **Via GitHub**:
   - Go to [Railway](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose the repository
   - Railway auto-detects Node.js

2. **Add Environment Variables**:
   - Go to project settings
   - Add all required environment variables
   - Railway automatically restarts on changes

3. **Deploy**:
   - Railway automatically deploys on every push to `main`
   - View logs in Railway dashboard

### railway.json

Create `railway.json` for custom configuration:

```json
{
   "build": {
      "builder": "NIXPACKS"
   },
   "deploy": {
      "startCommand": "npm start",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
   }
}
```

## Monitoring and Logs

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs usable-discord-bot

# Monitor metrics
pm2 monit

# Restart bot
pm2 restart usable-discord-bot

# Stop bot
pm2 stop usable-discord-bot
```

### Docker Logs

```bash
# View logs
docker logs -f usable-discord-bot

# Last 100 lines
docker logs --tail 100 usable-discord-bot
```

### CloudWatch (AWS)

- Enable CloudWatch logging in ECS task definition
- View logs in CloudWatch Logs console
- Set up alarms for errors

## Health Checks

The bot includes built-in health check endpoints for Kubernetes and container
orchestration platforms.

### Health Endpoints

The bot exposes two HTTP endpoints on port 3000 (configurable via
`HEALTH_PORT`):

#### Liveness Probe: `/health/live`

Always returns 200 if the process is running. Use this for Kubernetes liveness
probes.

```bash
curl http://localhost:3000/health/live
```

Response:

```json
{
   "status": "ok",
   "timestamp": "2025-10-16T12:00:00.000Z"
}
```

#### Readiness Probe: `/health/ready`

Returns 200 only when the Discord bot is connected and ready. Returns 503 if not
ready.

```bash
curl http://localhost:3000/health/ready
```

Response (ready):

```json
{
   "status": "ready",
   "discord_connected": true,
   "timestamp": "2025-10-16T12:00:00.000Z"
}
```

Response (not ready):

```json
{
   "status": "not_ready",
   "discord_connected": false,
   "timestamp": "2025-10-16T12:00:00.000Z"
}
```

### Kubernetes Configuration

Add these probes to your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
   name: usable-discord-bot
spec:
   template:
      spec:
         containers:
            - name: bot
              image: ghcr.io/flowcore/usable-discord-bot:latest
              ports:
                 - containerPort: 3000
                   name: http
              env:
                 - name: HEALTH_PORT
                   value: "3000"
              livenessProbe:
                 httpGet:
                    path: /health/live
                    port: 3000
                 initialDelaySeconds: 10
                 periodSeconds: 30
                 timeoutSeconds: 3
                 failureThreshold: 3
              readinessProbe:
                 httpGet:
                    path: /health/ready
                    port: 3000
                 initialDelaySeconds: 5
                 periodSeconds: 10
                 timeoutSeconds: 3
                 failureThreshold: 3
```

### Docker Health Check

Update your Dockerfile with a proper HTTP health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1
```

### Environment Variables

Configure the health check port (defaults to 3000):

```bash
HEALTH_PORT=3000  # Optional, defaults to 3000
```

## Scaling

The bot is designed to run as a single instance. For high-volume servers:

1. **Optimize Discord Gateway**:
   - Use sharding for 2500+ servers
   - Implement session resume logic

2. **Database Integration**:
   - Add PostgreSQL/MongoDB for persistence
   - Store thread-to-fragment mappings

3. **Queue System**:
   - Use Redis/Bull for job queuing
   - Handle rate limiting gracefully

## Backup and Recovery

### Environment Variables Backup

Store environment variables securely:

- Use a password manager (1Password, LastPass)
- Store in secure cloud storage (encrypted)
- Use secret management (AWS Secrets Manager, HashiCorp Vault)

### Data Backup

If using a database:

- Set up automated backups
- Test restore procedures
- Store backups in multiple locations

## Security Considerations

1. **Never commit `.env` files**
2. **Rotate API keys regularly**
3. **Use least privilege for bot permissions**
4. **Enable 2FA on Discord and Usable accounts**
5. **Monitor logs for suspicious activity**
6. **Keep dependencies updated**

## Troubleshooting

### Bot disconnects frequently

- Check network stability
- Verify API rate limits
- Review error logs
- Increase memory allocation

### High CPU usage

- Enable debug logging: `LOG_LEVEL=debug`
- Check for infinite loops
- Review event handler efficiency

### Memory leaks

- Monitor memory usage: `pm2 monit`
- Restart periodically if needed
- Profile with Node.js `--inspect`

## Cost Estimates

| Platform           | Monthly Cost | Notes                  |
| ------------------ | ------------ | ---------------------- |
| VPS (DigitalOcean) | $5-10        | Basic droplet          |
| Railway            | $5           | Free tier available    |
| Heroku             | $7           | Eco dyno               |
| AWS ECS            | $10-15       | Fargate, minimal usage |
| AWS EC2            | $5-10        | t3.micro instance      |

## Support

For deployment issues:

- Check deployment logs
- Review environment variables
- Verify network connectivity
- Contact maintainers

---

**Happy Deploying! 🚀**
