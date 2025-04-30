# Frontend Deployment Guide

This guide explains how to prepare and deploy the banking system frontend application.

## Architecture Overview

The frontend is built with:
- Angular 19.2.x
- Angular Material for UI components
- SCSS for styling
- Angular Router for navigation
- HTTP Interceptors for API communication
- Guards for route protection
- WebSocket for real-time features

## Pre-Deployment Checklist

1. **Environment Configuration**
   Create appropriate environment files in `src/environments/`:
   ```typescript
   // environment.prod.ts
   export const environment = {
     production: true,
     apiUrl: 'https://api.yourdomain.com',
     wsUrl: 'wss://api.yourdomain.com',
     enableDebug: false
   };
   ```

2. **Security Measures**
   - Update all dependencies to latest stable versions
   - Remove any hardcoded credentials
   - Enable production mode
   - Implement Content Security Policy
   - Configure CORS settings
   - Enable security headers

3. **Performance Optimization**
   - Enable production build optimizations
   - Configure bundle budgets
   - Implement lazy loading for routes
   - Enable compression
   - Set up proper caching headers

4. **Code Preparation**
   ```bash
   # Install dependencies
   npm install

   # Run tests
   ng test --browsers=ChromeHeadless --watch=false

   # Check for type errors
   ng lint
   ```

## Build Process

1. **Production Build**
   ```bash
   # Create production build
   ng build --configuration=production
   ```

   This will:
   - Compile with AOT (Ahead of Time)
   - Minify and uglify code
   - Generate source maps
   - Create assets in `dist/frontend`

2. **Build Verification**
   ```bash
   # Serve production build locally
   npm install -g serve
   serve -s dist/frontend
   ```

## Deployment Steps

1. **Server Setup**
   - Set up a web server (Nginx recommended)
   - Configure SSL certificates
   - Set up CDN (optional)

2. **Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       # SSL configuration
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       ssl_session_timeout 1d;
       ssl_protocols TLSv1.2 TLSv1.3;
       
       # Security headers
       add_header Strict-Transport-Security "max-age=63072000" always;
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.yourdomain.com wss://api.yourdomain.com;" always;

       # Root directory and index file
       root /var/www/banking-frontend;
       index index.html;

       # Gzip compression
       gzip on;
       gzip_vary on;
       gzip_min_length 10240;
       gzip_proxied expired no-cache no-store private auth;
       gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
       gzip_disable "MSIE [1-6]\.";

       # Cache control for static files
       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, no-transform";
       }

       # Main application routing
       location / {
           try_files $uri $uri/ /index.html;
           
           # Enable HTML5 history mode
           index index.html;
           
           # Disable caching for index.html
           add_header Cache-Control "no-store, no-cache, must-revalidate";
       }
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Deployment Script**
   Create a deployment script `deploy-frontend.sh`:
   ```bash
   #!/bin/bash
   
   # Build the application
   ng build --configuration=production
   
   # Create backup of current deployment
   ssh user@your-server "cd /var/www && tar -czf banking-frontend-backup-$(date +%Y%m%d_%H%M%S).tar.gz banking-frontend"
   
   # Upload new build
   scp -r dist/frontend/* user@your-server:/var/www/banking-frontend/
   
   # Clear server cache
   ssh user@your-server "sudo systemctl reload nginx"
   ```

## Monitoring and Maintenance

1. **Performance Monitoring**
   - Set up Application Performance Monitoring (APM)
   - Configure error tracking (e.g., Sentry)
   - Monitor browser console errors
   - Track user analytics

2. **Health Checks**
   - Monitor application loading time
   - Check for JavaScript errors
   - Verify API connectivity
   - Test critical user flows

3. **Update Procedure**
   ```bash
   # Pull latest changes
   git pull origin main

   # Install dependencies
   npm install

   # Run tests
   ng test --browsers=ChromeHeadless --watch=false

   # Build and deploy
   ./deploy-frontend.sh
   ```

## Rollback Procedure

1. **Quick Rollback**
   ```bash
   # SSH into server
   ssh user@your-server

   # Restore backup
   cd /var/www
   tar -xzf banking-frontend-backup-[timestamp].tar.gz
   
   # Reload nginx
   sudo systemctl reload nginx
   ```

2. **Version Control Rollback**
   ```bash
   # Reset to previous version
   git reset --hard [previous-commit]
   
   # Rebuild and deploy
   npm install
   ./deploy-frontend.sh
   ```

## Security Checklist

1. **Frontend Security**
   - Remove debug logs
   - Sanitize user inputs
   - Implement CSP headers
   - Enable subresource integrity
   - Use secure cookies
   - Implement rate limiting

2. **Access Control**
   - Verify authentication guards
   - Check role-based access
   - Validate route protections
   - Secure localStorage usage

3. **Error Handling**
   - Implement global error handler
   - Set up error logging
   - Handle API errors gracefully
   - Show user-friendly error messages

## CDN Setup (Optional)

1. **CDN Configuration**
   - Set up CDN provider (e.g., Cloudflare, AWS CloudFront)
   - Configure caching rules
   - Set up SSL/TLS
   - Configure DNS

2. **Asset Optimization**
   - Enable CDN caching
   - Configure cache headers
   - Set up image optimization
   - Enable HTTP/2 or HTTP/3

## Post-Deployment Verification

1. **Functional Testing**
   - Verify all critical user flows
   - Test authentication system
   - Check real-time features
   - Validate form submissions

2. **Performance Testing**
   - Run Lighthouse audits
   - Check page load times
   - Verify bundle sizes
   - Test on different devices

3. **Security Testing**
   - Verify SSL configuration
   - Check security headers
   - Test CORS settings
   - Validate CSP implementation