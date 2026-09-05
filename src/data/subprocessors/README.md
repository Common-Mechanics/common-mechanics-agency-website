# Sub-processor list versions

One file per published version, `v<major>.<minor>.json`, hash-pinned in
`../subprocessors.lock.json`. Published versions are immutable — to change the
list, add a new version file and pin the hash the failing build prints. See the
`/data-processing` section of `CLAUDE.md` for the mechanics.

## What each entry records, and why

The set is short on purpose. Each field is here because some instrument obliges
us to hold it; a field nothing requires is a field that can be wrong for no
benefit, so it is not collected at all.

| Field | Why it is here | Published? |
| --- | --- | --- |
| `name` | The name a reader will recognise. | Yes |
| `legalEntity` | The **contracting** entity, which is often not the brand — Resend is `Plus Five Five, Inc.`. EDPB Opinion 22/2024: a controller must be able to have the name, address and contact person of every sub-processor readily available. | Yes |
| `function` | Our own DPA, clause 12, promises a list "identifying each Sub-processor **and the function it performs**". This is the one field besides the name that we are contractually obliged to publish. | Yes |
| `processingLocations` | Art. 30(2)(c) requires transfers to a third country to be recorded **including the identification of that third country**, and a controller cannot assess a Chapter V transfer or exercise the clause 13 objection right without it. Also the near-universal third column on published vendor lists. | Yes |
| `registeredAddress` | The "address" half of the EDPB triple above. The obligation is to have it *available to a controller*, not to publish it, so the page offers it on request and this file is what answers. | **No** |

## What is deliberately **not** here

- **`registrationNumber` and `registrationJurisdiction`.** No UK/EU instrument
  asks for either on a sub-processor list, at any level. Dropped.
- **`dataCategories`.** Art. 30(2)(b) asks a *processor* to record the
  "categories of processing", not the categories of personal data — that is
  Art. 30(1)(c), a controller duty. Schedule 1 of our own DPA already carries
  the Art. 28(3) processing detail per engagement, so publishing it again here
  created a second, uncontracted source of truth that could contradict the
  signed agreement. Dropped.
- **A corporate identifier for every entity** (LEI or equivalent). The
  requirement people are usually thinking of is **DORA**'s register of
  information, which binds regulated *financial entities*, not their suppliers.
  If a financial-services client asks us to populate their DORA register, that
  is a per-client exercise against their template, not a change to this file.

Note also that the SCC field template (Annex III of Decision (EU) 2021/914 —
name, address, contact person, description of processing) applies only under
**Clause 9(a) Option 1, specific authorisation**. Our DPA grants *general*
written authorisation with a 14-day objection window, which is Option 2, where
the standard is purposive: "the information necessary to enable the controller
to exercise its right to object". There is no prescribed field list.

## Accuracy

Entity names and addresses are transcribed from the vendor's own DPA or from the
relevant public register (CRO, KvK, Companies House). The contracting entity
depends on which of a vendor's entities *we* contract with, and vendors
restructure without telling us — Anthropic contracts through its Irish entity
for UK customers, OpenAI does not. `processingLocations` describes *our* use of
each service and must be re-checked whenever what we send a vendor changes.

## The v1.0 reset (5 September 2026)

There was an earlier v1.0 and v1.1 in this directory. They were removed and the
list restarted at v1.0 because no DPA had been signed with anyone at that point,
so no published version had ever been relied on and the immutability guarantee
protected nothing. That reasoning does not survive the first signature — from
the first signed agreement onward, a published version is a record a client may
have acted on, and the only way to change the list is a new version file.
