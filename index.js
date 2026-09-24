import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_TOKEN_HELPER = ["uvx", "alcf-ai", "auth", "get-access-token"];
const DEFAULT_TTL_MS = 60 * 1000;

/**
 * Injects a refreshed ALCF access token into every request sent to an ALCF
 * inference provider (`alcf-inference-service-*`).
 *
 * Options:
 *   tokenHelper: string[]  Command + args that print an access token on stdout.
 *   ttlMs: number          How long a fetched token is reused. Default: 60 s.
 */
const server = async (_input, options = {}) => {
  const tokenHelper =
    Array.isArray(options.tokenHelper) && options.tokenHelper.length > 0
      ? options.tokenHelper
      : DEFAULT_TOKEN_HELPER;
  const ttlMs =
    typeof options.ttlMs === "number" ? options.ttlMs : DEFAULT_TTL_MS;
  let cached = { token: "", expiresAt: 0 };

  return {
    "chat.headers": async (input, output) => {
      if (!input.model.providerID.startsWith("alcf-inference-service-")) return;
      if (!cached.token || Date.now() >= cached.expiresAt) {
        const { stdout } = await execFileAsync(
          tokenHelper[0],
          tokenHelper.slice(1),
          {
            encoding: "utf8",
          },
        );
        cached = { token: stdout.trim(), expiresAt: Date.now() + ttlMs };
      }
      output.headers.Authorization = `Bearer ${cached.token}`;
    },
  };
};

export default {
  id: "alcf-ai-opencode-plugin",
  server,
};
