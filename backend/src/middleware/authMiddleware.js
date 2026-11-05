import { supabaseAuth } from "../config/supabase.js";
import { Profile } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError } from "../utils/apiResponse.js";

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new ApiError(401, "Sign in to continue.");
    if (!supabaseAuth)
      throw new ApiError(
        503,
        "Supabase Auth is not configured. Add its URL and anon key to backend/.env.",
      );
    ensureMongo();
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);
    if (error || !user)
      throw new ApiError(401, "Your session is invalid or has expired.");
    const profile = await Profile.findById(user.id).lean();
    if (!profile)
      throw new ApiError(403, "Your account profile is not available.");
    req.user = {
      ...profile,
      id: profile._id,
      email: profile.email || user.email,
    };
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
