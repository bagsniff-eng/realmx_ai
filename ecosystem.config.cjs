module.exports = {
  apps: [{
    name: "realmxai-node-dashboard",
    script: "./src/server/index.ts",
    interpreter: "node",
    interpreter_args: "--import tsx",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
