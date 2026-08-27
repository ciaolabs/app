import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Privacy Policy · Ciao!",
  description: "How Ciao! collects, uses, and shares personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Ciao! Privacy Policy"
      lastUpdated="2026-05-20"
      effectiveDate="2026-05-20"
      currentPath={routes.privacy}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          This privacy policy (the &ldquo;Policy&rdquo;) describes how Ciao!
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and shares
          personal information of users of the website
          {" "}
          <a href="https://platform.ciaobang.com">https://platform.ciaobang.com</a> (the
          &ldquo;Site&rdquo;) and any associated products and services (collectively, the
          &ldquo;Services&rdquo;). By using the Site or the Services, you accept the
          practices and policies described here and consent to our collection, use, and
          sharing of your personal information as set out below. If you do not agree to
          this Policy, please do not use the Site or the Services.
        </p>
      </section>

      <section>
        <h2>2. Personal Information We Collect</h2>
        <p>We collect personal information about you in a number of different ways.</p>

        <h3>Information you provide when using Ciao!</h3>
        <ul>
          <li>User content, such as your prompts to Ciao! and other content you upload (for example PDFs, images, or text files).</li>
          <li>Feedback you send us about the product.</li>
        </ul>

        <h3>Information collected when you use our Services generally</h3>
        <ul>
          <li>General identifiers, such as your name, email address, and authentication-provider account ID.</li>
          <li>Online identifiers, such as your username, and information automatically collected through cookies or similar technologies — including operating-system type and version, device manufacturer and model, browser type, screen resolution, IP address, the website you visited before reaching the Site, and general location information (city, state, or area).</li>
          <li>Commercial information, such as billing details and payment history if and when you purchase paid features, and your preferences regarding marketing communications.</li>
          <li>Any other information you choose to provide to us.</li>
        </ul>

        <h3>Information we collect automatically</h3>
        <p>
          We automatically log information about you and the device you use to access the
          Site and Services — including device identifier, operating-system type, browser
          type, browser language, the page that referred you, pages you viewed, time spent
          per page, access times, and information about your activity on the Site. How
          much information we collect depends on the type and settings of the device.
        </p>

        <h3>Cookies</h3>
        <p>
          We may log information using cookies. Cookies are small data files stored on
          your device by a website. We may use both session cookies (which expire when you
          close your browser) and persistent cookies (which remain until you delete them)
          to provide a more personal and interactive experience. Other similar tools we
          may use include web-server logs, web beacons, and pixel tags.
        </p>

        <h3>Analytics</h3>
        <p>
          We may use analytics tools to help us understand how users interact with the
          Site and Services. These services drop persistent cookies in your browser so you
          can be recognised as a returning visitor. We use the information only to improve
          the Site and Services.
        </p>
      </section>

      <section>
        <h2>3. How We Use Your Personal Information</h2>
        <p>Generally, we may use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and personalise the Services.</li>
          <li>Verify your identity and respond to your requests.</li>
          <li>Provide customer support.</li>
          <li>Send you information about your account or transactions.</li>
          <li>Send marketing or promotional communications when permitted by law. You may opt out at any time by following the unsubscribe instructions in our emails or by writing to <a href="mailto:info@ciaobang.com">info@ciaobang.com</a>.</li>
          <li>Carry out research and development to improve the Services. As part of this we may create aggregated, de-identified, or anonymous data and share it with third parties for lawful business purposes.</li>
          <li>Comply with applicable laws, lawful requests, and legal process; protect our and others&apos; rights, privacy, safety, and property; enforce our terms; and detect or prevent fraudulent or illegal activity.</li>
        </ul>
        <p>
          <strong>Training of AI models.</strong> We do not use your personal information
          to train AI models.
        </p>
      </section>

      <section>
        <h2>4. How We Share Your Personal Information</h2>
        <p>We may disclose the information described above with the following categories of third parties:</p>

        <h3>Third-party service providers</h3>
        <p>
          We share personal information with vendors that help us deliver the Services and
          operate our business, including:
        </p>
        <ul>
          <li>
            <strong>Vercel.</strong> Hosting, deployment, and content-delivery network. See
            {" "}
            <a href="https://vercel.com/legal/privacy-policy">Vercel&apos;s privacy policy</a>.
          </li>
          <li>
            <strong>OpenAI.</strong> AI and chatbot technology. When you use features
            powered by OpenAI, we send the input necessary for processing your request. See
            {" "}
            <a href="https://openai.com/policies/privacy-policy/">OpenAI&apos;s privacy policy</a>.
          </li>
          <li>
            <strong>Google Gemini.</strong> AI and chatbot technology. See
            {" "}
            <a href="https://policies.google.com/privacy">Google&apos;s privacy policy</a>.
          </li>
          <li>
            <strong>Anthropic Claude.</strong> AI and chatbot technology. See
            {" "}
            <a href="https://www.anthropic.com/legal/privacy">Anthropic&apos;s privacy policy</a>.
          </li>
          <li>
            <strong>OpenRouter.</strong> AI model routing. See
            {" "}
            <a href="https://openrouter.ai/privacy">OpenRouter&apos;s privacy policy</a>.
          </li>
        </ul>

        <h3>Professional advisors</h3>
        <p>We may share your information with our lawyers, accountants, and other outside professional advisors as needed.</p>

        <h3>Other disclosures</h3>
        <p>We may also disclose your personal information if we believe in good faith that doing so is necessary to:</p>
        <ul>
          <li>Comply with applicable law or respond to lawful requests, subpoenas, or warrants.</li>
          <li>Protect or defend the rights, property, or safety of Ciao! or its users.</li>
          <li>Investigate or help prevent any violation or potential violation of the law, this Policy, or our Terms of Service.</li>
        </ul>
        <p><strong>We do not sell your personal information.</strong></p>

        <h3>Third-party websites</h3>
        <p>
          The Site or Services may contain links to third-party websites. We have no
          control over and are not responsible for the content, privacy practices, or
          collection of personal information by those websites.
        </p>
      </section>

      <section>
        <h2>5. Your Choices</h2>
        <p>
          <strong>Email.</strong> You can opt out of marketing communications by clicking
          the unsubscribe link in our emails. We may still send you Service-related
          communications, such as notices about changes to this Policy or our Terms.
        </p>
        <p>
          <strong>Cookies.</strong> You can configure your browser to refuse or warn you
          about cookies. If you reject cookies, parts of the Site may not function
          correctly.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We use a range of security technologies and procedures to help protect your
          personal information from unauthorised access, use, or disclosure. No method of
          transmission over the internet or electronic storage is fully secure, so while
          we take reasonable measures we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>
          The Site and Services are not intended for children under 13 years of age. You
          must be at least 13 to use the Services. We do not knowingly collect or use
          personal information from children under 13. If you believe we have done so,
          please contact us so we can take appropriate action.
        </p>
      </section>

      <section>
        <h2>8. Do Not Track</h2>
        <p>
          We currently do not support the &ldquo;Do Not Track&rdquo; browser setting and
          do not respond to Do Not Track signals.
        </p>
      </section>

      <section>
        <h2>9. Updates to this Privacy Policy</h2>
        <p>
          We reserve the right to change this Privacy Policy at any time. If we make
          material changes we will post the revised version and update the &ldquo;Last
          Updated&rdquo; date at the top of the page. Changes become effective when the
          revised Policy is posted, unless we indicate otherwise.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          For any question about this Policy, please contact us at{" "}
          <a href="mailto:info@ciaobang.com">info@ciaobang.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
