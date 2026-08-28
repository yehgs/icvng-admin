// admin/src/config/manualOrderRules.js
//
// The canonical §3 purchasability rule (PRODUCT_VISIBILITY_RULES.md) as the
// ADMIN manual-order flow needs it. Mirrors
// icvng-server/utils/manualOrderValidation.js exactly — if you change one,
// change both, and update the rules doc's §7 implementation list.
//
// WHY THIS REPLACED THE INLINE CHECK IN ProductSearchModal.jsx
// ────────────────────────────────────────────────────────────
// That modal carried its own hand-rolled copy of the rule — precisely what
// §7 of the rules doc tells you never to do — and it had drifted in two
// ways that mattered:
//
//   1. It read stock as `warehouseStock.onlineStock || stock` and ignored
//      `partnerStock` completely. Partner-supplied stock therefore showed as
//      zero, so a sales agent was blocked from manually selling products the
//      storefront was actively selling.
//
//   2. Its "has dropship prices" test accepted EITHER delivery price for ANY
//      product, ignoring the five-week-type distinction. A MACHINE priced
//      only on price3weeksDelivery looked addable here while the storefront
//      correctly refused to sell it — so an agent could take an order the
//      site itself would not have accepted.
//
// BTB is gone: manual orders are BTC-only as of 2026-08-28.

import { isFiveWeekDeliveryCategory } from "./deliveryCategories.js";

/**
 * Effective online stock, in the priority order the product schema's own
 * `effectiveOnlineStock` virtual uses:
 *   partnerStock (if enabled) → warehouseStock.onlineStock → legacy `stock`
 */
export function getEffectiveOnlineStock(product) {
  if (product?.partnerStock?.enabled) return product.partnerStock.quantity || 0;
  if (product?.warehouseStock?.enabled) {
    return product.warehouseStock.onlineStock || 0;
  }
  return product?.stock || 0;
}

/** First category slug we can find, for the five-week-type signal. */
function firstCategorySlug(product) {
  const cats = product?.category || [];
  for (const c of cats) {
    if (typeof c === "object" && c?.slug) return c.slug;
  }
  return null;
}

export function isFiveWeekType(product) {
  return isFiveWeekDeliveryCategory(
    product?.productType,
    firstCategorySlug(product),
  );
}

/**
 * §3 — canonical purchasability for a BTC manual order line.
 *
 *   (a) five-week type → price5weeksDelivery > 0
 *       otherwise      → price3weeksDelivery > 0
 *   (b) btcPrice > 0 AND effective online stock > 0
 *   purchasable = (a) OR (b)
 *
 * @returns {{valid: boolean, reason: string|null, availableStock: number,
 *            viaStock: boolean, viaDelivery: boolean, fiveWeek: boolean}}
 */
export function evaluateProductForManualOrder(product) {
  const fiveWeek = isFiveWeekType(product);

  const deliveryPrice = fiveWeek
    ? product?.price5weeksDelivery
    : product?.price3weeksDelivery;
  const viaDelivery = Number(deliveryPrice) > 0;

  const availableStock = getEffectiveOnlineStock(product);
  const viaStock = Number(product?.btcPrice) > 0 && availableStock > 0;

  const valid = viaDelivery || viaStock;

  let reason = null;
  if (product?.productAvailability === false) {
    return {
      valid: false,
      reason: "Marked not available for sale",
      availableStock,
      viaStock,
      viaDelivery,
      fiveWeek,
    };
  }
  if (!valid) {
    if (!(Number(product?.btcPrice) > 0) && !viaDelivery) {
      reason = "No BTC price and no delivery price";
    } else if (availableStock === 0) {
      reason = fiveWeek
        ? "No stock, and no 5-week delivery price"
        : "No stock, and no 2-week delivery price";
    } else {
      reason = "Not purchasable";
    }
  }

  return { valid, reason, availableStock, viaStock, viaDelivery, fiveWeek };
}

/**
 * BTC price options addable for this product. Never includes a BTB price —
 * that path is retired. The five-week/two-week option is offered according
 * to product type, not both indiscriminately.
 */
export function getBtcPriceOptions(product) {
  const options = [];
  const { fiveWeek, availableStock } = evaluateProductForManualOrder(product);

  if (Number(product?.btcPrice) > 0 && availableStock > 0) {
    options.push({
      key: "regular",
      price: product.btcPrice,
      labelKey: "manualOrders.priceOptions.regular",
      consumesStock: true,
    });
  }
  if (fiveWeek) {
    if (Number(product?.price5weeksDelivery) > 0) {
      options.push({
        key: "5weeks",
        price: product.price5weeksDelivery,
        labelKey: "manualOrders.priceOptions.fiveWeeks",
        consumesStock: false,
      });
    }
  } else if (Number(product?.price3weeksDelivery) > 0) {
    options.push({
      key: "3weeks",
      price: product.price3weeksDelivery,
      labelKey: "manualOrders.priceOptions.twoWeeks",
      consumesStock: false,
    });
  }
  return options;
}

/** Special-order lines are supplier-sourced and hold no local stock. */
export function priceOptionConsumesStock(priceOption) {
  return !["3weeks", "2weeks", "5weeks"].includes(priceOption);
}
