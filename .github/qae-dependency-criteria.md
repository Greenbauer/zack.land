What every dependency update is held to. A pull request that changes only `package.json` and
`package-lock.json` is walked against this list by the QA workflow
(`.github/workflows/qae-explore.yml`), which reads it from the base branch.

## Acceptance criteria

- At 375 pixels wide, the home page shows its navigation behind a menu button and matches its mobile design reference [ref: home-mobile]
- The portfolio page lists its sections (Web Apps, Digital Art, Miscellaneous), each opens its own page, and the Web Apps page shows its project images
- A visitor can send a message from the contact page: the form refuses a malformed email before sending, and a complete message is sent and confirmed
