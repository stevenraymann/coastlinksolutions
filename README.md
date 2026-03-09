# CoastLink Solutions — coastlinksolutions.com

Static site deployed on Cloudflare Pages with a Worker for contact form handling.

## Repo Structure

```
├── index.html          Main site
├── _worker.js          Cloudflare Worker — handles POST /api/contact → Resend
├── _headers            Cloudflare security & cache headers
├── _redirects          URL redirects (www → apex, etc.)
├── robots.txt          Search engine crawl rules
├── sitemap.xml         SEO sitemap
└── assets/
    ├── favicon.svg     Browser tab icon
    └── og-image.svg    Social share image (1200×630)
```

## Deploying

1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Build settings: no build command, output directory = `/` (root)
4. Set environment variables (see below)

## Environment Variables

Set these in Cloudflare Pages → Settings → Environment Variables:

| Variable        | Value                                      |
|-----------------|--------------------------------------------|
| RESEND_API_KEY  | re_xxxxxxxxxxxxxxxx (from resend.com)      |
| TO_EMAIL        | info@coastlinksolutions.com                |
| FROM_EMAIL      | noreply@coastlinksolutions.com             |

> FROM_EMAIL domain must be verified in your Resend account.

## Contact Form

Form submissions POST to `/api/contact` (handled by `_worker.js`).
Responses are emailed via Resend with full lead details including
name, phone, email, business name, service interest, and message.

## Before Going Live

- [ ] Update phone number in index.html (search: 251-555-0000)
- [ ] Update email in index.html (search: info@coastlinksolutions.com)  
- [ ] Update schema telephone field in index.html
- [ ] Set the 3 environment variables in Cloudflare Pages
- [ ] Verify FROM_EMAIL domain in Resend dashboard
- [ ] Submit sitemap to Google Search Console after first deploy
