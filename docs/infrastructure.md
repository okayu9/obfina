# Infrastructure

obfina runs entirely on Cloudflare. The first deploy path is automated with
GitHub Actions, Wrangler, and a small Cloudflare API bootstrap script. Terraform
is still the intended long-term infrastructure record for larger changes, but
the project can be published from a fresh Cloudflare account without manually
creating Pages or KV resources in the dashboard.

## Architecture

| Resource           | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| Cloudflare Pages   | Hosts the built SvelteKit app                             |
| Cloudflare Workers | Runs SvelteKit server routes (via `adapter-cloudflare`)   |
| Cloudflare KV      | API response cache (separate namespaces per environment)  |
| Cloudflare R2      | Terraform remote state storage, when Terraform is enabled |

## Prerequisites

- A Cloudflare account with Pages and Workers enabled
- A Cloudflare API token with the following permissions:
  - `Account > Cloudflare Pages > Edit`
  - `Account > Workers Scripts > Edit`
  - `Account > Workers KV Storage > Edit`
- Terraform 1.10 or later only if you are working on the future `infra/`
  backend

## First-time setup

### 1. Configure GitHub secrets

Set these repository secrets in GitHub:

| Secret                  | Value                 |
| ----------------------- | --------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token  |

### 2. Push or open a pull request

The workflows run the same bootstrap command before deploying:

```bash
pnpm cloudflare:bootstrap
```

The bootstrap script:

1. finds or creates `obfina-cache-prod`
2. finds or creates `obfina-cache-preview`
3. writes `wrangler.toml` with the `RELAY_CACHE` binding
4. lets Wrangler create the Pages project on the first deploy if it does not
   already exist

Production deploys run on pushes to `main`. Preview deploys run on pull
requests.

### 3. Local bootstrap and deploy

For a local one-off deploy, copy the env file and fill in the credentials:

```bash
cp .env.example .env.local
```

Then export the values in your shell and deploy:

```bash
export CLOUDFLARE_API_TOKEN=your_api_token
export CLOUDFLARE_ACCOUNT_ID=your_account_id
pnpm cloudflare:deploy
```

`wrangler.toml` is generated and ignored by git because it contains
account-specific resource IDs. `wrangler.toml.example` documents the shape.

## Terraform

The ADRs describe Terraform as the long-term infrastructure-management choice,
but the Terraform module has not been added yet. When it is added, it should
manage the same resources created by bootstrap:

- Cloudflare Pages project `obfina`
- KV namespace `obfina-cache-prod`
- KV namespace `obfina-cache-preview`
- optional R2 bucket for Terraform state

If remote state is stored in R2, create the state bucket once before
`terraform init`:

```bash
wrangler r2 bucket create obfina-tfstate
```

## CI/CD

Two GitHub Actions workflows handle the deployment lifecycle.

### Preview (`.github/workflows/preview.yml`)

Triggered on every pull request.

```
check → test → build → bootstrap Cloudflare resources → deploy preview
```

- Cloudflare Pages automatically assigns a unique preview URL per PR branch.
- Preview deployments use the `obfina-cache-preview` KV namespace, isolated from production.

### Production (`.github/workflows/deploy.yml`)

Triggered on push to `main`.

```
check → test → build → bootstrap Cloudflare resources → deploy production
```

The production workflow uses a GitHub Actions concurrency group to prevent
parallel production deploys on rapid pushes.

## Environments

| Environment | Trigger             | URL                                   | KV namespace           |
| ----------- | ------------------- | ------------------------------------- | ---------------------- |
| Preview     | PR opened / updated | `<branch>.obfina.pages.dev`           | `obfina-cache-preview` |
| Production  | Push to `main`      | `obfina.pages.dev` (or custom domain) | `obfina-cache-prod`    |

## Secrets management

CI/CD workflows require the following repository secrets (set in GitHub → Settings → Secrets):

| Secret                  | Value                 |
| ----------------------- | --------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token  |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

No secrets are embedded in `wrangler.toml`, workflow files, or Terraform files.
