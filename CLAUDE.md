## Pull requests and tests (shared across all repositories)

These come from the Vibe Verifier catalog and are the same in every repository.

- Before opening a pull request or editing its description, follow `.claude/skills/write-acceptance-criteria`:
  QAE checks only what `## Acceptance criteria` says, on the preview. Check the description before pushing:
  `git clone --depth 1 https://github.com/Greenbauer/vibe-verifier /tmp/vibe-verifier` once, then
  `python3 /tmp/vibe-verifier/bin/vibe-verifier criteria body.md`.
- Before editing code and before pushing, follow `.claude/skills/follow-repo-rules`.
- When the same mistake happens twice, follow `.claude/skills/encode-a-lesson`.
- After editing only a pull request's description, re-run the failed QAE run; do not push an empty commit.
