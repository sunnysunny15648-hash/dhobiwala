export function calculatePrice(items, catalogItems) {
  const byId = new Map(catalogItems.map((item) => [item.id, item]));
  return items.reduce((total, entry) => {
    const catalogItem = byId.get(entry.clothing_item_id);
    if (!catalogItem || !catalogItem.is_active)
      throw new Error("One or more selected clothing items are unavailable.");
    return total + Number(catalogItem.price) * entry.quantity;
  }, 0);
}
