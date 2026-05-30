# ADR-004: Host entirely on Cloudflare

**Status**: Accepted

## Context

obfina needs: static asset hosting, a server-side runtime for API proxy routes, a key-value store for caching, and object storage for Terraform state. The stack should be cheap (target: under $10/month), globally distributed, and deployable from GitHub Actions without operational complexity.

Candidates evaluated: Vercel + Upstash Redis, Cloudflare Pages + Workers + KV, AWS (Lambda + S3 + CloudFront + ElastiCache).

## Decision

Use Cloudflare Pages (static hosting), Cloudflare Workers (server routes via `adapter-cloudflare`), Cloudflare KV (cache), and Cloudflare R2 (Terraform state).

## Consequences

**Benefits:**
- All resources live within one provider. DNS, CDN, compute, and storage are colocated — cache reads in Workers happen in the same edge location as the request, with no cross-service network hops.
- Cloudflare Workers isolates start significantly faster than Lambda functions. Cold-start latency is typically imperceptible to users, unlike Lambda where cold starts after idle periods can add hundreds of milliseconds.
- The free tier covers the expected traffic for an early-stage public project. Paid tier starts at $5/month, well within budget.
- R2 has no egress fees, making it suitable for Terraform state reads that happen on every CI run.
- `@sveltejs/adapter-cloudflare` produces a deployment bundle ready for Cloudflare Pages with no additional configuration.

**Tradeoffs:**
- Cloudflare Workers runs in a V8 isolate with a subset of Node.js APIs. Some npm packages that assume a full Node.js environment will not work. Dependencies must be verified for Workers compatibility before use.
- Cloudflare KV is eventually consistent — a write in one region may not be immediately visible to a read in another. This is acceptable for cache invalidation (stale data for seconds is tolerable) but means KV should not be used for any state that requires strong consistency.
- Migrating away from Cloudflare later requires replacing Pages, Workers, KV, and R2 simultaneously. The provider lock-in is higher than a more composable multi-provider architecture.