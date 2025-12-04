# Nginx Configuration Fix

## Problem
The current nginx config strips `/api` prefix:
```nginx
location /api/ {
    proxy_pass http://localhost:5003/;  # Strips /api
}
```

When request comes: `/api/v1/auth/login`
Nginx forwards to: `http://localhost:5003/v1/auth/login` ❌

## Solution
Update nginx config to preserve `/api` prefix:
```nginx
location /api/ {
    proxy_pass http://localhost:5003/api/;  # Keeps /api
}
```

When request comes: `/api/v1/auth/login`
Nginx forwards to: `http://localhost:5003/api/v1/auth/login` ✅

## Commands to Fix on VPS

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Backup current config
cp /etc/nginx/sites-available/publisherauthority.com /etc/nginx/sites-available/publisherauthority.com.backup

# Edit nginx config
nano /etc/nginx/sites-available/publisherauthority.com

# Change line 34 (or 78) from:
#   proxy_pass http://localhost:5003/;
# To:
#   proxy_pass http://localhost:5003/api/;

# Test nginx config
nginx -t

# If test passes, reload nginx
systemctl reload nginx

# Restart backend to ensure it's running
pm2 restart publisherauthority-backend
```

## Alternative: Use sed command
```bash
sed -i 's|proxy_pass http://localhost:5003/;|proxy_pass http://localhost:5003/api/;|g' /etc/nginx/sites-available/publisherauthority.com
nginx -t && systemctl reload nginx
```

