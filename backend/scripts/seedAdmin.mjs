import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const adminName = process.env.ADMIN_NAME || "Jumpstart Admin";
const adminEmail = (process.env.ADMIN_EMAIL || "admin@jumpstart.local").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email: adminEmail });

  if (!user) {
    user = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isSuspended: false,
    });
  } else {
    user.name = adminName;
    user.role = "admin";
    user.isSuspended = false;
    user.password = adminPassword;
  }

  await user.save();

  console.log(
    JSON.stringify(
      {
        success: true,
        email: adminEmail,
        password: adminPassword,
        role: user.role,
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
