// admin/src/config/deliveryCategories.js
//
// MUST stay in sync with icvng-client/src/config/deliveryCategories.js and
// icvng-server/controllers/product.controller.js (FIVE_WEEK_DELIVERY_SLUGS
// / buildPurchasableOr).
//
// Controls which products the storefront reads a 5-week delivery price for
// vs a 2-week ("3-week" in the DB/admin — same field, price3weeksDelivery)
// delivery price. A product counts as "five-week type" if EITHER:
//   - productType === "MACHINE", OR
//   - its category slug is one of FIVE_WEEK_DELIVERY_SLUGS
//
// Both signals are checked (not just productType alone) because productType
// data isn't fully reliable on its own — e.g. a Tassimo coffee machine
// filed under category "Coffee Maker" but left with productType "COFFEE".
// Trusting productType alone let that exact product pass this admin form's
// warning check (looked fine — "has a delivery price") while the actual
// storefront (which also checks category) correctly refused to show it.
//
// This file exists so the admin Product Form's live "will be hidden from
// the shop" warning can catch that exact mismatch before you even save.

export const FIVE_WEEK_DELIVERY_SLUGS = ["capsule-machine", "coffee-maker"];

/**
 * Returns true if the product should be priced via the 5-week delivery
 * field instead of the 2-week ("3-week") delivery field.
 *
 * @param {string|null|undefined} productType e.g. "MACHINE", "COFFEE", ...
 * @param {string|null|undefined} [categorySlug] the selected category's slug
 * @returns {boolean}
 */
export const isFiveWeekDeliveryCategory = (productType, categorySlug = null) =>
  productType === "MACHINE" ||
  (!!categorySlug && FIVE_WEEK_DELIVERY_SLUGS.includes(categorySlug));
