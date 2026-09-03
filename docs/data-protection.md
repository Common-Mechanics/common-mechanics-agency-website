# Data protection — internal record

**Controller:** Common Mechanics Ltd, company no. 17385700, registered in England and Wales
**Registered office:** 71–75 Shelton Street, London, WC2H 9JQ
**Privacy contact:** privacy@commonmechanics.io
**Last reviewed:** 3 September 2026

This is the internal counterpart to the public notice at `/privacy` (`src/pages/privacy.astro`).
It exists to satisfy UK GDPR Art. 30 and to keep the decisions behind the site's privacy
posture written down rather than remembered.

---

## 1. Record of processing activities (Art. 30)

### 1.1 Serving commonmechanics.io

| | |
|---|---|
| **Purpose** | Deliver the website and protect it from abuse |
| **Data subjects** | Site visitors |
| **Personal data** | IP address, User-Agent, requested URL — processed transiently to route and serve the request |
| **Lawful basis** | Art. 6(1)(f) legitimate interests — operating and securing our own website |
| **Processors** | Cloudflare, Inc. (Workers Static Assets) |
| **Transfers** | Cloudflare operates a global anycast network. Covered by their standard DPA and its transfer terms |
| **Retention** | We enable no additional logging — Workers observability is deliberately **off** (`wrangler.jsonc`). Cloudflare's own edge and security log retention applies and is outside our control |

No cookies, no analytics, no tag manager, no pixels, no third-party embeds, no forms.
Fonts are self-hosted, so no request leaves our own origin. Verified by network trace,
3 September 2026.

### 1.2 Email correspondence

| | |
|---|---|
| **Purpose** | Respond to enquiries; run client engagements; ordinary business admin |
| **Data subjects** | Prospective clients, clients, suppliers, applicants |
| **Personal data** | Name, email address, whatever the correspondent chooses to include |
| **Lawful basis** | Art. 6(1)(b) steps prior to / performance of a contract, and Art. 6(1)(f) legitimate interests for general correspondence |
| **Processors** | Our mail provider — **TODO: name the provider and record its DPA** |
| **Retention** | Enquiries that don't become engagements: **12 months** from the last message. Project-related correspondence: **6 years** after the engagement ends (Limitation Act 1980 and HMRC record-keeping). Records of data-subject requests and how we handled them: **2 years**. These figures are the ones published at `/privacy` — change both together or they contradict each other |

> **Keep in sync.** Every retention period above is also stated publicly at `/privacy`.
> A public notice that promises a shorter period than the internal record is the
> inconsistency an ICO audit looks for first.

### 1.3 Publishing team member details

| | |
|---|---|
| **Purpose** | Let clients see who they'd be working with and contact them directly |
| **Data subjects** | Team members (currently 3) |
| **Personal data** | Name, work email, LinkedIn profile URL, city |
| **Lawful basis** | Art. 6(1)(f) legitimate interests — ordinary professional identification for a services business |
| **Source** | `src/components/Team.astro` |
| **Retention** | Published while the person is with the studio; removed within 30 days of their last day. See `staff-privacy-notice.md` and §4 below |

### 1.4 Client project delivery

Where we process personal data inside a client's product, **the client is the controller and
we are the processor**. That requires a written Art. 28 agreement in each client contract
before any such data is touched. **TODO: confirm the standard client contract contains
Art. 28 processor terms.**

---

## 2. Technical and organisational measures (Art. 32)

- Static site, no database, no user accounts, no authentication surface.
- HTTPS with HSTS (`max-age=31536000; includeSubDomains`) — see `public/_headers`.
- Content-Security-Policy locked to `'self'`; no third-party origins permitted.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` set.
- No third-party scripts of any kind, so no supply-chain script risk.
- **TODO: confirm 2FA is enforced on Cloudflare, GitHub and the mail provider**, and that
  deploy tokens are least-privilege and rotated.

---

## 3. Analytics policy — how the banner-free position is protected

The site currently sets nothing on visitors' devices, so PECR reg. 6 is not engaged and **no
cookie banner is required**. That is a deliberate position, not an accident, and it is easy to
lose.

**The rule.** Any analytics added to commonmechanics.io must set no cookie and store nothing
on the device — no `localStorage`, no `sessionStorage`, no persistent identifier of any kind.

- **Approved without consent:** Cloudflare Web Analytics; self-hosted Plausible or Umami in
  cookieless mode.
- **Not permitted without a compliant prior-blocking consent banner:** GA4, Meta or LinkedIn
  pixels, Hotjar, and anything else that writes to the device.

The obligation under PECR reg. 6 attaches to *storing or accessing information on terminal
equipment*, whether or not that information is personal data — so "we anonymise the IP" does
not remove it. Adding GA4 means adding a banner, and a banner that actually blocks until
consent, which is a meaningful amount of work for a marketing site that gets little from it.

**Client work.** Recommend the same default. Clients are the controller of their own site and
can decide otherwise, but if a client wants GA4 they need the consent infrastructure to go
with it, and that belongs in the scope and the quote. Note that `src/components/FAQ.astro`
promises clients "your own analytics access" — that promise is satisfiable with cookieless
tooling.

---

## 4. Open actions

| # | Action | Ref | Owner |
|---|---|---|---|
| 1 | Run the ICO data protection fee self-assessment at ico.org.uk/registration/new. Tier 1 is £52/yr; non-payment carries a fixed penalty. The "core business purposes" exemption may currently apply, but will not once we hold client end-user data | G10 | — |
| 2 | Add the ICO registration number to `src/pages/privacy.astro` once registered | G10 | — |
| 3 | Name the mail provider above and record its DPA | §1.2 | — |
| 4 | Record Cloudflare's DPA as relied upon (incorporated in their standard terms) | §1.1 | — |
| 5 | Confirm the standard client contract contains Art. 28 processor terms | §1.4 | — |
| 6 | Add the VAT number to `src/components/Footer.astro` once HMRC issues it — a commented-out line is already in place. Display becomes mandatory under E-Commerce Regs 2002 reg. 6 from the date of registration | G7 | — |
| 7 | Confirm the retention periods in §1.2 suit how the business actually runs | §1.2 | — |
| 8 | Circulate `staff-privacy-notice.md` to the team and add it to onboarding | G9 | — |
| 9 | Add "remove from site within 30 days" to the leavers checklist | G9 | — |
| 10 | Confirm 2FA and deploy-token hygiene | §2 | — |

## 5. Review

Review this record annually, and whenever the site gains a form, an analytics tool, an embed,
or any third-party script.
