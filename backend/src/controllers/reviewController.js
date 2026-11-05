import { Order, Profile, Review } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

export async function getReviews(_req, res) {
  ensureMongo();
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
  const populated = await Promise.all(
    reviews.map(async (review) => ({
      ...review,
      profile: await Profile.findById(review.customer_id)
        .select("full_name")
        .lean(),
    })),
  );
  return sendData(res, { reviews: populated });
}
export async function createReview(req, res) {
  ensureMongo();
  const { order_id, rating, comment = "" } = req.body;
  if (
    typeof order_id !== "string" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== "string" ||
    comment.length > 1000
  )
    throw new ApiError(
      400,
      "Provide an order, a rating from 1 to 5, and a comment under 1000 characters.",
    );
  const order = await Order.findOne({
    _id: order_id,
    customer_id: req.user.id,
    order_status: "delivered",
  });
  if (!order)
    throw new ApiError(409, "Only your delivered orders can be reviewed.");
  const review = await Review.create({
    order_id,
    customer_id: req.user.id,
    rating,
    comment: comment.trim(),
  });
  return sendData(res, { review }, 201);
}
