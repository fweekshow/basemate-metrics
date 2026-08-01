#!/usr/bin/env bash
# Resubmit rejected Twilio toll-free verification HH35e97e0427c6198d41650687c6ebd3e6
set -euo pipefail

TFV_SID="${TFV_SID:-HH35e97e0427c6198d41650687c6ebd3e6}"

if [[ -z "${TWILIO_ACCOUNT_SID:-}" || -z "${TWILIO_AUTH_TOKEN:-}" ]]; then
  echo "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN." >&2
  exit 1
fi

if [[ -z "${OPT_IN_IMAGE_URL:-}" ]]; then
  echo "Set OPT_IN_IMAGE_URL to a public HTTPS screenshot of https://basemate.app/waitlist" >&2
  exit 1
fi

MESSAGE_VOLUME="${MESSAGE_VOLUME:-500}"

USE_CASE_SUMMARY='Basemate uses toll-free +1 888 971 2164 for opt-in service SMS only. Users consent via the waitlist at https://basemate.app/waitlist (web form checkbox before submit). We send waitlist and product-access invites, transactional alerts when another user sends them money (amount, sender, reply-to-claim instructions), and account/funding confirmations for actions they initiated. No purchased lists or cold SMS. Recipients opt out by replying STOP; HELP returns support information.'

PRODUCTION_SAMPLE='Basemate: You'\''re off the waitlist — text us in Messages to get started: https://basemate.app Reply STOP to opt out, HELP for help.'

ADDITIONAL_INFO='Transactional sample: Hey! Alex sent you 50 USDC with Basemate. Reply here and I'\''ll help you receive it. Reply STOP to opt out, HELP for help. Opt-in: https://basemate.app/waitlist#sms-opt-in-consent'

curl -sS -X POST "https://messaging.twilio.com/v1/Tollfree/Verifications/${TFV_SID}" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
  --data-urlencode "EditReason=Added web form SMS opt-in, privacy/terms, and aligned message samples" \
  --data-urlencode "UseCaseCategories=ACCOUNT_NOTIFICATIONS" \
  --data-urlencode "UseCaseCategories=CUSTOMER_CARE" \
  --data-urlencode "UseCaseCategories=DELIVERY_NOTIFICATIONS" \
  --data-urlencode "UseCaseSummary=${USE_CASE_SUMMARY}" \
  --data-urlencode "ProductionMessageSample=${PRODUCTION_SAMPLE}" \
  --data-urlencode "OptInImageUrls=${OPT_IN_IMAGE_URL}" \
  --data-urlencode "OptInType=WEB_FORM" \
  --data-urlencode "MessageVolume=${MESSAGE_VOLUME}" \
  --data-urlencode "AdditionalInformation=${ADDITIONAL_INFO}" \
  --data-urlencode "PrivacyPolicyUrl=https://basemate.app/privacy" \
  --data-urlencode "TermsAndConditionsUrl=https://basemate.app/terms" \
  --data-urlencode "OptInConfirmationMessage=Basemate: You're subscribed to waitlist and product-access SMS. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help." \
  --data-urlencode "HelpMessageSample=Basemate: Reply STOP to unsubscribe. Help: support@basemate.app or https://basemate.app/privacy" \
  --data-urlencode "OptInKeywords=STOP" \
  --data-urlencode "OptInKeywords=UNSUBSCRIBE" \
  --data-urlencode "OptInKeywords=HELP" \
  --data-urlencode "OptInKeywords=START" \
  | python3 -m json.tool

echo ""
echo "Check status: curl -s -u \$TWILIO_ACCOUNT_SID:\$TWILIO_AUTH_TOKEN https://messaging.twilio.com/v1/Tollfree/Verifications/${TFV_SID} | python3 -m json.tool"
