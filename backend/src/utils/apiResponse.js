export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.expose = statusCode < 500 || statusCode === 503;
  }
}

export function sendData(res, data, status = 200) {
  return res.status(status).json({ success: true, data: serialize(data) });
}

function serialize(value) {
  if (Array.isArray(value)) return value.map(serialize);
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toJSON === "function" && !value._bsontype)
    return serialize(value.toJSON());
  if (value._bsontype === "ObjectId" || value.constructor?.name === "ObjectId")
    return value.toString();
  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "_id") output.id = String(nested);
    else if (key === "__v") continue;
    else if (key === "createdAt") output.created_at = serialize(nested);
    else if (key === "updatedAt") output.updated_at = serialize(nested);
    else output[key] = serialize(nested);
  }
  return output;
}

export function unwrap(result) {
  if (result.error) throw new ApiError(400, result.error.message);
  return result.data;
}
