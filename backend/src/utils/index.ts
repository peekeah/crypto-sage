import Decimal from "decimal.js";
import { CONSTANTS } from "../constant";

export type Environment = {
  NODE_ENV: "development" | "production";
  API_PORT: string | number;
  SOLANA_RPC_URL: string;
  BINANCE_API_SECRET: string;
  BINANCE_API_KEY: string;
  BINANCE_FEE: string;
  RAYDIUM_FEE: string;
  SLIPPAGE: string;
  SOLANA_TX_COST: string;
  BINANCE_TX_COST: string;
};

export const getEnv = <K extends keyof Environment>(key: K, fallback?: Environment[K]): Environment[K] => {
  const value = process.env[key] as Environment[K] | undefined;

  if (!value && !fallback) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value || fallback!;
};

export function formatNumber(num: number, decimals: number = 2): string {
  return new Decimal(num).toFixed(decimals);
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = CONSTANTS.API_RETRY_ATTEMPTS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, CONSTANTS.API_RETRY_DELAY));
    return retry(fn, attempts - 1);
  }
}
