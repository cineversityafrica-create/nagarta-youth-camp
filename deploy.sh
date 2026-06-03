#!/bin/bash
# NAGARTA Youth Camp - Automated Deployment Script
# Just run: bash deploy.sh

set -e  # Exit on error

echo "================================================"
echo "  NAGARTA YOUTH CAMP - AUTO DEPLOYMENT"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get user inputs
read -p "Enter your domain (e.g., nagartayouthcamp.com): " DOMAIN
read -p "Enter your email for SSL certificates: " EMAIL
read -p "Enter a strong password for PostgreSQL: " DB_PASSWORD
read -p "Enter a strong admin password: " ADMIN_PASSWORD

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')

echo -e "${YELLOW}[1/10] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/10] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${YELLOW}[3/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

echo -e "${YELLOW}[4/10] Installing PM2 & Nginx...${NC}"
npm install -g pm2
apt install -y nginx git certbot python3-certbot-nginx

echo -e "${YELLOW}[5/10] Setting up database...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE nagarta;
CREATE USER nagarta_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE nagarta TO nagarta_user;
\q
EOF

echo -e "${YELLOW}[6/10] Creating environment files...${NC}"

# Backend .env
cat > /var/www/nagarta-youth-camp/backend/.env <<EOF
DATABASE_URL="postgresql://nagarta_user:$DB_PASSWORD@localhost:5432/nagarta"
JWT_SECRET="$JWT_SECRET"
SESSION_SECRET="$SESSION_SECRET"
ADMIN_EMAIL="admin@$DOMAIN"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
ADMIN_NAME="Camp Administrator"
PORT=5000
FRONTEND_URL="https://$DOMAIN"
NODE_ENV="production"
EOF

# Frontend .env.local
cat > /var/www/nagarta-youth-camp/frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL="https://api.$DOMAIN"
EOF

echo -e "${YELLOW}[7/10] Building backend...${NC}"
cd /var/www/nagarta-youth-camp/backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start dist/index.js --name "nagarta-backend"

echo -e "${YELLOW}[8/10] Building frontend...${NC}"
cd /var/www/nagarta-youth-camp/frontend
npm install
npm run build
pm2 start npm --name "nagarta-frontend" -- start

pm2 save
pm2 startup

echo -e "${YELLOW}[9/10] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/nagarta <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name api.$DOMAIN;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/nagarta /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo -e "${YELLOW}[10/10] Installing SSL certificates...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN --email $EMAIL --agree-tos --non-interactive

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Your website is now LIVE:"
echo "  Frontend: https://$DOMAIN"
echo "  Admin:    https://$DOMAIN/admin"
echo "  API:      https://api.$DOMAIN"
echo ""
echo "ADMIN LOGIN:"
echo "  Email:    admin@$DOMAIN"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "Useful commands:"
echo "  pm2 status              # Check apps"
echo "  pm2 logs                # View logs"
echo "  pm2 restart all         # Restart everything"
echo ""
