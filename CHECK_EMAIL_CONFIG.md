# Email Configuration Check Commands

VPS-এ SSH করে এই commands run করুন:

## 1. Environment Variables Check
```bash
cd /var/www/publisherauthority/backend
echo "Checking environment variables..."
echo "EMAIL_HOST: ${EMAIL_HOST:-NOT SET}"
echo "EMAIL_USER: ${EMAIL_USER:-NOT SET}"
echo "EMAIL_PASSWORD: ${EMAIL_PASSWORD:+SET (hidden)}"
echo "EMAIL_PORT: ${EMAIL_PORT:-NOT SET}"
echo "EMAIL_FROM: ${EMAIL_FROM:-NOT SET}"
```

## 2. Check .env file exists
```bash
cd /var/www/publisherauthority/backend
if [ -f .env ]; then
  echo "✅ .env file exists"
  echo "Email config in .env:"
  grep -E "EMAIL_" .env | sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/'
else
  echo "❌ .env file NOT found"
fi
```

## 3. Check PM2 Environment Variables
```bash
pm2 show publisherauthority-backend | grep -A 20 "env:"
```

## 4. Check PM2 Logs for Email Errors
```bash
cd /var/www/publisherauthority/backend
echo "=== Checking PM2 logs for email errors ==="
pm2 logs publisherauthority-backend --lines 100 --nostream | grep -i "email\|verification\|sendEmail" | tail -20
```

## 5. Check Application Logs
```bash
cd /var/www/publisherauthority/backend
echo "=== Application logs ==="
tail -50 logs/pm2-combined.log | grep -i "email\|verification\|sendEmail"
```

## 6. Test Email Configuration (if .env exists)
```bash
cd /var/www/publisherauthority/backend
node -e "
require('dotenv').config();
const config = {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_FROM: process.env.EMAIL_FROM
};
console.log('Email Config:', JSON.stringify(config, null, 2));
"
```

## Solution Steps:

### Option 1: Add .env file (Recommended)
```bash
cd /var/www/publisherauthority/backend
nano .env
```

Add these lines:
```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Publisherauthority <Info@publisherauthority.com>
FRONTEND_URL=https://publisherauthority.com
```

Then restart PM2:
```bash
pm2 restart publisherauthority-backend
```

### Option 2: Add to ecosystem.config.js
Update ecosystem.config.js env section with email variables.

