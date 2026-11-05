import { ZodError } from "zod";

export function notFound(_req, res) {
  res.status(404).json({ success: false, message: "Route not found." });
}

export function errorHandler(error, _req, res, _next) {
  const status = Number(
    error.statusCode ||
      error.status ||
      (error instanceof ZodError ||
      error.name === "ValidationError" ||
      error.name === "CastError"
        ? 400
        : error.code === 11000
          ? 409
          : 500),
  );
  const message =
    error instanceof ZodError
      ? error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")
      : error.code === 11000
        ? "A record with that value already exists."
        : error.name === "ValidationError"
          ? error.message
          : error.name === "CastError"
            ? "A record identifier or field value is invalid."
            : error.expose
              ? error.message
              : status >= 500
                ? "Something went wrong. Please try again."
                : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message });
}
