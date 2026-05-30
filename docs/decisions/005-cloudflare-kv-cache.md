# ADR-005: Use Cloudflare KV for API response caching

**Status**: Accepted

## Context

obfina's server routes proxy Onionoo and Tor Metrics. Without caching, every client request would hit upstream APIs directly — abusive to the Tor Project's infrastructure and slow for users. We needed a cache store accessible from Cloudflare Workers.

Candidates evaluated: Cloudflare KV, Upstash Redis, in-memory cache (Worker memory).

## Decision

Use Cloudflare KV as the cache store for all API proxy responses.

## Consequences

**Benefits:**

- KV is natively available in Workers via the `KV` binding — no network round-trip to an external service, no connection pooling, no credentials to manage.
- KV TTL is set per-key at write time, matching the per-endpoint cache strategy (10 min for relays, 30 min for stats, 5 min for censorship).
- KV is included in the Cloudflare Workers free tier and cheap beyond it ($0.50 per million reads).
- Terraform's `cloudflare_workers_kv_namespace` resource manages the namespace declaratively.

**Tradeoffs:**

- KV is eventually consistent (see ADR-004). A cache invalidation write may take seconds to propagate globally. This is acceptable for obfina's use case — stale relay data for a few seconds is not a correctness problem — but it must be understood by contributors who might otherwise expect Redis-like consistency.
- KV has a maximum value size of 25 MiB. A full Onionoo `/details` response for all ~8,000 relays is well under this limit today, but growth in the Tor network could eventually require response splitting or selective field filtering.
- KV TTL is a hard expiry — once a key expires, the next read is a miss and the Worker must fetch upstream synchronously before responding. Background revalidation (stale-while-revalidate) requires explicit implementation using `waitUntil()` in the Worker; it does not happen automatically.
- In-memory caching within a Worker would be faster (zero latency) but does not persist across requests handled by different Worker instances. KV is the right tradeoff for shared, persistent cache state.
