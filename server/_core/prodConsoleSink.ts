/**
 * Production: duplicate console output to a file (default: OS temp dir) so logs are
 * visible when stdout is not attached (Docker without logging driver, PM2 file, etc.).
 *
 * Env:
 * - SERVER_LOG_TO_FILE=false — disable
 * - SERVER_LOG_FILE=/path/to/app.log — override path (default: tmpdir/saude-pilates-server.log)
 *
 * Prefer long-term: aggregate stdout (docker logs, journald, CloudWatch) or use pino/winston.
 */
import fs from "fs";
import os from "os";
import path from "path";
import util from "util";

function formatArgs(args: unknown[]): string {
  return args
    .map((a) =>
      typeof a === "string" ? a : util.inspect(a, { depth: 6, breakLength: 120, colors: false }),
    )
    .join(" ");
}

function install(): void {
  const off = process.env.SERVER_LOG_TO_FILE === "0" || process.env.SERVER_LOG_TO_FILE === "false";
  if (off) return;

  const filePath =
    process.env.SERVER_LOG_FILE && process.env.SERVER_LOG_FILE.length > 0
      ? process.env.SERVER_LOG_FILE
      : path.join(os.tmpdir(), "saude-pilates-server.log");

  const stream = fs.createWriteStream(filePath, { flags: "a" });
  stream.on("error", () => {
    /* avoid crashing the process if disk is full / permission denied */
  });

  const write = (level: string, args: unknown[]) => {
    const line = `${new Date().toISOString()} [${level}] ${formatArgs(args)}\n`;
    stream.write(line);
  };

  const orig = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  console.log = (...args: unknown[]) => {
    write("log", args);
    orig.log(...args);
  };
  console.info = (...args: unknown[]) => {
    write("info", args);
    orig.info(...args);
  };
  console.warn = (...args: unknown[]) => {
    write("warn", args);
    orig.warn(...args);
  };
  console.error = (...args: unknown[]) => {
    write("error", args);
    orig.error(...args);
  };
  console.debug = (...args: unknown[]) => {
    write("debug", args);
    orig.debug(...args);
  };

  orig.log(`[server] Also writing logs to ${filePath}`);
}

install();
