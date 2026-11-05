import { connectMongo } from "../config/mongo.js";
import { ensureMongo } from "../config/mongo.js";
import { ClothingItem, Service } from "../models/index.js";

await connectMongo();
ensureMongo();
const services = [
  ["Washing", "A gentle everyday wash, sorted and folded with care.", 49, 24],
  ["Wash & Iron", "A fresh wash with a crisp, ready-to-wear finish.", 69, 36],
  ["Ironing Only", "A neat press for your weekly wardrobe.", 25, 12],
  [
    "Dry Cleaning",
    "Specialist care for delicate and structured pieces.",
    149,
    72,
  ],
  [
    "Premium Laundry",
    "Extra attention and a considered finish for your favourites.",
    99,
    48,
  ],
  [
    "Express Laundry",
    "A quicker turnaround when the week gets away from you.",
    129,
    12,
  ],
  ["Blanket Cleaning", "A thorough, careful clean for bulky bedding.", 199, 72],
  [
    "Shoe Cleaning",
    "A detailed refresh for the pairs that take you places.",
    249,
    48,
  ],
];
const clothing = [
  ["Shirt", "Everyday shirts and formalwear", 15],
  ["T-Shirt", "Cotton and casual tops", 12],
  ["Pant", "Trousers and office wear", 20],
  ["Jeans", "Denim and heavy trousers", 25],
  ["Saree", "Traditional and delicate drapes", 60],
  ["Bedsheet", "Single and double bedding", 40],
  ["Blanket", "Single and double blankets", 100],
  ["Kurta", "Kurtas and ethnic wear", 25],
];
for (const [name, description, price, estimated_hours] of services) {
  await Service.updateOne(
    { name },
    { $setOnInsert: { name, description, price, estimated_hours } },
    { upsert: true, runValidators: true },
  );
}
for (const [name, description, price] of clothing) {
  await ClothingItem.updateOne(
    { name },
    { $setOnInsert: { name, description, price } },
    { upsert: true, runValidators: true },
  );
}
console.log(
  `Seeded ${services.length} services and ${clothing.length} clothing items.`,
);
process.exit(0);
