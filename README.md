# jimmy-work

Monorepo containing the Office Log applications.

## Projects

| Directory | Description | Stack |
| --- | --- | --- |
| [`office-log-next`](./office-log-next) | Frontend / web app | Next.js 16, React 19, Tailwind CSS 4 |
| [`office-log-wkr`](./office-log-wkr) | Backend worker / API | Cloudflare Workers, Wrangler 4, Vitest |

## Getting started

Each project is self-contained — install and run from its own directory.

### office-log-next

```bash
cd office-log-next
npm install
npm run dev      # start dev server
npm run build    # production build
```

### office-log-wkr

```bash
cd office-log-wkr
npm install
npm run dev      # wrangler dev
npm test         # vitest
npm run deploy   # wrangler deploy
```

## Integrity

SHA-256 checksums of all tracked files are recorded in [`CHECKSUMS.sha256`](./CHECKSUMS.sha256).

Verify with:

```bash
shasum -a 256 -c CHECKSUMS.sha256
```

Regenerate after changing files:

```bash
git ls-files | sort | xargs shasum -a 256 > CHECKSUMS.sha256
```

## Repository

- Remote: https://github.com/embit087/jimmy-work
- Default branch: `main`
