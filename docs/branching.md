# Branching

This project uses pull requests, preview deployments, and a required staging
gate before production. The goal is to keep `main` deployable while still
allowing multiple changes to be verified together before release.

## Branches

| Branch / ref | Purpose                                      | Deployment                             |
| ------------ | -------------------------------------------- | -------------------------------------- |
| `main`       | Production source of truth                   | Production Cloudflare Pages deployment |
| `staging`    | Required release-candidate verification gate | `https://staging.obfina.pages.dev`     |
| `feature/*`  | Feature work                                 | Pull request preview                   |
| `fix/*`      | Bug fixes, including urgent fixes            | Pull request preview                   |
| `chore/*`    | Tooling, CI, dependency, or config work      | Pull request preview                   |
| `docs/*`     | Documentation work                           | Pull request preview                   |
| `codex/*`    | Codex-authored work                          | Pull request preview                   |

## Deployment Roles

Pull request previews verify one change in isolation. They are created for PRs
from repository branches and are useful for checking the behavior, UI, and CI
impact of a single branch before it joins a release candidate.

`staging` verifies the release candidate. Candidate PRs are merged into
`staging` first, and staging is checked as the combined state that may later go
to production. This includes hotfixes: even urgent fixes go through staging
before production.

`main` is production. Merging into `main` triggers the production deploy. `main`
should receive only changes that have already passed staging verification.

## Normal Flow

1. Create a topic branch from the current release base.
2. Open a pull request.
3. Let the required `quality` check and PR preview deployment complete.
4. Merge the PR into `staging`.
5. Verify `https://staging.obfina.pages.dev`.
6. After all release-candidate changes are verified together, merge the same
   accepted changes into `main`.
7. Production deploys automatically from `main`.

## Release Batching

Multiple PRs may be merged into `staging` before production. Use staging as the
single release-candidate branch for the batch. Once the batch is accepted, move
the accepted changes to `main` together.

Do not use `staging` as a long-lived development branch. It should represent a
production candidate, not an accumulating backlog. If staging diverges from the
intended production candidate, reset or rebuild it from the accepted PRs before
releasing.

## Hotfixes

Hotfixes follow the same policy as regular changes:

1. Create a `fix/*` branch.
2. Open a PR and let `quality` and the PR preview complete.
3. Merge the hotfix into `staging`.
4. Verify staging.
5. Merge the hotfix into `main`.

Skipping staging is not part of the normal process.

## Merge Policy

Use squash merge for PRs. Local branches may have any number of commits, but
the protected branches should receive one clean commit per accepted PR.

`main` is protected: direct pushes are blocked, the `quality` check is required,
force pushes and branch deletion are disabled, unresolved PR conversations block
merge, and linear history is required.
