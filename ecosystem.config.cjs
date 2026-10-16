module.exports = {
  apps: [
    {
      name: 'oracle-coupons-agent',
      script: './scripts/process_oracle_coupons.mjs',
      args: '--watch',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
