import { connectMongo } from "../config/mongo.js";
import { Profile } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error(
    "Usage: npm --workspace backend run promote-admin -- user@example.com",
  );
  process.exit(1);
}
await connectMongo();
ensureMongo();
const profile = await Profile.findOneAndUpdate(
  { email },
  { $set: { role: "admin" } },
  { new: true, runValidators: true },
);
if (!profile) {
  console.error(
    "No profile found. Register and confirm this user before promotion.",
  );
  process.exit(1);
}
console.log(`Promoted ${profile.email} to admin.`);
process.exit(0);
