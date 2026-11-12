import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { IMESSAGE_HREF, SITE, SMS_TOLL_FREE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Messaging program",
  description: `How ${SITE.legalName} uses SMS for ${SITE.name} service messages — opt-in, transfers, and opt-out.`,
};

export default function MessagingProgramPage() {
  return (
    <LegalDoc
      title="Messaging program"
      description={`${SITE.name} is a service of ${SITE.legalName}. We only message you from numbers you already use with us, or when someone you know sends you money.`}
    >
      <LegalSection heading="How you opt in">
        <p id="messaging-opt-in">
          <strong>Chat-first.</strong> You opt in by texting {SITE.legalName} first
          from your own phone number. We do not cold-text strangers. There is no
          web-form checkbox and no verbal or paper sign-up.
        </p>
        <ul>
          <li>
            <strong>SMS (US):</strong> Text the keyword &quot;gm&quot; (or any message)
            to <a href={SMS_TOLL_FREE_HREF}>{SITE.smsTollFreeDisplay}</a> to open a{" "}
            {SITE.name} thread with {SITE.legalName}.
          </li>
          <li>
            <strong>iMessage:</strong>{" "}
            <a href={IMESSAGE_HREF}>Message {SITE.imessagePhoneDisplay}</a> from the
            number you use day to day.
          </li>
          <li>
            <strong>WhatsApp:</strong> Message {SITE.name} on WhatsApp. That program
            is separate from this SMS campaign.
          </li>
        </ul>
        <p>
          <strong>Consent wording:</strong> &quot;You start the conversation from your
          own phone number. {SITE.legalName} sends service texts about your transfers
          and account. Message frequency varies. Message and data rates may apply.
          Reply STOP to opt out. Reply HELP for help.&quot;
        </p>
        <p>
          After you text in, we confirm: &quot;{SITE.legalName}: Thanks for messaging
          us. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to opt
          out, HELP for help.&quot;
        </p>
        <p>
          Ongoing replies in that thread are part of the conversation you started.
          Reply <strong>STOP</strong> on SMS to opt out of further SMS from{" "}
          {SITE.smsTollFreeDisplay}. Reply <strong>HELP</strong> for support, or
          email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="When we message you first">
        <p>
          The only time {SITE.legalName} may text you without a prior message in that
          session is a <strong>transactional transfer notice</strong>:
        </p>
        <ul>
          <li>
            Someone using {SITE.name} sends money to a phone number in their{" "}
            <strong>saved contacts</strong>.
          </li>
          <li>
            We notify the recipient that the transfer is in their account, including
            any time limit before it returns to the sender.
          </li>
        </ul>
        <p>
          Example: &quot;{SITE.legalName}: Alex sent you $50. Details:{" "}
          {SITE.baseUrl}. Reply STOP to opt out, HELP for help.&quot; This completes
          a payment the sender initiated to your number. It is not marketing.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <ul>
          <li>No purchased phone lists.</li>
          <li>No promotional blast SMS unrelated to your {SITE.name} activity.</li>
          <li>
            No waitlist or invite spam. <Link href="/landing">{SITE.name} is live</Link>.
            Start in chat.
          </li>
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
