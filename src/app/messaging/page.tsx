import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { IMESSAGE_HREF, SITE, SMS_TOLL_FREE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Messaging program · Stablemate",
  description:
    "How Stablemate uses SMS and chat for service messages — opt-in, transfers, and opt-out.",
};

export default function MessagingProgramPage() {
  return (
    <LegalDoc
      title="Messaging program"
      description="Stablemate is live in chat. We only message you from numbers you already use with us, or when someone you know sends you money."
    >
      <LegalSection heading="How you opt in">
        <p id="messaging-opt-in">
          <strong>Chat-first.</strong> You start the conversation from your own phone
          number — we do not cold-text strangers.
        </p>
        <ul>
          <li>
            <strong>iMessage / SMS (US):</strong>{" "}
            <a href={IMESSAGE_HREF}>Message {SITE.imessagePhoneDisplay}</a> or text{" "}
            <a href={SMS_TOLL_FREE_HREF}>{SITE.smsTollFreeDisplay}</a> (e.g. &quot;gm&quot;)
            to open a thread with Stablemate.
          </li>
          <li>
            <strong>WhatsApp:</strong> Message Stablemate on WhatsApp from the number
            you use day to day. Same agent — send, receive, and claim transfers in
            the thread you opened.
          </li>
        </ul>
        <p>
          Ongoing replies and service messages in that thread are part of the
          conversation you started. Reply <strong>STOP</strong> on SMS to opt out of
          further SMS from {SITE.smsTollFreeDisplay}. Reply <strong>HELP</strong> for
          support.
        </p>
      </LegalSection>

      <LegalSection heading="When we message you first">
        <p>
          The only time Stablemate may text you without a prior message in that session
          is a <strong>transactional transfer notice</strong>:
        </p>
        <ul>
          <li>
            Someone on Stablemate sends money to a phone number in their{" "}
            <strong>saved contacts</strong>.
          </li>
          <li>
            We notify the recipient that funds are waiting and how to reply to{" "}
            <strong>claim</strong> them (including any time limit before return to
            sender).
          </li>
        </ul>
        <p>
          Example: &quot;Hey! Alex sent you 50 USDC with Stablemate. Reply here and
          I&apos;ll help you receive it.&quot; This is not marketing; it completes a
          payment the sender initiated to your number.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <ul>
          <li>No purchased phone lists.</li>
          <li>No promotional blast SMS unrelated to your Stablemate activity.</li>
          <li>
            No waitlist or invite spam —{" "}
            <Link href="/landing">Stablemate is live</Link>; start in chat.
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
