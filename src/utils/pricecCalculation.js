export class PricingCalculations {
  static calculateSubPrice(unitCost, freightCost, overheadPercentage) {
    const totalCost = unitCost + freightCost;
    const overhead = totalCost * (overheadPercentage / 100);
    return totalCost + overhead;
  }

  static calculateFinalPrice(subPrice, profitMargin) {
    return subPrice + subPrice * (profitMargin / 100);
  }

  static calculateAllPrices(subPrice, profitMargins) {
    return {
      price: subPrice,
      salePrice: this.calculateFinalPrice(subPrice, profitMargins.salePrice),
      btbPrice: this.calculateFinalPrice(subPrice, profitMargins.btbPrice),
      btcPrice: this.calculateFinalPrice(subPrice, profitMargins.btcPrice),
      price3weeksDelivery: this.calculateFinalPrice(
        subPrice,
        profitMargins.price3weeksDelivery
      ),
      price5weeksDelivery: this.calculateFinalPrice(
        subPrice,
        profitMargins.price5weeksDelivery
      ),
    };
  }

  static calculateFreightPerUnit(totalFreight, totalQuantity) {
    return totalQuantity > 0 ? totalFreight / totalQuantity : 0;
  }
}
