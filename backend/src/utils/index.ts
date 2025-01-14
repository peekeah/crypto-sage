import Decimal from "decimal.js";

export type Environment = {
  NODE_ENV: "development" | "production";
  API_PORT: string | number;
  RAYDIUM_API: string;
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

