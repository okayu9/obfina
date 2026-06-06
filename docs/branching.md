# Branching

This project uses pull requests and preview deployments as the normal gate
before production. The goal is to keep `main` deployable while making every
change easy to inspect before it ships.

## Branches

| Branch / ref | Purpose                                                | Deployment                             |
| ------------ | ------------------------------------------------------ | -------------------------------------- |
| `main`       | Production source of truth                             | Production Cloudflare Pages deployment |
| `staging`    | Optional shared verification branch for larger changes | `https://staging.obfina.pages.dev`     |
| `feature/*`  | Feature work                                           | Pull request preview                   |
| `fix/*`      | Bug fixes, including urgent fixes                      | Pull request preview                   |
| `chore/*`    | Tooling, CI, dependency, or config work                | Pull request preview                   |
| `docs/*`     | Documentation work                                     | Pull request preview                   |

## Deployment Roles

Pull request previews verify one change in isolation. They are created for PRs
from repository branches and are the default environment for reviewing behavior,
UI, and CI impact before merging to production.

`staging` is optional. Use it when a change needs a shared environment beyond
the per-PR preview, such as larger UI changes, CI/CD changes, or a batch of PRs
that should be checked together. Staging should not be required for every PR.

`main` is production. Merging into `main` triggers the production deploy. `main`
should receive only changes that have passed the required PR checks and have
been reviewed in their PR preview.

## Normal Flow

1. Create a topic branch from the current release base.
2. Open a pull request.
3. Let the required `quality` check and PR preview deployment complete.
4. Verify the PR preview URL posted on the PR.
5. Merge the PR into `main`.
6. Production deploys automatically from `main`.

## Optional Staging

Multiple PRs may be merged into `staging` when they need to be verified
together before production. In that case, use staging as the shared candidate
branch for the batch. Once the batch is accepted, move the accepted changes to
`main`.

Do not use `staging` as a long-lived development branch. It should represent a
temporary verification target, not an accumulating backlog. If staging diverges
from the intended candidate, reset or rebuild it from the accepted PRs before
using it for release decisions.

## Hotfixes

Hotfixes follow the same policy as regular changes. Staging may be used if the
fix needs extra shared-environment verification, but it is not required by
default.

1. Create a `fix/*` branch.
2. Open a PR and let `quality` and the PR preview complete.
3. Verify the PR preview.
4. Merge the hotfix into `main`.

## Merge Policy

Use squash merge for PRs. Local branches may have any number of commits, but
the protected branches should receive one clean commit per accepted PR.

`main` is protected: direct pushes are blocked, the `quality` check is required,
force pushes and branch deletion are disabled, unresolved PR conversations block
merge, and linear history is required.
