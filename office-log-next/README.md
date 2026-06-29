This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Integrity checksums

A dependency-free script fingerprints the source tree with SHA-256. It runs
automatically before every `build` (`prebuild` hook), so each deployment ships a
manifest describing exactly what it was built from.

```bash
npm run checksum          # write the manifest
npm run checksum:verify   # recompute and fail on any drift
```

Outputs (committed, served as static files):

- `public/checksums.sha256` — one `sha256  path` line per file (`shasum -a 256 -c` compatible)
- `public/integrity.json` — `{ algorithm, files, manifestDigest, commit }`; `manifestDigest` is a single hash of the whole tree

### Prove a deployment matches the source

Because the manifest is in `public/`, it is retrievable from the live site:

```bash
# digest the deployment shipped
curl -s https://office-log-next.vercel.app/integrity.json | python3 -c "import sys,json;print(json.load(sys.stdin)['manifestDigest'])"

# digest of your local source
npm run checksum >/dev/null && python3 -c "import json;print(json.load(open('public/integrity.json'))['manifestDigest'])"
```

Equal digests prove the deployed build came from this source tree. When the
Vercel project is Git-connected, `commit` is populated from
`VERCEL_GIT_COMMIT_SHA`, tying the digest to a specific repo commit.

> Excluded from hashing: `node_modules`, `.next`, `.git`, `.vercel`, and the two
> manifest files themselves.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
