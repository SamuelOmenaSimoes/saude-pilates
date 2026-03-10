import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifySession, clearSession, COOKIE_NAME } from "../session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get session token from cookie
    const token = opts.req.cookies[COOKIE_NAME];
    
    if (token) {
      // Verify JWT token
      const payload = verifySession(token);
      
      if (payload) {
        // Get user from database
        const { getUserById } = await import('../db');
        const dbUser = await getUserById(payload.userId);
        
        if (dbUser) {
          user = dbUser;
        } else {
          // User was deleted, clear cookie
          clearSession(opts.res, opts.req);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
