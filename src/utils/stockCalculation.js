export class StockCalculations {
  static calculateTotalSalableStock(stock) {
    return stock.processing?.quantitySalable || 0;
  }

  static calculateTotalDistributedStock(stock) {
    return (
      (stock.distribution?.onlineStock || 0) +
      (stock.distribution?.offlineStock || 0)
    );
  }

  static calculateStockValue(stock, productPrice) {
    const totalStock = this.calculateTotalDistributedStock(stock);
    return totalStock * (productPrice || 0);
  }

  static isLowStock(stock) {
    const totalSalable = this.calculateTotalSalableStock(stock);
    const minimumStock = stock.minimumStock || 0;
    return totalSalable <= minimumStock && totalSalable > 0;
  }

  static isOutOfStock(stock) {
    return this.calculateTotalSalableStock(stock) === 0;
  }
}
