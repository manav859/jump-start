import User from "../models/User.js";

const getAdminConfig = () => ({
  name: process.env.ADMIN_NAME || "Jumpstart Admin",
  email: (process.env.ADMIN_EMAIL || "admin@jumpstart.local")
    .toLowerCase()
    .trim(),
  password: process.env.ADMIN_PASSWORD || "Admin@12345",
});

export const ensureAdminAccount = async ({
  resetExistingPassword = false,
} = {}) => {
  const admin = getAdminConfig();

  let user = await User.findOne({ email: admin.email });
  if (!user) {
    user = new User({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      role: "admin",
      isSuspended: false,
    });

    await user.save();

    return {
      created: true,
      email: admin.email,
      role: user.role,
    };
  }

  let shouldSave = false;

  if (user.role !== "admin") {
    user.role = "admin";
    shouldSave = true;
  }

  if (user.isSuspended) {
    user.isSuspended = false;
    shouldSave = true;
  }

  if (!String(user.name || "").trim()) {
    user.name = admin.name;
    shouldSave = true;
  }

  if (resetExistingPassword) {
    user.name = admin.name;
    user.password = admin.password;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return {
    created: false,
    email: admin.email,
    role: user.role,
  };
};
