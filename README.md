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
