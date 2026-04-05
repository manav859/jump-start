import "dotenv/config";
import mongoose from "mongoose";
import { ensureAdminAccount } from "../utils/adminBootstrap.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await ensureAdminAccount({ resetExistingPassword: true });

  console.log(
    JSON.stringify(
      {
        success: true,
        email: process.env.ADMIN_EMAIL || "admin@jumpstart.local",
        password: process.env.ADMIN_PASSWORD || "Admin@12345",
        role: result.role,
        created: result.created,
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
