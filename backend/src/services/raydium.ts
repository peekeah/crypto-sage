import axios from 'axios';
import { CONFIG } from '../config';

class Raydium {

  private RAYDIUM_API_URL = CONFIG.RAYDIUM.API_URI;

  /**
   * Fetches USDC trading pair prices for tokens on Solana using the Raydium API.
   * @returns A dictionary of token symbols and their prices in USDC.
   */
  async fetchRhydiumPrices(): Promise<{ [symbol: string]: number }> {
    // Fetch token list dynamically from Raydium
    const tokenList = await this.fetchTokenList();
    const prices: { [symbol: string]: number } = {};

    const priceRequests = tokenList
      .flatMap(token => {
        token?.symbol === "USDC" ? [] :
          axios.get(`${this.RAYDIUM_API_URL}/mint/price?mints=${token.mint}`)
            .then(res => {
              const priceData = res.data.data;
              if (priceData[token.mint]) {
                prices[token.symbol] = priceData[token.mint];
              }
            })
      });

    // Wait for all the requests to complete
    await Promise.all(priceRequests);

    return prices;
  }

  /**
   * Fetches the token list from Raydium's API.
   * @returns Array of token metadata, including mint addresses and symbols.
   */
  private async fetchTokenList(): Promise<{ symbol: string; mint: string }[]> {
    try {
      const response = await axios.get(`${this.RAYDIUM_API_URL}/mint/list`);
      const tokenList = response.data.data.mintList;
      // Map and return the necessary fields: symbol and mint
      return tokenList.map((token: any) => {
        return ({
          symbol: token.symbol,
          mint: token.address,
        })
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching token list from Raydium:', error?.message);
      } else {
        console.error('unknown error while fetching token list from Raydium', error);
      }
      throw new Error('Failed to fetch token list from Raydium.');
    }
  }
}

export default Raydium;
