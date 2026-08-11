// PM2 alternative to deploy/systemd/jumpstart-api.service.
//
// Use ONE of the two. Running both means two supervisors racing for
// port 5000, and the loser crash-loops.
//
//   npm i -g pm2
//   pm2 start deploy/pm2/ecosystem.config.cjs --env production
//   pm2 save && pm2 startup    # <- the second command is what survives reboot
//
// .cjs because backend/package.json sets "type": "module" and PM2 loads
// this file with require().

module.exports = {
  apps: [
    {
      name: "jumpstart-api",
      cwd: "/var/www/jumpstart/backend",
      script: "server.js",

      // `cluster` + instances forks one worker per core behind PM2's
      // built-in load balancer. The API is stateless (JWT auth, no
      // in-process sessions), so this is safe and roughly multiplies
      // throughput under concurrent test submissions.
      //
      // Drop to instances: 1 / exec_mode: "fork" on a 1-vCPU box, where
      // extra workers only add memory pressure and context switching.
      exec_mode: "cluster",
      instances: "max",

      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // Restart on crash, with backoff, and give up if it is a crash
      // loop rather than hammering Mongo with reconnects.
      autorestart: true,
      exp_backoff_restart_delay: 200,
      max_restarts: 10,
      min_uptime: "20s",

      // The PDF/report paths can hold large buffers; restart a worker
      // that grows past this rather than letting the box swap.
      max_memory_restart: "512M",

      // Drain in-flight requests on reload instead of cutting them off.
      kill_timeout: 20000,
      wait_ready: false,
      listen_timeout: 10000,

      merge_logs: true,
      time: true,
    },
  ],
};
