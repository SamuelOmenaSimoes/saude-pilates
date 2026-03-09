/**
 * Load .env before any other app code. Must be the first import in the entry point,
 * because in ESM all imports run before the rest of the module (so dotenv.config()
 * in index.ts would run after routers/sdk were already loaded).
 */
import dotenv from "dotenv";
dotenv.config();
