# alcf-ai-opencode-plugin

[opencode](https://opencode.ai) plugin that refreshes an ALCF AI access token
and injects it into requests sent to ALCF inference providers
(`alcf-inference-service-*`).

`alcf-ai agent configure opencode` registers this plugin for you:

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

## Options

| Option        | Type       | Default                                          | Description                                                             |
| ------------- | ---------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `tokenHelper` | `string[]` | `["uvx", "alcf-ai", "auth", "get-access-token"]` | Command that prints an access token on stdout.                          |
| `ttlMs`       | `number`   | `60000`                                          | How long a fetched token is reused before the helper runs again (60 s). |

The helper silently refreshes the token using the Globus refresh token stored
by `alcf-ai auth login`.
