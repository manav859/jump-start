const REQUIRED_ENV_VARS = ["MONGODB_URI", "JWT_SECRET"];

export function ensureRequiredEnv() {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (name) => !process.env[name] || !String(process.env[name]).trim()
  );

  if (missingVars.length === 0) {
    return;
  }

  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error(
    "Create backend/.env from backend/.env.example and update the values before starting the server."
  );
  process.exit(1);
}
