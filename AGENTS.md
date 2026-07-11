<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Local dev cache

After UI or route changes, if the user reports localhost does not match source (missing features, old copy, etc.), run `npm run dev:clean` (or `rm -rf .next` then `npm run dev`) before assuming the code is wrong. Dev uses Webpack (`next dev --webpack`); Turbopack’s cache has been unreliable here.
<!-- END:nextjs-agent-rules -->
