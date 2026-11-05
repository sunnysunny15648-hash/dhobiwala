import { Address, Profile } from "../models/index.js";
import { ApiError, sendData } from "../utils/apiResponse.js";
import { ensureMongo } from "../config/mongo.js";

export async function getProfile(req, res) {
  ensureMongo();
  const profile = await Profile.findById(req.user.id).lean();
  if (!profile) throw new ApiError(404, "Profile not found.");
  return sendData(res, { profile: { ...profile, id: profile._id } });
}
export async function updateProfile(req, res) {
  const payload = {};
  if (typeof req.body.full_name === "string")
    payload.full_name = req.body.full_name.trim();
  if (typeof req.body.phone === "string") payload.phone = req.body.phone.trim();
  if (
    !Object.keys(payload).length ||
    (payload.full_name && payload.full_name.length < 2) ||
    (payload.phone && payload.phone.length > 18)
  )
    throw new ApiError(400, "Provide a valid name or phone number.");
  ensureMongo();
  const profile = await Profile.findByIdAndUpdate(
    req.user.id,
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();
  if (!profile) throw new ApiError(404, "Profile not found.");
  return sendData(res, { profile: { ...profile, id: profile._id } });
}
export async function getAddresses(req, res) {
  ensureMongo();
  const addresses = await Address.find({ user_id: req.user.id })
    .sort({ is_default: -1, createdAt: -1 })
    .lean();
  return sendData(res, { addresses });
}
export async function addAddress(req, res) {
  ensureMongo();
  const payload = addressPayload(req.body);
  payload.user_id = req.user.id;
  if (payload.is_default)
    await Address.updateMany(
      { user_id: req.user.id },
      { $set: { is_default: false } },
    );
  else if (!(await Address.exists({ user_id: req.user.id })))
    payload.is_default = true;
  const address = await Address.create(payload);
  return sendData(res, { address }, 201);
}
export async function updateAddress(req, res) {
  ensureMongo();
  const payload = addressPayload(req.body, true);
  if (payload.is_default)
    await Address.updateMany(
      { user_id: req.user.id },
      { $set: { is_default: false } },
    );
  const address = await Address.findOneAndUpdate(
    { _id: req.params.addressId, user_id: req.user.id },
    { $set: payload },
    { new: true, runValidators: true },
  );
  if (!address) throw new ApiError(404, "Address not found.");
  return sendData(res, { address });
}
export async function deleteAddress(req, res) {
  ensureMongo();
  const address = await Address.findOneAndDelete({
    _id: req.params.addressId,
    user_id: req.user.id,
  });
  if (!address) throw new ApiError(404, "Address not found.");
  if (address.is_default) {
    const next = await Address.findOne({ user_id: req.user.id }).sort({
      createdAt: 1,
    });
    if (next) {
      next.is_default = true;
      await next.save();
    }
  }
  return sendData(res, { deleted: true });
}
function addressPayload(body, partial = false) {
  const payload = {};
  for (const key of [
    "address_line",
    "city",
    "state",
    "pincode",
    "landmark",
    "phone",
  ]) {
    if (key in body) {
      if (typeof body[key] !== "string" || body[key].trim().length > 180)
        throw new ApiError(400, `Invalid ${key}.`);
      payload[key] = body[key].trim();
    }
  }
  for (const key of ["address_line", "city", "pincode"])
    if (!partial && !payload[key])
      throw new ApiError(400, `${key} is required.`);
  if (payload.pincode && !/^\d{6}$/.test(payload.pincode))
    throw new ApiError(400, "Pincode must contain 6 digits.");
  if ("is_default" in body) {
    if (typeof body.is_default !== "boolean")
      throw new ApiError(400, "is_default must be boolean.");
    payload.is_default = body.is_default;
  }
  return payload;
}
