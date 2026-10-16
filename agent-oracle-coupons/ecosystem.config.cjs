module.exports = {
  apps: [
    {
      name: 'agent-oracle-coupons',
      script: 'agent.mjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      min_uptime: '10s',
      max_restarts: 10,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://zfbrwcflzbauycszajpc.supabase.co'
      }
    }
  ]
};
