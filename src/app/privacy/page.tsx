import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy · Basemate",
  description: "How Basemate collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  const effective = "August 1, 2026";

  return (
    <LegalDoc
      title="Privacy Policy"
      description={`Effective ${effective}. This policy describes how ${SITE.name} ("Basemate," "we," "us") handles information when you use our websites and messaging services.`}
    >
      <LegalSection heading="Overview">
        <p>
          Basemate provides money-in-chat services on Base. We collect only what we
          need to run the product, comply with law, and communicate with you about
          your account and access.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <ul>
          <li>
            <strong>Contact information</strong> — name, email, phone number, and
            country when you join our waitlist or use Basemate.
          </li>
          <li>
            <strong>Messages and transactions</strong> — content you send to Basemate
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
          <li>Provide, secure, and improve Basemate.</li>
          <li>Process payments and transfers you request.</li>
          <li>Send service-related email and SMS (see Text messages below).</li>
          <li>Comply with legal and regulatory obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Text messages (SMS)">
        <p>
          If you opt in on our{" "}
          <a href={`${SITE_URL}/waitlist`}>waitlist</a> or otherwise give consent,
          we may send SMS from {SITE.smsTollFreeDisplay} about:
        </p>
        <ul>
          <li>Waitlist status and product-access invites.</li>
          <li>
            Transactional notices (for example, when someone sends you money and
            you need steps to receive it).
          </li>
          <li>Account and funding confirmations tied to actions you take.</li>
        </ul>
        <p>
          <strong>Message frequency varies.</strong> Message and data rates may
          apply. Reply <strong>STOP</strong> to opt out of SMS. Reply{" "}
          <strong>HELP</strong> for help or contact{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. Carriers
          are not liable for delayed or undelivered messages.
        </p>
        <p>
          We do not sell your phone number. We share data with service providers
          (such as messaging carriers) only as needed to deliver the service.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing">
        <p>
          We share information with infrastructure and financial partners when
          required to move money, verify identity, or send messages. We may disclose
          information if required by law or to protect users and Basemate.
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
        <p>Basemate is not directed to children under 18. We do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy. We will post the new effective date on this
          page. Continued use after changes means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          {SITE.name} —{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          <br />
          Website: <a href={SITE.baseUrl}>{SITE.baseUrl}</a>
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
