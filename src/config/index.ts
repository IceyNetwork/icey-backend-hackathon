export const CONFIG = {
  SERVER: {
    PORT: Number(process.env.PORT) || 3000,
    HOST: process.env.HOST || "0.0.0.0",
    NODE_ENV: process.env.NODE_ENV || "development",
  },
  DATABASE: {
    DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/icey",
    DATABASE_NAME: process.env.DATABASE_NAME || "icey",
  },
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  },
  SOLANA: {
    MINT: process.env.MINT || "",
    TREASURY: process.env.TREASURY || "",
    PRIVATE_KEY: process.env.PRIVATE_KEY || "",
    RPC_URL: process.env.RPC_URL || "",
    MINT_DECIMALS: Number(process.env.MINT_DECIMALS) || 6,
  },
};

export default CONFIG;
export const { SERVER, DATABASE, AUTH, SOLANA } = CONFIG;
export const { PORT, HOST } = SERVER;
export const { DATABASE_URL, DATABASE_NAME } = DATABASE;
export const { RPC_URL, PRIVATE_KEY, MINT, TREASURY } = SOLANA;
