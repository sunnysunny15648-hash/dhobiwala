import { supabaseAdmin, supabaseAuth } from "../config/supabase.js";
import { ApiError, sendData } from "../utils/apiResponse.js";
import { Profile } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";

export async function register(req, res) {
  ensureMongo();
  if (!supabaseAuth)
    throw new ApiError(
      503,
      "Authentication is not configured. Add Supabase settings to the backend environment.",
    );
  const { full_name, email, phone, password } = req.validated.body;
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone } },
  });
  if (error) throw new ApiError(400, error.message);
  const profile = data.user
    ? await Profile.findByIdAndUpdate(
        data.user.id,
        {
          $setOnInsert: {
            full_name,
            email: email.toLowerCase(),
            phone,
            role: "customer",
          },
        },
        { upsert: true, new: true, runValidators: true },
      )
    : null;
  return sendData(
    res,
    {
      access_token: data.session?.access_token || null,
      refresh_token: data.session?.refresh_token || null,
      user: profile,
      email_confirmation_required: !data.session,
    },
    201,
  );
}

export async function login(req, res) {
  if (!supabaseAuth)
    throw new ApiError(
      503,
      "Authentication is not configured. Add Supabase settings to the backend environment.",
    );
  const { email, password } = req.validated.body;
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session)
    throw new ApiError(401, "Email or password is incorrect.");
  ensureMongo();
  const profile = await Profile.findById(data.user.id).lean();
  if (!profile)
    throw new ApiError(403, "Account profile is not ready. Contact support.");
  return sendData(res, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: { ...profile, id: profile._id },
  });
}

export async function refreshSession(req, res) {
  if (!supabaseAuth)
    throw new ApiError(503, "Authentication is not configured.");
  const refreshToken = req.body.refresh_token;
  if (typeof refreshToken !== "string" || refreshToken.length < 20) {
    throw new ApiError(400, "A valid refresh token is required.");
  }
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session)
    throw new ApiError(401, "Your session has expired. Sign in again.");
  return sendData(res, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  });
}

export async function requestPasswordReset(req, res) {
  if (!supabaseAuth)
    throw new ApiError(503, "Authentication is not configured.");
  const email = String(req.body.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ApiError(400, "Enter a valid email address.");
  }
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?reset=1`,
  });
  if (error) throw new ApiError(400, error.message);
  return sendData(res, {
    message: "If the email is registered, a password reset link is on its way.",
  });
}

export async function updatePassword(req, res) {
  if (!supabaseAdmin)
    throw new ApiError(503, "Supabase Auth admin key is not configured.");
  const password = req.body.password;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ApiError(400, "Password must be between 8 and 128 characters.");
  }
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    req.user.id,
    { password },
  );
  if (error || !data.user)
    throw new ApiError(400, error?.message || "Password could not be updated.");
  return sendData(res, { updated: true });
}

export async function logout(_req, res) {
  return sendData(res, {
    message: "Signed out. Remove the access token from the client.",
  });
}

export async function me(req, res) {
  return sendData(res, { user: req.user });
}
