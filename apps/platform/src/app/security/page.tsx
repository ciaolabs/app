import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Security Policy · Ciao!",
  description: "Security practices and responsible-disclosure program for Ciao!.",
};

export default function SecurityPolicyPage() {
  return (
    <LegalLayout
      title="Ciao! Security Policy"
      lastUpdated="2026-05-20"
      currentPath={routes.security}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          Ciao! is committed to protecting the security of our users&apos; data and of
          our platform. This Security Policy describes the practices and procedures we
          follow to keep the Services secure.
        </p>
      </section>

      <section>
        <h2>2. Reporting Security Issues</h2>
        <p>
          We welcome security researchers, ethical hackers, and other members of the
          community to participate in our responsible-disclosure program. We provide safe
          harbour for testing carried out in good faith, and we may recognise valuable
          reports based on severity and impact.
        </p>
        <p>
          If you discover a vulnerability, please report it to{" "}
          <a href="mailto:security@ciaobang.com">security@ciaobang.com</a> and include:
        </p>
        <ul>
          <li>A detailed description of the vulnerability.</li>
          <li>Clear steps to reproduce the issue.</li>
          <li>Any relevant screenshots, logs, or proof-of-concept code.</li>
          <li>A potential impact assessment.</li>
          <li>Your contact information so we can follow up.</li>
        </ul>
        <p>We commit to:</p>
        <ul>
          <li>Acknowledging receipt of your report within 1 business day.</li>
          <li>Working with you to validate and resolve the issue.</li>
          <li>Crediting you for your discovery if you wish to be named.</li>
        </ul>
        <p>
          We value the contributions of the security community in keeping Ciao!
          safe. Every legitimate report is investigated and addressed with appropriate
          urgency.
        </p>
      </section>

      <section>
        <h2>3. Our Security Practices</h2>

        <h3>3.1 Data Protection</h3>
        <ul>
          <li>All data is encrypted in transit using TLS.</li>
          <li>We follow data-minimisation principles and collect only essential user information.</li>
          <li>User data is stored with appropriate access controls.</li>
        </ul>

        <h3>3.2 Authentication</h3>
        <ul>
          <li>Industry-standard authentication protocols.</li>
          <li>Support for multi-factor authentication via your identity provider.</li>
          <li>Secure session management.</li>
        </ul>

        <h3>3.3 Infrastructure</h3>
        <ul>
          <li>Regular security audits and assessments.</li>
          <li>Routine security updates and patching.</li>
          <li>Monitoring for suspicious activity.</li>
        </ul>
      </section>

      <section>
        <h2>4. User Responsibilities</h2>
        <p>To help keep your account secure, you should:</p>
        <ul>
          <li>Use trusted authentication providers.</li>
          <li>Protect your provider account with a strong password and two-factor authentication.</li>
          <li>Never share access to your authenticated Ciao! sessions.</li>
          <li>Report any suspicious activity immediately.</li>
        </ul>
      </section>

      <section>
        <h2>5. Updates to this Policy</h2>
        <p>
          We may update this Security Policy from time to time. When we do, we will
          revise the &ldquo;Last Updated&rdquo; date at the top of this page.
        </p>
      </section>

      <section>
        <h2>6. Contact</h2>
        <p>
          Security reports:{" "}
          <a href="mailto:security@ciaobang.com">security@ciaobang.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
