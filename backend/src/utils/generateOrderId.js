import { randomInt } from "node:crypto";

export function generateOrderId() {
  const day = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `DW${day}${randomInt(100000, 999999)}`;
}
