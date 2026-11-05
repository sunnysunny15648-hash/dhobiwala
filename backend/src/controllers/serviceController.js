import { ClothingItem, Service } from "../models/index.js";
import { ApiError, sendData } from "../utils/apiResponse.js";
import { ensureMongo } from "../config/mongo.js";
export async function getServices(_req, res) {
  ensureMongo();
  const data = await Service.find({ is_active: true }).sort({ name: 1 }).lean();
  return sendData(res, { services: data });
}
export async function getService(req, res) {
  ensureMongo();
  const data = await Service.findOne({
    _id: req.params.serviceId,
    is_active: true,
  }).lean();
  if (!data) throw new ApiError(404, "Service not found.");
  return sendData(res, { service: data });
}
export async function getClothingItems(_req, res) {
  ensureMongo();
  const data = await ClothingItem.find({ is_active: true })
    .sort({ name: 1 })
    .lean();
  return sendData(res, { items: data });
}
export async function updateClothingItem(req, res) {
  const payload = {};
  if (typeof req.body.name === "string") payload.name = req.body.name.trim();
  if (typeof req.body.description === "string")
    payload.description = req.body.description.trim();
  if ("price" in req.body) {
    if (!Number.isFinite(req.body.price) || req.body.price < 0)
      throw new ApiError(400, "Price must be a non-negative number.");
    payload.price = req.body.price;
  }
  if ("is_active" in req.body) {
    if (typeof req.body.is_active !== "boolean")
      throw new ApiError(400, "is_active must be boolean.");
    payload.is_active = req.body.is_active;
  }
  if (!Object.keys(payload).length)
    throw new ApiError(400, "Provide a clothing item field to update.");
  ensureMongo();
  const item = await ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $set: payload },
    { new: true, runValidators: true },
  );
  if (!item) throw new ApiError(404, "Clothing item not found.");
  return sendData(res, { item });
}
export async function createService(req, res) {
  const payload = validateService(req.body, true);
  ensureMongo();
  const data = await Service.create(payload);
  return sendData(res, { service: data }, 201);
}
export async function updateService(req, res) {
  const payload = validateService(req.body, false);
  if (!Object.keys(payload).length)
    throw new ApiError(400, "Provide at least one service field to update.");
  ensureMongo();
  const data = await Service.findByIdAndUpdate(
    req.params.serviceId,
    { $set: payload },
    { new: true, runValidators: true },
  );
  if (!data) throw new ApiError(404, "Service not found.");
  return sendData(res, { service: data });
}
export async function deleteService(req, res) {
  ensureMongo();
  const data = await Service.findByIdAndUpdate(
    req.params.serviceId,
    { $set: { is_active: false } },
    { new: true },
  ).select("_id");
  if (!data) throw new ApiError(404, "Service not found.");
  return sendData(res, { service: data });
}
function validateService(body, required) {
  const payload = {};
  if (
    required &&
    (typeof body.name !== "string" || typeof body.price === "undefined")
  )
    throw new ApiError(400, "Name and price are required.");
  for (const key of ["name", "description", "image_url"])
    if (key in body) {
      if (
        typeof body[key] !== "string" ||
        body[key].length > (key === "description" ? 1000 : 240)
      )
        throw new ApiError(400, `Invalid ${key}.`);
      payload[key] = body[key].trim();
    }
  if ("price" in body) {
    if (!Number.isFinite(body.price) || body.price < 0)
      throw new ApiError(400, "Price must be a non-negative number.");
    payload.price = body.price;
  }
  if ("estimated_hours" in body) {
    if (
      !Number.isInteger(body.estimated_hours) ||
      body.estimated_hours < 1 ||
      body.estimated_hours > 720
    )
      throw new ApiError(400, "Estimated hours must be between 1 and 720.");
    payload.estimated_hours = body.estimated_hours;
  }
  if ("is_active" in body) {
    if (typeof body.is_active !== "boolean")
      throw new ApiError(400, "is_active must be boolean.");
    payload.is_active = body.is_active;
  }
  return payload;
}
