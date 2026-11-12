import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { SITE, SMS_CONFIRM_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Messaging program",
  description: `How ${SITE.legalName} uses SMS for ${SITE.name} payment and stock confirmations.`,
};

const WELCOME =
  "Basemate, a service of Stablemate Labs Inc: texts when a payment or stock is sent to you, and to finish that send. Message frequency varies. Message and data rates may apply. Reply HELP for help or email support@basemate.app. Reply STOP to opt out. Terms: https://basemate.app/terms Privacy: https://basemate.app/privacy. Reply Y to confirm.";

const ENROLLED =
  "Basemate: You're in. Message frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.";

const STOP =
  "Basemate: You are unsubscribed. No further messages will be sent.";

const HELP =
  "Basemate: For help, email support@basemate.app or visit https://basemate.app/messaging. Reply STOP to unsubscribe.";

export default function MessagingProgramPage() {
  return (
    <LegalDoc
      title="Messaging program"
      description={`${SITE.name} is a service of ${SITE.legalName}. SMS confirms a payment or a stock that was sent to you, and only after you opt in.`}
    >
      <LegalSection heading="How you opt in">
        <p id="messaging-opt-in">
          Text the keyword <strong>CONFIRM</strong> to{" "}
          <a href={SMS_CONFIRM_HREF}>{SITE.imessagePhoneDisplay}</a>. That is the
          only way to opt in to these texts. {SITE.legalName}, operating as{" "}
          {SITE.name}, does not text you before you do this.
        </p>
        <p>When you text CONFIRM, the first reply is only this welcome:</p>
        <p>&quot;{WELCOME}&quot;</p>
        <p>Reply <strong>Y</strong> to that welcome. The next message is:</p>
        <p>&quot;{ENROLLED}&quot;</p>
        <p>
          A payment or stock confirmation is sent only after that reply. If you
          do not have a {SITE.name} account yet, that confirmation includes a
          link on {SITE.baseUrl} to claim it. Message frequency varies with
          those sends. Message and data rates may apply.
        </p>
        <p>
          Reply <strong>STOP</strong> to opt out. Reply <strong>HELP</strong> for
          help, or email{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="Exact replies">
        <p>
          <strong>CONFIRM</strong> receives the welcome above, and nothing else.
        </p>
        <p>
          <strong>Y</strong> receives: &quot;{ENROLLED}&quot;
        </p>
        <p>
          <strong>STOP</strong> receives: &quot;{STOP}&quot;
        </p>
        <p>
          <strong>HELP</strong> receives: &quot;{HELP}&quot;
        </p>
      </LegalSection>

      <LegalSection heading="What the confirmation says">
        <p>If you already have an account:</p>
        <p>&quot;[Name] sent you [amount] with Basemate.&quot;</p>
        <p>If you do not have an account yet, the text adds a claim link:</p>
        <p>
          &quot;Hey! [Name] sent you [amount] with Basemate.{" "}
          {SITE.baseUrl}/wallet/connect Claim within 72 hours or it goes back
          to the sender.&quot;
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <ul>
          <li>No text to a number that has not replied Y.</li>
          <li>No purchased phone lists.</li>
          <li>No promotional SMS.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Policies">
        <p>
          See our <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/terms">Terms</Link>. Questions:{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
