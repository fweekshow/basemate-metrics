import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.legalName} collects, uses, and protects your information when you use ${SITE.name}.`,
};

export default function PrivacyPage() {
  const effective = "November 12, 2026";

  return (
    <LegalDoc
      title="Privacy Policy"
      description={`Effective ${effective}. This policy describes how ${SITE.legalName} ("${SITE.legalName}," "we," "us") handles information when you use ${SITE.name}, our websites, and our messaging services.`}
    >
      <LegalSection heading="Overview">
        <p>
          {SITE.legalName} operates {SITE.name}, a money-in-chat service on Base. We
          collect only what we need to run the product, comply with law, and
          communicate with you about your account and access.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <ul>
          <li>
            <strong>Contact information</strong> — name, email, phone number, and
            country when you message or use {SITE.name} from your phone number.
          </li>
          <li>
            <strong>Messages and transactions</strong> — content you send to {SITE.name}{" "}
            and records of transfers, funding, and related activity needed to
            operate the service.
          </li>
          <li>
            <strong>Device and usage data</strong> — standard logs (IP address,
            browser type, pages visited) to secure and improve our sites.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use information">
        <ul>
          <li>Provide, secure, and improve {SITE.name}.</li>
          <li>Process payments and transfers you request.</li>
          <li>Send service-related email and SMS (see Text messages below).</li>
          <li>Comply with legal and regulatory obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Text messages (SMS) and chat">
        <p>
          See our{" "}
          <a href={`${SITE_URL}/messaging`}>Messaging program</a>. We send SMS from{" "}
          {SITE.imessagePhoneDisplay} only after you text CONFIRM and reply Y.
          Those texts confirm that a payment or a stock was sent to you.
        </p>
        <p>
          <strong>Message frequency varies.</strong> Message and data rates may
          apply. Reply <strong>STOP</strong> to opt out of SMS. Reply{" "}
          <strong>HELP</strong> for help or contact{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. Carriers
          are not liable for delayed or undelivered messages.
        </p>
        <p>
          We do not sell or share your SMS opt-in data or personal information
          with third parties for marketing purposes. Text messaging originator
          opt-in data and consent are shared only with carriers and service
          providers as needed to deliver the messages you requested.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing">
        <p>
          We share information with infrastructure and financial partners when
          required to move money, verify identity, or send messages. We do not sell
          your phone number, and we do not share it for third-party marketing. We
          may disclose information if required by law or to protect users and{" "}
          {SITE.legalName}.
        </p>
      </LegalSection>

      <LegalSection heading="Retention and security">
        <p>
          We retain information as long as needed for the purposes above and as
          required by law. We use reasonable technical and organizational measures
          to protect data; no system is perfectly secure.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <ul>
          <li>Opt out of marketing email via unsubscribe links when we send them.</li>
          <li>Opt out of SMS by replying STOP.</li>
          <li>
            Contact{" "}
            <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> for access
            or deletion requests where applicable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Children">
        <p>{SITE.name} is not directed to children under 18. We do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy. We will post the new effective date on this
          page. Continued use after changes means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          {SITE.legalName} —{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          <br />
          Website: <a href={SITE.baseUrl}>{SITE.baseUrl}</a>
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
