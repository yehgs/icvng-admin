// admin/src/config/deliveryCategories.js
//
// Thin re-export shim — the rule now lives in @yehgs/icvng-core (shared
// with client and the mobile app). This file used to be a hand-maintained
// copy that had already drifted in comments from client's version; both
// now point at the one canonical implementation.
//
// NOTE: core's isFiveWeekDeliveryCategory accepts a plain slug string OR a
// category object/array-with-slug — both call sites in this app
// (ProductForm.jsx, manualOrderRules.js) already pass a plain slug string,
// which core handles explicitly (added specifically so this swap wouldn't
// silently regress to productType-only detection — see core's own comment
// in src/pricing/deliveryCategories.js for why that matters here).
export {
  FIVE_WEEK_DELIVERY_SLUGS,
  isFiveWeekDeliveryCategory,
} from "@yehgs/icvng-core/pricing";
