import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service · Basemate",
  description: "Terms for using Basemate websites and messaging services.",
};

export default function TermsPage() {
  const effective = "August 1, 2026";

  return (
    <LegalDoc
      title="Terms of Service"
      description={`Effective ${effective}. By using ${SITE.baseUrl} or messaging Basemate, you agree to these terms.`}
    >
      <LegalSection heading="The service">
        <p>
          Basemate helps you send, receive, earn, trade, and save using conversational
          interfaces and blockchain settlement on Base. Features vary by region,
          carrier, and product stage. We may change or discontinue features with
          notice where reasonable.
        </p>
      </LegalSection>

      <LegalSection heading="Eligibility">
        <p>
          You must be at least 18 and able to enter a binding contract. You are
          responsible for accurate information you provide and for activity on your
          account.
        </p>
      </LegalSection>

      <LegalSection heading="Financial services">
        <p>
          Moving money may involve regulated partners (payment, banking, or on/off-ramp
          providers). Their terms apply to those flows. Digital assets can lose value;
          you are responsible for tax and legal obligations in your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not use Basemate for fraud, money laundering, sanctions evasion, spam,
          or harassment. We may suspend access that risks users, partners, or
          compliance.
        </p>
      </LegalSection>

      <LegalSection heading="Text messaging program">
        <p>
          When you opt in on our{" "}
          <a href={`${SITE_URL}/waitlist`}>waitlist</a> (or as otherwise disclosed),
          you agree to receive automated SMS from {SITE.smsTollFreeDisplay} about
          waitlist access, product invites, and related service notices.
        </p>
        <ul>
          <li>
            <strong>Consent.</strong> Joining the waitlist requires checking the SMS
            opt-in box on the form; we only text numbers that opted in there (or as
            otherwise disclosed for transactional service messages).
          </li>
          <li>
            <strong>Frequency</strong> varies. <strong>Msg &amp; data rates</strong>{" "}
            may apply.
          </li>
          <li>
            Reply <strong>STOP</strong> to cancel SMS. Reply <strong>HELP</strong> for
            help or email{" "}
            <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
          </li>
        </ul>
        <p>
          See our <a href={`${SITE_URL}/privacy`}>Privacy Policy</a> for how we handle
          phone numbers and message data.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers">
        <p>
          Basemate is provided &quot;as is&quot; without warranties of uninterrupted
          or error-free operation. We are not responsible for carrier or third-party
          failures outside our reasonable control.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Basemate and its affiliates are not
          liable for indirect, incidental, or consequential damages. Our total
          liability for any claim relating to the service is limited to the greater
          of amounts you paid us for the service in the twelve months before the
          claim or one hundred U.S. dollars.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of the State of Delaware, USA, without
          regard to conflict-of-law rules, except where mandatory consumer protection
          law applies in your country of residence.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          {SITE.name} —{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
