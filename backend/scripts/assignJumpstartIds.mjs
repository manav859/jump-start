// One-off migration: backfill jumpstartId on legacy users.
//
// Safe to re-run. Only touches users where jumpstartId is null/empty.
// The pre-save hook in User.js handles new signups going forward, so
// this script exists for the population of users created before the
// field was added.
//
// Run with:  npm run migrate:jumpstart-ids

import "dotenv/config";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import User from "../models/User.js";

const formatYear = (date) => new Date(date).getFullYear();

const run = async () => {
  ensureRequiredEnv();
  await mongoose.connect(process.env.MONGODB_URI);

  // Find users without a jumpstartId. Sorted by createdAt ascending so
  // the assigned IDs follow the order users joined the platform.
  const targets = await User.find({
    $or: [
      { jumpstartId: { $exists: false } },
      { jumpstartId: null },
      { jumpstartId: "" },
    ],
  })
    .sort({ createdAt: 1 })
    .select("_id name email createdAt jumpstartId");

  const totalUsers = await User.countDocuments();
  let nextCounter = totalUsers - targets.length + 1;

  console.log(
    `Found ${targets.length} user(s) without a jumpstartId. ` +
      `Existing users with one: ${totalUsers - targets.length}.`
  );

  const assignments = [];
  for (const user of targets) {
    const year = formatYear(user.createdAt || new Date());
    let attempt = 0;
    let assigned = false;
    while (attempt < 3 && !assigned) {
      const candidate = `JS-${year}-${String(nextCounter).padStart(5, "0")}`;
      nextCounter += 1;
      const clash = await User.exists({ jumpstartId: candidate });
      if (clash) {
        attempt += 1;
        continue;
      }
      user.jumpstartId = candidate;
      try {
        await user.save();
        assigned = true;
        assignments.push({
          email: user.email,
          jumpstartId: candidate,
        });
      } catch (err) {
        // Re-loop once on duplicate-key race (vanishingly unlikely in
        // a migration but cheap to guard).
        if (err?.code === 11000) {
          attempt += 1;
          continue;
        }
        throw err;
      }
    }
    if (!assigned) {
      console.error(
        `[WARN] Could not assign a Jumpstart ID for user ${user.email} ` +
          `after 3 attempts. Skipping.`
      );
    }
  }

  console.log(`\nAssigned ${assignments.length} new Jumpstart ID(s):`);
  assignments.slice(0, 20).forEach((row) => {
    console.log(`  ${row.jumpstartId}  ${row.email}`);
  });
  if (assignments.length > 20) {
    console.log(`  …and ${assignments.length - 20} more`);
  }
};

run()
  .catch((err) => {
    console.error(err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
