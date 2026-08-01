# Twilio toll-free verification resubmit (Basemate)

Verification SID: `HH35e97e0427c6198d41650687c6ebd3e6`  
Toll-free: `+1 888 971 2164`

## 1. Deploy site changes first

Ship `basemate-metrics` so these URLs are live:

- https://basemate.app/waitlist (SMS checkbox + disclosure, element `#sms-opt-in-consent`)
- https://basemate.app/privacy
- https://basemate.app/terms

## 2. Opt-in screenshot for Twilio

1. Open https://basemate.app/waitlist in a desktop browser (full form visible, checkbox **unchecked** is fine; include checked state in a second image if you want).
2. Capture a screenshot showing: mobile field, **SMS consent checkbox**, disclosure text, and Privacy/Terms links.
3. Upload to a **public HTTPS** URL (e.g. Cloudinary, Vercel `public/`, S3).  
   Set `OPT_IN_IMAGE_URL` to that URL before running the script below.

Optional second image: same page with checkbox checked.

## 3. Resubmit (API)

Requires `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` from your Twilio Console.

```bash
cd basemate-metrics
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export OPT_IN_IMAGE_URL=https://basemate.app/compliance/waitlist-sms-opt-in.png  # your hosted screenshot
./scripts/twilio-tfv-resubmit.sh
```

Or use Twilio Console: **Messaging → Regulatory Compliance → Toll-Free Verification** → open rejected request → Edit → paste fields from `scripts/twilio-tfv-resubmit.sh`.

## 4. Field reference (paste into Console)

| Field | Value |
|-------|--------|
| **EditReason** | Added web form SMS opt-in, privacy/terms, and aligned message samples |
| **UseCaseCategories** | ACCOUNT_NOTIFICATIONS, CUSTOMER_CARE, DELIVERY_NOTIFICATIONS |
| **OptInType** | WEB_FORM |
| **OptInImageUrls** | (your screenshot URL) |
| **PrivacyPolicyUrl** | https://basemate.app/privacy |
| **TermsAndConditionsUrl** | https://basemate.app/terms |
| **MessageVolume** | (honest estimate, e.g. 500 or 1000) |

**UseCaseSummary** (single paragraph):

> Basemate uses toll-free +1 888 971 2164 for opt-in service SMS only. Users consent via the waitlist at https://basemate.app/waitlist (web form checkbox before submit). We send waitlist and product-access invites, transactional alerts when another user sends them money (amount, sender, reply-to-claim instructions), and account/funding confirmations for actions they initiated. No purchased lists or cold SMS. Recipients opt out by replying STOP; HELP returns support information.

**ProductionMessageSample**:

```text
Basemate: You're off the waitlist — text us in Messages to get started: https://basemate.app Reply STOP to opt out, HELP for help.
```

**AdditionalInformation** (optional second sample + opt-in URL):

```text
Transactional sample: Hey! Alex sent you 50 USDC with Basemate. Reply here and I'll help you receive it. Reply STOP to opt out, HELP for help.
Opt-in workflow: https://basemate.app/waitlist#sms-opt-in-consent
```

**OptInConfirmationMessage**:

```text
Basemate: You're subscribed to waitlist and product-access SMS. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.
```

**HelpMessageSample**:

```text
Basemate: Reply STOP to unsubscribe. Help: support@basemate.app or https://basemate.app/privacy
```

**OptInKeywords**: STOP, UNSUBSCRIBE, HELP, START

Resubmit within **7 days** of rejection for prioritized review.
