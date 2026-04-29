# QA Plan — Dave Hajdu

Tiered test plan. davehajdu.com is a credibility-and-capture site — most quality risk lives in the inquiry pipeline, content rendering, and the cross-brand CRM contract.

---

## Tier 1 — Smoke (every deploy)

- Homepage returns 200; hero copy and headshot render.
- `/speaker-topics`, `/ai-in-business`, `/books`, `/blog` all return 200.
- Inquiry form renders and surfaces field-level validation.

---

## Tier 2 — Inquiry pipeline (pre-release)

End-to-end form flows for each variant.

- **Keynote inquiry.** Submit form → 200 → row appears in shared `inquiries` with `type = 'keynote'`, `source_site = 'davehajdu.com'` → Lark card fires.
- **Consultation inquiry.** Same path with `type = 'consultation'`.
- **General inquiry.** Same path with `type = 'general'`.
- **Validation.** Empty/invalid email and oversized message rejected with field errors and no DB write.
- **Resend confirmation.** Inquirer receives a confirmation email within 60 seconds.

---

## Tier 3 — Cross-brand CRM contract

The shared schema is owned by aio-website. This tier guards against drift.

- The `submit_inquiry` RPC payload from this site matches the canonical signature.
- New required fields in the canonical RPC fail this site's submit; surface as a deploy-blocking error.
- `source_site` is always `'davehajdu.com'`.

---

## Tier 4 — Content rendering

- Every blog post in `posts-data.ts` renders without console errors.
- Speaker-topics layout renders all topics with no missing assets.
- Book showcase renders both books with valid retailer links.

---

## Tier 5 — Email deliverability

- Confirmation emails are not flagged as spam by major providers (Gmail, Outlook).
- DKIM/DMARC/SPF records pass for the sending domain.
- Bounce rate stays below 2%.

---

## Quality gates

| Gate | When | Failure mode |
|---|---|---|
| Tier 1 smoke | Every deploy | Block merge to main |
| Tier 2 inquiry | Pre-release | Block release |
| Tier 3 contract | After AIO schema migration | Manual sign-off required |
| Tier 4 content | After blog or topic edits | Editorial review |
| Tier 5 deliverability | Quarterly | Investigate before next release |

---

## Sequencing

Tier 1 runs automatically on PR. Tier 2 runs pre-release. Tiers 3–5 run on the relevant trigger (schema change, content change, quarterly review).
