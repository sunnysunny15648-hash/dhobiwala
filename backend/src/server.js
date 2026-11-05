import app from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

await connectMongo();
app.listen(env.PORT, () => {
  console.log(`Dhobi Wala API listening on port ${env.PORT}`);
  if (!env.MONGODB_URI)
    console.warn("MongoDB is not configured. Add MONGODB_URI to backend/.env.");
  if (!process.env.SUPABASE_ANON_KEY)
    console.warn(
      "Supabase Auth is not configured. Add its URL and anon key to backend/.env.",
    );
});
