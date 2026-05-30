# Infrastructure

obfina runs entirely on Cloudflare. All resources are managed with Terraform.

## Architecture

| Resource | Purpose |
|----------|---------|
| Cloudflare Pages | Hosts the built SvelteKit app |
| Cloudflare Workers | Runs SvelteKit server routes (via `adapter-cloudflare`) |
| Cloudflare KV | API response cache (separate namespaces per environment) |
| Cloudflare R2 | Terraform remote state storage |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.10 or later (required for R2 state locking via `use_lockfile`)
- A Cloudflare account with Pages and Workers enabled
- A Cloudflare API token with the following permissions:
  - `Account > Cloudflare Pages > Edit`
  - `Account > Workers Scripts > Edit`
  - `Account > Workers KV Storage > Edit`
  - `Account > R2 Storage > Edit`

## First-time setup

### 1. Create the R2 bucket for Terraform state

Terraform state is stored in Cloudflare R2 rather than locally or in Terraform Cloud. Create the bucket manually once:

```bash
wrangler r2 bucket create obfina-tfstate
```

### 2. Configure credentials

```bash
export CLOUDFLARE_API_TOKEN=your_api_token
export CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 3. Initialize Terraform

```bash
cd infra
terraform init
```

This configures the R2 backend and downloads the Cloudflare provider.

### 4. Apply

```bash
terraform plan
terraform apply
```

On first apply, Terraform creates two KV namespaces (`obfina-cache-prod` and `obfina-cache-preview`), the Pages project, and the R2 bucket for state. The Pages project is connected to your GitHub repository — subsequent deploys happen automatically via GitHub Actions.

After apply, copy the KV namespace IDs from `terraform output` into `wrangler.toml`:

```bash
terraform output kv_namespace_id_prod
terraform output kv_namespace_id_preview
```

## Terraform structure

```
infra/
├── main.tf          # Cloudflare resources
├── variables.tf     # Input variables
├── outputs.tf       # KV namespace IDs and other values consumed by wrangler.toml
└── backend.tf       # R2 remote state config with use_lockfile = true
```

Key resources declared in `main.tf`:

```hcl
resource "cloudflare_pages_project" "obfina" { ... }
resource "cloudflare_workers_kv_namespace" "cache_prod"    { title = "obfina-cache-prod" }
resource "cloudflare_workers_kv_namespace" "cache_preview" { title = "obfina-cache-preview" }
```

Production Workers bind `cache_prod`; preview deployments bind `cache_preview`. This prevents preview branches from writing test data into the production cache.

## CI/CD

Two GitHub Actions workflows handle the deployment lifecycle.

### Preview (`.github/workflows/preview.yml`)

Triggered on every pull request.

```
typecheck → lint → build → terraform plan → deploy preview
```

- `terraform plan` output is posted as a PR comment so infrastructure changes are visible during review.
- Cloudflare Pages automatically assigns a unique preview URL per PR branch.
- Preview deployments use the `obfina-cache-preview` KV namespace, isolated from production.

### Production (`.github/workflows/deploy.yml`)

Triggered on push to `main`.

```
typecheck → lint → build → terraform apply → deploy production
```

The production workflow uses a GitHub Actions concurrency group to prevent parallel `terraform apply` runs, which would conflict even with `use_lockfile` if two workflows start simultaneously on rapid pushes.

## Environments

| Environment | Trigger | URL | KV namespace |
|-------------|---------|-----|--------------|
| Preview | PR opened / updated | `<branch>.obfina.pages.dev` | `obfina-cache-preview` |
| Production | Push to `main` | `obfina.pages.dev` (or custom domain) | `obfina-cache-prod` |

## Secrets management

CI/CD workflows require the following repository secrets (set in GitHub → Settings → Secrets):

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

No secrets are embedded in `wrangler.toml` or Terraform files.