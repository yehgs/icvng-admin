// icvng-admin/src/utils/orderGroupTotals.js
//
// Single source of truth for the totals of a website-order group
// (one checkout = N order rows, one row per product).
//
// WHY THIS EXISTS
// The server stores `groupTotals` ONLY on the parent order. Child rows are
// saved with `groupTotals: {}`, and because the Mongoose schema declares
// defaults for that nested object, children come back as all-zeros — a
// truthy object, so `order.groupTotals || fallback` never falls back.
// Taking totals from "the first row encountered" (usually a child, since the
// list is sorted newest-first) therefore produced a Grand Total of 0 in the
// details modal and in the PDF invoice.

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const hasRealTotals = (t) => !!t && (num(t.grandTotal) > 0 || num(t.subTotal) > 0);

/**
 * @param {Object} group  { parentOrder, allOrders, summary? }
 * @returns {{subTotal, totalShipping, totalDiscount, totalTax, grandTotal, giftCardAmount}}
 */
export const resolveGroupTotals = (group) => {
  const orders = group?.allOrders || [];
  const parent =
    group?.parentOrder || orders.find((o) => o.isParentOrder) || orders[0];

  // 1) Preferred: totals recorded on the parent at checkout time.
  if (hasRealTotals(parent?.groupTotals)) {
    const t = parent.groupTotals;
    return {
      subTotal: num(t.subTotal),
      totalShipping: num(t.totalShipping),
      totalDiscount: num(t.totalDiscount),
      totalTax: num(t.totalTax),
      grandTotal: num(t.grandTotal),
      giftCardAmount: num(t.giftCardAmount),
    };
  }

  // 2) Fallback: derive from the individual order rows (each row's totalAmt
  //    already includes its share of shipping; the parent's is net of any
  //    gift card), so the sum equals what the customer actually paid.
  const sum = (fn) => orders.reduce((acc, o) => acc + num(fn(o)), 0);
  const subTotal = sum(
    (o) => o.subTotalAmt ?? num(o.unitPrice) * num(o.quantity || 1),
  );
  const totalShipping = sum((o) => o.shipping_cost);
  const totalDiscount = sum((o) => o.discount_amount);
  const totalTax = sum((o) => o.tax_amount);
  const grandTotal = sum((o) => o.totalAmt);

  return {
    subTotal,
    totalShipping,
    totalDiscount,
    totalTax,
    grandTotal: grandTotal || subTotal + totalShipping + totalTax - totalDiscount,
    giftCardAmount: num(parent?.giftCardRedemption?.amount),
  };
};
