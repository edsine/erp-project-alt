#!/bin/bash
cd /var/www/erp-project-alt
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
echo "✅ Deployed at $(date)"

