module.exports = {
  apps: [
    {
      name: 'agent-oracle-coupons',
      script: './agent.mjs',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
