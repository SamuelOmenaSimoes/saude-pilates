import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    console.log(`Serving static files from ${distPath}`);
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for GET requests that didn't match a file
  app.get("*", (req, res, next) => {
    const index = path.resolve(distPath, "index.html");
    if (!fs.existsSync(index)) return next();
    res.sendFile(index);
  });
}
