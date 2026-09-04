# Controller-side vendors

Vendors that handle personal data where **Common Mechanics is the controller**,
not a processor. They are deliberately *not* on the published sub-processor list
at `/data-processing`, and this file records why so the decision does not get
re-litigated every time someone reads the list and notices a gap.

## The distinction

The published list is not "everyone who touches data belonging to a client". It
is narrower, and the narrowness is the point:

> A **sub-processor** is a party we engage to help with processing we carry out
> *on a client's behalf, on the client's instructions*, where the client is the
> controller and we are their processor.

Client personal data reaches Revolut and Rocket Lawyer — but as data we hold in
our **own** right, for our own purposes: getting paid, and having an enforceable
contract. The tell is that the client cannot instruct us to delete it. We are
required to keep accounting records for six years under s.388 Companies Act 2006
and by HMRC, and a signed contract for as long as it could be litigated. A
processor who cannot be told to delete the data is not a processor.

Putting these on the Art. 28 list would be a false statement about the legal
basis, and would hand every client a right to object to our bank.

They belong instead in our **Article 30(1) record of processing** as a
controller, which is what this file seeds.

## The vendors

| Vendor | Entity | Registered office | No. | Role | What we need |
| --- | --- | --- | --- | --- | --- |
| Revolut | Revolut Ltd | 30 South Colonnade, London E14 5HX | 08804411 | Independent controller | Nothing. No Art. 28 contract is possible. |
| Wise | Wise Payments Limited | 1st Floor Worship Square, 65 Clifton Street, London EC2A 4JE | 07209813 | Independent controller | Nothing. FCA-authorised EMI, reg. 900507. |
| Rocket Lawyer | Rocket Lawyer UK Limited | Avaland House, 110 London Road, Apsley, Hemel Hempstead HP3 9SD | 07975711 | **Our processor** | **A DPA — see below.** |

### Why the banks cannot be processors

Under [EDPB Guidelines 07/2020](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en),
a bank decides the *essential means* of its processing: it will not let a
customer dictate what transaction data it collects or how long it keeps it,
because AML and PSD2 obligations fix both. That makes banks and payment
institutions independent controllers of payment data, not anyone's processor.
Attaching an expense report does not change this — the receipts are our own and
our staff's data, which we control.

### Rocket Lawyer is a real processor — of *our* data

Rocket Lawyer processes documents on our instructions, so we are the controller
and they are our processor. That relationship **does** require an Art. 28(3)
contract between us and them. It is a controller→processor contract we hold, not
a sub-processing chain we publish.

**Open item:** Rocket Lawyer does not publish a customer-facing DPA at any
discoverable URL — their `/gb/en/` legal paths 404 and the search hits are their
DPA *template product*, which is a document you generate, not their own terms.
It has to be requested through the account. Until we hold one, we are using a
processor without the Art. 28(3) contract the UK GDPR requires. Worth closing.

## What would move one of these onto the published list

Only a change in what the data *is*. If we ever put personal data we hold **as a
processor** — a client's own users, say — into one of these tools, that vendor
becomes a genuine sub-processor and needs a new published list version. The
better answer in almost every case is not to do that: client end-user data does
not belong in a banking app or a contract tool.
