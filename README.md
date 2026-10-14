# zack.land
<div>

## About

<dl>
  This is the frontend of my <a href="https://zack.land">portfolio website</a>.

  See more <a href="https://zack.land/portfolio/web-apps#this-web-site">here</a>.
</dl>

## Environment

<dl>
  Copy <code>.env.example</code> to <code>.env.local</code> and fill in the values.
  The contact form (<code>/api/email</code>) needs the SMTP variables; reCAPTCHA v3
  is optional and fail-open (the form works without it).
</dl>

| Variable | Purpose |
| --- | --- |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` | SMTP transport for the contact form |
| `FROM_EMAIL` / `TO_EMAIL` | Sender + recipient for contact submissions |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 public site key (client) |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key (server verification) |
| `BEHANCE_API_KEY` | Behance API for the "Digital Art" page |

### reCAPTCHA v3 (contact form)

1. Create keys at <https://www.google.com/recaptcha/admin/create> — type **reCAPTCHA v3**, domains `zack.land`, `www.zack.land`, `localhost`.
2. Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` (locally and in Vercel).
3. In production, **redeploy** after adding them so the public site key is inlined into the client bundle.

When the secret is unset, submissions skip verification; when set, a submission must clear a 0.5 score threshold on the `contact` action. Verification logic is unit-tested — run `npm test`.

## Credits

<dl>
  This was built by starting from <a href="https://github.com/vercel/next.js">next.js</a>.
</dl>

</div>

## CI

Every pull request and every push to `master` runs the unit tests (`npm test`: Vitest over every
`*.test.ts` file) through `.github/workflows/tests.yml`, as the check `tests`. The workflow has no
path filter and the job no condition, so the check always reports. The Cypress specs in
`cypress/e2e` need the site built and started and are not part of it.

Every pull request runs the [Vibe Verifier](https://github.com/Greenbauer/vibe-verifier) gates listed
in `.vibe-verifier` through `.github/workflows/vibe-verifier.yml`, pinned to a catalog commit: the
`package.json` checks, `gitleaks` on the pull request's commits, `actionlint` and `zizmor` on changed
workflows, the `cognitive-complexity` and `max-file-lines` ratchets on changed files, and `feature-map`,
which keeps the feature map in [`docs/features/`](docs/features/README.md) true against the site's pages
and route handlers.

Pull requests with a rendered change also run the Vibe Verifier QAE harness (`.github/workflows/qae-explore.yml`,
gates in `.vibe-verifier-qae`): the site is built and started in a container on the runner, a model
with a real browser walks each item under a `## Acceptance criteria` heading in the pull request body
and saves a step log and a screenshot per step, and two deterministic gates decide from the artifacts.
A pull request body needs that heading (a change that renders nothing declares `- None: <why>` under
it), with one exception: a pull request that changes only `package.json` and `package-lock.json` is
held to `.github/qae-dependency-criteria.md`, read from the base branch, in addition to any criteria
of its own. The Vercel analytics script is the one console and network error declared as environmental.
A new head that changes only files no page renders since a passing walk (a merge of `master` into the
branch, say) is not walked again: the QA review says it passed on an earlier head and names that run.

How to write criteria QAE can check: [`.claude/skills/write-acceptance-criteria`](.claude/skills/write-acceptance-criteria/SKILL.md).

Dependabot opens security updates only, grouped into one pull request (`.github/dependabot.yml`), and
each is walked like any other pull request, against that criteria file. Three things make that possible:

- The workflow names Dependabot as a bot allowed to start the explorer (the other is the pull sync's
  bot, named in the `PULL_SYNC_BOT` variable, whose update of a branch makes it the actor of the run).
- The install, the build and the server run in a container that is given the tracked files and no
  secret. The job that walks the site holds the model token, and a dependency update is code nobody
  here has read. The same container runs a mail sink that accepts every message and keeps none, so
  the contact form's send is checked without real mail.
- A run Dependabot starts reads the repository's Dependabot secrets, never its Actions secrets, so
  `CLAUDE_CODE_OAUTH_TOKEN` has to be set there too (`gh secret set CLAUDE_CODE_OAUTH_TOKEN --app dependabot`).
  Without it the explorer fails on a Dependabot pull request; nothing is skipped.

The QAE explorer also retains numeric token usage for 7 days in a dedicated
`vv-usage-qae-explorer-<attempt>` artifact. It contains only `usage.json`, with run
metadata and measured token counts, never prompts, model responses, or credentials.
Missing or skipped usage is explicit, not zero. The deterministic verifier has no
model token usage. Records begin with new runs after this workflow update and
cannot backfill earlier runs. Token counts are separate from subscription quotas
and do not change QAE verdicts.
