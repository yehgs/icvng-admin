import axios from 'axios';

export class CurrencyConverter {
  static async getExchangeRates() {
    try {
      // Using exchangerate-api.com (free tier)
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      return response.data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates
      return {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        NGN: 1500,
        CNY: 7.2,
      };
    }
  }

  static async convertCurrency(amount, fromCurrency, toCurrency = 'NGN') {
    try {
      const rates = await this.getExchangeRates();

      if (fromCurrency === 'USD') {
        return amount * (rates[toCurrency] || 1);
      } else {
        // Convert to USD first, then to target currency
        const usdAmount = amount / (rates[fromCurrency] || 1);
        return usdAmount * (rates[toCurrency] || 1);
      }
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount if conversion fails
    }
  }
}
