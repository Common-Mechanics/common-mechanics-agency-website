# Sub-processor list versions

One file per published version, `v<major>.<minor>.json`, hash-pinned in
`../subprocessors.lock.json`. Published versions are immutable — to change the
list, add a new version file and pin the hash the failing build prints. See the
`/data-processing` section of `CLAUDE.md` for the mechanics.

## What each entry records, and why

From v1.1 every entry carries:

| Field | Why it is here |
| --- | --- |
| `name` | The name a reader will recognise. |
| `legalEntity` | The **contracting** entity, which is often not the brand — Resend is `Plus Five Five, Inc.`, and for a UK controller several vendors contract through an Irish entity. |
| `registeredAddress` | EDPB Opinion 22/2024 §§ 39–41: a controller must be able to have the **name, address and contact person** of every processor and sub-processor readily available. |
| `registrationJurisdiction` | Disambiguates same-named entities and, with the address, identifies the entity unambiguously. |
| `registrationNumber` | *Optional.* A public number exists for the Irish (CRO), Dutch (KvK) and UK (Companies House) entities. Left empty for US entities: a Delaware file number is not a public-facing identifier. |
| `function` | Art. 28 / EDPB: the description of the processing. |
| `processingLocations` | Art. 30(2)(c) requires transfers to a third country to be recorded **including the identification of that third country**, and a controller cannot assess a Chapter V transfer without it. This is also the near-universal third column on published vendor lists. |
| `dataCategories` | Not required per sub-processor — Art. 30 and SCC Annex I place categories at the *processing activity* level. Published because it is what makes the list usable to a client's counsel without a follow-up email. |

## What is deliberately **not** here

A **corporate identifier for every entity** (LEI or equivalent). No UK/EU data
protection law requires one on a sub-processor list, and published lists from
Datadog, Box, Salesforce and PROS do not carry one. The requirement people are
usually thinking of is **DORA**'s register of information, which does mandate an
LEI or EUID for ICT third-party providers — but that binds regulated *financial
entities*, not their suppliers, and does not apply to us.

If a financial-services client ever asks us to populate their DORA register,
that is a per-client exercise against their template, not a change to this file.

## Accuracy

Entity names, addresses and registration numbers are transcribed from the
vendor's own DPA or from the relevant public register (CRO, KvK, Companies
House). `processingLocations` and `dataCategories` describe *our* use of each
service and must be re-checked whenever what we send a vendor changes —
adding a service, or starting to push a new class of data through an existing
one, is a new list version.
