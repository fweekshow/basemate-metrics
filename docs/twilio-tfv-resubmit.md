# Twilio toll-free verification resubmit (Basemate)

Verification SID: `HH35e97e0427c6198d41650687c6ebd3e6`  
Toll-free SMS: `+1 888 971 2164`

Basemate is **live**. There is no waitlist. Consent is **chat-first** (user texts from their number) plus **transactional** transfer notices to saved contacts.

## Proof of consent (Twilio Console)

| Field | Value |
|--------|--------|
| **Opt-in type** | **Via text** |
| **Proof URL** | `https://basemate.app/messaging#messaging-opt-in` |
| **Alt proof** | Screenshot of https://basemate.app/landing#start (Text / SMS CTAs) |

WhatsApp money-send uses **Meta WhatsApp Business** (separate from this Twilio TFV). This verification covers **US toll-free SMS** only.

## Use case description (paste)

```text
Basemate uses +1 888 971 2164 for service SMS only. Users opt in by texting us first from their own mobile number (see https://basemate.app/messaging). We reply in that SMS thread for send, earn, trade, save, and support. We may also send a transactional message when another Basemate user sends money to the recipient's phone number from their saved contacts—the recipient replies to claim funds. No purchased lists, no marketing blasts, no waitlist. Message frequency varies. STOP to opt out; HELP for help.
```

## Categories

Account Notifications, Customer Care, Delivery Notifications

## Sample message (primary)

```text
Hey! Alex sent you 50 USDC with Basemate. Reply here and I'll help you receive it. Claim within 24 hours or it goes back to the sender. Reply STOP to opt out, HELP for help.
```

## Additional information

```text
Inbound opt-in: user texts +1 888 971 2164 (or our iMessage line) to start; documented at https://basemate.app/messaging. Service reply example: "Got it — I can help you send USDC to a contact. Who should receive it?"
Privacy: https://basemate.app/privacy | Terms: https://basemate.app/terms
```

## Opt-in confirmation / help

**Confirmation (after user texts first):**  
`Basemate: Thanks for messaging us. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`

**Help:**  
`Basemate: Reply STOP to unsubscribe. Help: support@basemate.app or https://basemate.app/messaging`

## API resubmit

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export OPT_IN_IMAGE_URL='https://basemate.app/messaging#messaging-opt-in'
./scripts/twilio-tfv-resubmit.sh
```

Resubmit within **7 days** of rejection for prioritized review.
