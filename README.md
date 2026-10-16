# alcf-ai-opencode-plugin

[opencode](https://opencode.ai) plugin that refreshes an ALCF AI access token
and injects it into requests sent to ALCF inference providers
(`alcf-inference-service-*`).

`alcf-ai agent configure opencode` registers this plugin for you.

OpenCode 2 (native `plugins` array):

```json
{
  "plugins": [
    {
      "package": "alcf-ai-opencode-plugin",
      "options": { "tokenHelper": ["alcf-ai", "auth", "get-access-token"] }
    }
  ]
}
```

OpenCode 1 (`plugin` array with a package-and-options tuple):

```json
{
  "plugin": [
    [
      "alcf-ai-opencode-plugin",
      { "tokenHelper": ["alcf-ai", "auth", "get-access-token"] }
    ]
  ]
}
```

Both entrypoints live in one package: OpenCode 1 calls `server()`, OpenCode 2
calls `setup(ctx)`. No option changes between them.

## Options

| Option        | Type       | Default                                          | Description                                                             |
| ------------- | ---------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `tokenHelper` | `string[]` | `["uvx", "alcf-ai", "auth", "get-access-token"]` | Command that prints an access token on stdout.                          |
| `ttlMs`       | `number`   | `60000`                                          | How long a fetched token is reused before the helper runs again (60 s). |

The helper silently refreshes the token using the Globus refresh token stored
by `alcf-ai auth login`.
