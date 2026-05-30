# ADR-006: Use Terraform for infrastructure management

**Status**: Accepted

## Context

obfina's Cloudflare infrastructure (KV namespaces, Pages project, Workers, R2 buckets, custom domain bindings) could be managed through the Cloudflare dashboard or Wrangler CLI. Both approaches produce infrastructure state that exists only in Cloudflare's control plane and is not reproducible from the repository alone.

Candidates evaluated: Terraform + Cloudflare provider, Pulumi (TypeScript), Wrangler-only (`wrangler.toml`).

## Decision

Use Terraform 1.10 or later with the [Cloudflare provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest), with state stored in Cloudflare R2.

## Consequences

**Benefits:**
- `terraform plan` produces a diff of infrastructure changes before they are applied. CI posts this diff as a PR comment, making infrastructure changes visible during code review alongside application changes.
- Terraform state in R2 is the authoritative record of what was deployed. Reproducing the infrastructure in a new Cloudflare account is a single `terraform apply`.
- The Cloudflare Terraform provider is mature and covers all resources obfina uses (KV, Pages, Workers, R2).
- R2 as a backend uses the S3-compatible API, which Terraform's `s3` backend supports natively.
- Terraform 1.10 introduced `use_lockfile = true` for the S3 backend, which uses S3 conditional writes (`If-None-Match`) to create a `.tflock` file alongside the state file. R2 supports this mechanism, providing state locking without DynamoDB. Concurrent `terraform apply` runs are prevented natively as long as `use_lockfile = true` is set in `backend.tf`.

**Tradeoffs:**
- Terraform 1.10 or later is required for `use_lockfile` support. Earlier versions have no state locking with R2 and must rely on serialized CI applies (GitHub Actions concurrency groups) as a compensating control.
- Terraform adds a prerequisite for contributors working on infrastructure. They need Terraform installed and Cloudflare credentials configured locally.
- The Terraform state file in R2 must be treated as sensitive — it may contain resource IDs and configuration that should not be committed to the repository.
- Pulumi with TypeScript would have provided type-safe infrastructure code in the same language as the application. The tradeoff is that Terraform's declarative HCL is more widely understood by infrastructure contributors than Pulumi's imperative TypeScript.
- `wrangler.toml` alone would have been sufficient for the Workers and KV configuration, but it does not manage R2 buckets, custom domains, or Pages project settings declaratively. The KV namespace ID output by Terraform must be referenced in `wrangler.toml` manually (or via a CI step that writes the ID from `terraform output`).