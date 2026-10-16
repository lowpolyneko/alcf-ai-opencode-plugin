import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_TOKEN_HELPER = ["uvx", "alcf-ai", "auth", "get-access-token"];
const DEFAULT_TTL_MS = 60 * 1000;
const PROVIDER_PREFIX = "alcf-inference-service-";

/**
 * Builds a token getter that caches the helper's output.
 *
 * Options:
 *   tokenHelper: string[]  Command + args that print an access token on stdout.
 *   ttlMs: number         How long a fetched token is reused. Default: 60 s.
 */
const makeTokenProvider = (options = {}) => {
  const tokenHelper =
    Array.isArray(options.tokenHelper) && options.tokenHelper.length > 0
      ? options.tokenHelper
      : DEFAULT_TOKEN_HELPER;
  const ttlMs =
    typeof options.ttlMs === "number" ? options.ttlMs : DEFAULT_TTL_MS;
  let cached = { token: "", expiresAt: 0 };

  return async () => {
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
    return cached.token;
  };
};

/** V1 entrypoint: OpenCode 1 calls this and uses the returned hooks. */
const server = async (_input, options = {}) => {
  const token = makeTokenProvider(options);

  return {
    "chat.headers": async (input, output) => {
      if (!input.model.providerID.startsWith(PROVIDER_PREFIX)) return;
      output.headers.Authorization = `Bearer ${await token()}`;
    },
  };
};

/** V2 entrypoint: OpenCode 2 calls this with its plugin context. */
const setup = async (ctx) => {
  const token = makeTokenProvider(ctx.options ?? {});

  // The provider applies its apiKey after model.request, so the native HTTP
  // hook is the layer that can replace the Authorization header.
  await ctx.session.hook("http.request", async (event) => {
    if (!event.model.providerID.startsWith(PROVIDER_PREFIX)) return;
    event.request.headers.set("Authorization", `Bearer ${await token()}`);
  });
};

export default {
  id: "alcf-ai-opencode-plugin",
  setup,
  server,
};
