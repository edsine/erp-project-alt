module.exports = {
  apps: [
    {
      name: 'erp-backend',
      script: 'index.js',
      cwd: '/var/www/erp-project-alt/server_erp',
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_NAME: 'erp_db',
        DB_USER: 'erp_user',
        DB_PASSWORD: 'pGl@2026Root#7'
      }
    }
  ]
};
