# bookmark-discord-command-cfworker

A Discord bot on Cloudflare Workers that bookmarks messages into your DMs. Built
with [discord-hono](https://discord-hono.luis.fun) and deployed with the
[`cf` CLI](https://developers.cloudflare.com/cf/).

## Commands

| Command | Type | Description |
| --- | --- | --- |
| `Bookmark` | Message | DM yourself the message's content, attachments and a link back to it |

The command only works on servers. Each bookmark has a "Delete bookmark" button
that removes it from your DMs. Replies are ephemeral and deferred, so slow Discord
API calls don't hit the 3-second limit.

## Setup

Requires Node.js 22.18 or later.

```sh
npm install
cp .env.example .env
```

### Secrets

One `.env` file holds everything. `npm run dev`, `npm run register` and
`cf deploy --secrets-file .env` all read it. Don't also create a `.dev.vars`:
when one exists, local dev uses it instead of `.env`.

The Worker reads these secrets (declared in `cloudflare.config.ts`), all from
the [Discord developer portal](https://discord.com/developers/applications):

| Secret | Purpose |
| --- | --- |
| `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY` | Verifying and answering interactions |
| `DISCORD_TOKEN` | Bot token for sending DMs and looking up server names |

Errors are logged to Workers Logs (observability is enabled).

Upload the secrets to production together with a deploy:

```sh
npx cf deploy --secrets-file .env
```

`DISCORD_TEST_GUILD_ID` gets uploaded as well. The Worker doesn't use it, so
that's harmless.

## Development

```sh
npm run dev         # cf dev (Vite) on http://localhost:5173
npm run typecheck   # generate Worker types and run tsc
```

Discord needs a public URL. Expose the dev server, for example with
`cloudflared tunnel --url http://localhost:5173`, and set it as the
development application's Interactions Endpoint URL.

## Registering commands

```sh
npm run register
```

With `DISCORD_TEST_GUILD_ID` set in `.env`, commands are registered to that
server instantly. Without it, they are registered globally (this can take up to
an hour to propagate).

## Deployment

```sh
npm run deploy      # cf deploy
```

The Worker is served on `bookmark-discord.felixoi.com/*`. The GitHub workflow
typechecks and dry-runs every pull request and deploys pushes to `main`. It needs
the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
