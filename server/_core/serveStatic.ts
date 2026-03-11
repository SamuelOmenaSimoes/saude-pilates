import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Production: use cwd-relative path so the path is correct when running from Docker (WORKDIR /app).
  // Relying on import.meta.dirname in the bundled server can be wrong depending on bundler/runtime.
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.join(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    const indexExists = fs.existsSync(path.join(distPath, "index.html"));
    console.log(`Serving static files from ${distPath} (index.html: ${indexExists})`);
  }

  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        // Prevent any reverse proxy (nginx, Cloudflare) from serving stale assets
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      },
    })
  );

  // SPA fallback: serve index.html for GET requests that didn't match a file
  app.get("*", (req, res, next) => {
    const index = path.resolve(distPath, "index.html");
    if (!fs.existsSync(index)) return next();
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(index);
  });
}
