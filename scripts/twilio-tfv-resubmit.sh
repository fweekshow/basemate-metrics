#!/usr/bin/env bash
# Resubmit rejected Twilio toll-free verification HH35e97e0427c6198d41650687c6ebd3e6
set -euo pipefail

TFV_SID="${TFV_SID:-HH35e97e0427c6198d41650687c6ebd3e6}"

if [[ -z "${TWILIO_ACCOUNT_SID:-}" || -z "${TWILIO_AUTH_TOKEN:-}" ]]; then
  echo "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN." >&2
  exit 1
fi

if [[ -z "${OPT_IN_IMAGE_URL:-}" ]]; then
  echo "Set OPT_IN_IMAGE_URL (e.g. https://basemate.app/messaging#messaging-opt-in or screenshot URL)" >&2
  exit 1
fi

MESSAGE_VOLUME="${MESSAGE_VOLUME:-100}"

USE_CASE_SUMMARY='Basemate uses +1 888 971 2164 for service SMS only. Users opt in by texting us first from their own mobile number (see https://basemate.app/messaging). We reply in that SMS thread for send, earn, trade, save, and support. We may also send a transactional message when another Basemate user sends money to the recipient phone from saved contacts—the recipient replies to claim. No purchased lists or marketing blasts. STOP to opt out; HELP for help.'

PRODUCTION_SAMPLE='Hey! Alex sent you 50 USDC with Basemate. Reply here and I'\''ll help you receive it. Claim within 24 hours or it goes back to the sender. Reply STOP to opt out, HELP for help.'

ADDITIONAL_INFO='Inbound opt-in: user texts +1 888 971 2164 to start — https://basemate.app/messaging#messaging-opt-in. Privacy: https://basemate.app/privacy'

curl -sS -X POST "https://messaging.twilio.com/v1/Tollfree/Verifications/${TFV_SID}" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
  --data-urlencode "EditReason=Chat-first opt-in and transactional contact sends; waitlist removed" \
  --data-urlencode "UseCaseCategories=ACCOUNT_NOTIFICATIONS" \
  --data-urlencode "UseCaseCategories=CUSTOMER_CARE" \
  --data-urlencode "UseCaseCategories=DELIVERY_NOTIFICATIONS" \
  --data-urlencode "UseCaseSummary=${USE_CASE_SUMMARY}" \
  --data-urlencode "ProductionMessageSample=${PRODUCTION_SAMPLE}" \
  --data-urlencode "OptInImageUrls=${OPT_IN_IMAGE_URL}" \
  --data-urlencode "OptInType=VIA_TEXT" \
  --data-urlencode "MessageVolume=${MESSAGE_VOLUME}" \
  --data-urlencode "AdditionalInformation=${ADDITIONAL_INFO}" \
  --data-urlencode "PrivacyPolicyUrl=https://basemate.app/privacy" \
  --data-urlencode "TermsAndConditionsUrl=https://basemate.app/terms" \
  --data-urlencode "OptInConfirmationMessage=Basemate: Thanks for messaging us. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help." \
  --data-urlencode "HelpMessageSample=Basemate: Reply STOP to unsubscribe. Help: support@basemate.app or https://basemate.app/messaging" \
  --data-urlencode "OptInKeywords=STOP" \
  --data-urlencode "OptInKeywords=UNSUBSCRIBE" \
  --data-urlencode "OptInKeywords=HELP" \
  --data-urlencode "OptInKeywords=START" \
  | python3 -m json.tool

echo ""
echo "Check status: curl -s -u \$TWILIO_ACCOUNT_SID:\$TWILIO_AUTH_TOKEN https://messaging.twilio.com/v1/Tollfree/Verifications/${TFV_SID} | python3 -m json.tool"
