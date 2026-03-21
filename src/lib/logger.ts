import fs from "fs";
import path from "path";
import os from "os";

/**
 * Writes a message to a persistent log file in the system's temp directory.
 * This is used for forensic tracing of checkout refreshes and gateway issues.
 */
export function writeToPersistentLog(message: string, type: "info" | "warn" | "error" = "info") {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    // Log to console for dev visibility
    if (type === "error") {
      console.error(`[PERSISTENT-LOG] ${message}`);
    } else {
      console.log(`[PERSISTENT-LOG] ${message}`);
    }

    // Write to a stable location in the temp dir
    const logPath = path.join(os.tmpdir(), "5ivearts-checkout-trace.log");
    fs.appendFileSync(logPath, logLine);
  } catch (err) {
    console.error("Failed to write to persistent log:", err);
  }
}
