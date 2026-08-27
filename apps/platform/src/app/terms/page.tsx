import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Terms of Service · Ciao!",
  description: "Terms governing the use of Ciao!.",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Ciao! Terms of Service"
      lastUpdated="2026-05-20"
      currentPath={routes.terms}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Ciao!. Your use of our services, including the services we
          make available through this website and all related websites, mobile sites,
          data files, visualisations and applications which link to these terms of
          service (the &ldquo;Site&rdquo;), and all software or services offered by us in
          connection with any of those (collectively, the &ldquo;Services&rdquo;), is
          governed by these terms of service (the &ldquo;Terms&rdquo;). Please read them
          carefully before using the Services. In these Terms, &ldquo;we&rdquo;,
          &ldquo;our&rdquo;, &ldquo;us&rdquo;, and &ldquo;Ciao!&rdquo; refer to the
          providers and operators of the Services.
        </p>
        <p>
          To use the Services, you must first agree to these Terms. If you are using the
          Services on behalf of an organisation, you are agreeing on behalf of that
          organisation and promising that you have the authority to bind it.
        </p>
        <p>
          You must be at least 13 years of age to use the Services. If you are over 13
          but not yet of the legal age to form a binding contract in your jurisdiction
          (in many jurisdictions, 18), you must obtain your parent or guardian&apos;s
          consent before using the Services.
        </p>
        <p>
          You agree that your purchases and use of the Services are not contingent on the
          delivery of any future functionality or features.
        </p>
        <p>
          <strong>By using, downloading, installing, or otherwise accessing the Services
          or any materials included with the Services, you agree to be bound by these
          Terms.</strong> If you do not accept them, you may not use the Services.
        </p>
        <p>
          Certain features of the Services may be subject to additional guidelines,
          terms, or rules, which will be posted in connection with those features. Where
          such terms conflict with these Terms, the additional terms govern only with
          respect to those features.
        </p>
      </section>

      <section>
        <h2>2. Accounts</h2>
        <p>
          You must register an account (a &ldquo;Customer Account&rdquo;) to use the
          Services. You agree to provide accurate and complete information and to keep it
          up to date. Your Customer Account is for your personal use; you may not
          authorise others to use it. You are responsible for keeping your credentials
          confidential and for all activity that occurs under your account. Notify us
          immediately if you learn of any unauthorised access or other suspected security
          breach.
        </p>
      </section>

      <section>
        <h2>3. Content</h2>
        <p>
          The Services allow you to upload, create, transmit, share, publish, or display
          information — including text, files, images, audio, and other content
          (collectively, &ldquo;User Content&rdquo;).
        </p>
        <p>
          You are solely responsible for your User Content and assume all associated
          risks, including any intellectual-property or other legal claims. By storing
          User Content with Ciao!, you represent that you have all rights necessary
          to do so and that doing so does not violate any third-party rights, licences,
          applicable law, or these Terms.
        </p>
        <p>
          You agree to remove any User Content that violates these Terms immediately,
          including upon our request. Ciao! does not actively monitor User Content,
          but we reserve the right, at our sole discretion, to review and remove User
          Content and/or suspend your account if we become aware of misuse or unlawful
          activity (for example, copyright infringement or distribution of malware). We
          assume no liability for any User Content. Deleted User Content may be
          irretrievable.
        </p>
        <p>
          Information and materials made available through the Services by us or our
          suppliers (&ldquo;Ciao!-Supplied Content&rdquo;) are provided as-is. While
          we aim to keep this content accurate and up to date, we cannot guarantee its
          accuracy, completeness, or timeliness.
        </p>
      </section>

      <section>
        <h2>4. Proprietary Rights</h2>
        <p>
          By submitting User Content through the Services you grant Ciao! a
          worldwide, royalty-free, non-exclusive licence to reproduce, adapt, modify,
          translate, publish, publicly perform, publicly display, and distribute such
          User Content for the purpose of providing the Services to you.
        </p>
        <p>
          Other than the rights granted above, Ciao! obtains no right, title, or
          interest in or to your User Content. You are responsible for protecting and
          enforcing your rights in it.
        </p>
        <p>
          You acknowledge that Ciao! (and its licensors) own all legal right, title,
          and interest in and to the Services and Ciao!-Supplied Content, which are
          protected by copyright, trademark, patent, and other proprietary rights and
          laws. Nothing in these Terms authorises you to use any Ciao! trademark,
          logo, domain name, or other distinctive brand feature except as permitted by
          law.
        </p>
      </section>

      <section>
        <h2>5. Licence and Restrictions on Use</h2>
        <p>
          Ciao! grants you a personal, worldwide, royalty-free, non-assignable, and
          non-exclusive licence to use the Services solely as permitted by these Terms.
        </p>
        <p>You may not (and you may not permit anyone else to):</p>
        <ul>
          <li>Copy, modify, create derivative works of, reverse-engineer, decompile, or otherwise attempt to extract the source code of the Services or any part of them.</li>
          <li>Attempt to disable or circumvent any security mechanism used by the Services.</li>
          <li>Interfere with or disrupt the Services or the servers and networks connected to them.</li>
          <li>Rent, lease, sublicense, or provide access to the Services to a third party, or use the Services on behalf of or to provide services to third parties.</li>
          <li>Access the Services in a way intended to avoid incurring fees or exceeding usage limits.</li>
          <li>Access the Services to bring an intellectual-property claim against us or to create a competing product.</li>
          <li>Use robots, spiders, scrapers, or any other automated means to retrieve, index, or gather content from the Services.</li>
        </ul>
        <p>You also agree not to upload, transmit, or distribute User Content, or otherwise use the Services, in a way that:</p>
        <ul>
          <li>Advocates, promotes, incites, instructs, or otherwise encourages violence or illegal activity.</li>
          <li>Infringes the copyright, patent, trademark, trade secret, or other intellectual-property or privacy rights of any third party.</li>
          <li>Attempts to mislead others about your identity or the origin of a message, or is otherwise materially false, misleading, or inaccurate.</li>
          <li>Is inappropriate, harassing, abusive, profane, hateful, defamatory, threatening, obscene, vulgar, pornographic, or otherwise objectionable or unlawful.</li>
          <li>Is harmful to minors.</li>
          <li>Contains malware, viruses, or any other code that may damage or interfere with any system, data, or property.</li>
          <li>Violates any law, statute, ordinance, or regulation, including export controls, anti-discrimination, or false-advertising laws.</li>
        </ul>
        <p>
          You may not use the Services if you are a person barred from receiving them
          under applicable law in your country of residence or use. You affirm that you
          are over the age of 13.
        </p>
      </section>

      <section>
        <h2>6. Pricing</h2>
        <p>
          Subject to these Terms, the Services are provided without charge up to certain
          usage limits. Usage in excess of those limits may require the purchase of
          additional resources and the payment of fees. Details of any paid plans are
          available within the Services.
        </p>
      </section>

      <section>
        <h2>7. Right of Withdrawal (EU Consumers)</h2>
        <p>
          If you are a consumer located in the European Union, you have the right to
          withdraw from a paid contract within 14 days without giving any reason.
          However, by purchasing and using the Services, you expressly acknowledge that
          the Services consist of digital content not supplied on a tangible medium, and
          you expressly consent to the immediate performance of the contract and
          acknowledge that you lose your right of withdrawal once performance has been
          fully carried out.
        </p>
      </section>

      <section>
        <h2>8. Privacy</h2>
        <p>
          The Services are provided in accordance with our{" "}
          <a href={routes.privacy}>Privacy Policy</a>. You agree that your User Content and
          personal information will be used in accordance with these Terms and that
          Policy.
        </p>
        <p>
          You agree to protect the privacy and legal rights of any other end users
          involved in the creation of your User Content. Where your User Content or use
          of the Services requires compliance with specialised data-privacy laws (for
          example, FERPA, COPPA, or HIPAA), you are solely responsible for that
          compliance.
        </p>
      </section>

      <section>
        <h2>9. Modification and Termination of Services</h2>
        <p>
          We are continually improving the Services. The form and nature of the Services
          may change from time to time without prior notice, subject to our Privacy
          Policy. Examples include changes to fees, security patches, added
          functionality, automatic updates, and other enhancements. New features will be
          subject to these Terms unless stated otherwise.
        </p>
        <p>
          You may terminate these Terms at any time by closing your account. You will not
          receive any refund if you cancel your account.
        </p>
        <p>
          We may, at our sole discretion and for any or no reason, terminate your account
          or any part of it. Termination may occur without prior notice, and we will not
          be liable to you or any third party for such termination.
        </p>
        <p>
          You are solely responsible for exporting your User Content before termination.
          If we terminate your account for our convenience, we will endeavour to provide
          you with a reasonable opportunity to retrieve your User Content.
        </p>
        <p>
          Upon termination, the provisions of these Terms which by their nature should
          survive termination will do so — including ownership provisions, warranty
          disclaimers, and limitations of liability.
        </p>
      </section>

      <section>
        <h2>10. Beta Services</h2>
        <p>
          We may release products or features that are still being tested
          (&ldquo;Beta Services&rdquo;), labelled &ldquo;alpha&rdquo;, &ldquo;beta&rdquo;,
          &ldquo;preview&rdquo;, &ldquo;early access&rdquo;, &ldquo;evaluation&rdquo;, or
          similar. Beta Services may not be as reliable as the rest of the Services and
          may contain errors. Use of any Beta Service is voluntary and at your own risk.
          We may use feedback you provide about a Beta Service to improve our Services.
        </p>
      </section>

      <section>
        <h2>11. Changes to the Terms</h2>
        <p>
          These Terms may be amended from time to time without notice. It is your
          responsibility to review them periodically. By continuing to access or use the
          Services after revisions take effect, you agree to be bound by the revised
          Terms. If you do not agree to the new Terms, please stop using the Services.
        </p>
      </section>

      <section>
        <h2>12. Disclaimer of Warranty</h2>
        <p>
          YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE SERVICES IS AT YOUR
          SOLE RISK AND THAT THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE&rdquo;.
        </p>
        <p>
          CIAO! CHAT AND ITS LICENSORS MAKE NO EXPRESS WARRANTIES AND DISCLAIM ALL
          IMPLIED WARRANTIES REGARDING THE SERVICES, INCLUDING IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          WITHOUT LIMITING THE GENERALITY OF THE FOREGOING, WE DO NOT REPRESENT OR
          WARRANT THAT: (A) YOUR USE OF THE SERVICES WILL MEET YOUR REQUIREMENTS;
          (B) YOUR USE OF THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR
          ERROR-FREE; OR (C) USAGE DATA PROVIDED THROUGH THE SERVICES WILL BE ACCURATE.
        </p>
        <p>
          NOTHING IN THESE TERMS SHALL EXCLUDE OR LIMIT OUR WARRANTY OR LIABILITY FOR
          LOSSES THAT MAY NOT BE LAWFULLY EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
        </p>
      </section>

      <section>
        <h2>13. Limitation of Liability</h2>
        <p>
          SUBJECT TO SECTION 12, CIAO! CHAT AND ITS LICENSORS SHALL NOT BE LIABLE TO YOU
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES,
          HOWEVER CAUSED AND UNDER ANY THEORY OF LIABILITY. THIS INCLUDES, WITHOUT
          LIMITATION, ANY LOSS OF PROFIT, GOODWILL, OR REPUTATION; ANY LOSS OF DATA; THE
          COST OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; OR ANY INTANGIBLE LOSS.
          THESE LIMITATIONS APPLY EVEN IF AN ESSENTIAL PURPOSE OF ANY LIMITED REMEDY
          FAILS.
        </p>
        <p>
          SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY FOR
          INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATION MAY NOT APPLY TO
          YOU. WHERE PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES,
          LOSSES, AND CAUSES OF ACTION SHALL NOT EXCEED THE AMOUNT YOU HAVE ACTUALLY PAID
          FOR THE SERVICES IN THE PAST TWELVE MONTHS, OR ONE HUNDRED EUROS, WHICHEVER IS
          GREATER.
        </p>
      </section>

      <section>
        <h2>14. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Ciao! and its officers, agents,
          employees, advertisers, licensors, suppliers, and partners from any third-party
          claim arising from or in any way related to: (a) your breach of these Terms;
          (b) your use of the Services; (c) your violation of any applicable law in
          connection with the Services; or (d) your User Content — including all
          liability or expense arising from claims, losses, damages (actual and
          consequential), suits, judgments, litigation costs, and attorneys&apos; fees.
        </p>
      </section>

      <section>
        <h2>15. Copyright Policy</h2>
        <p>
          We respect the intellectual-property rights of others and expect users to do
          the same. If you believe content on the Services infringes your copyright,
          please send a notice to{" "}
          <a href="mailto:legal@ciaobang.com">legal@ciaobang.com</a> containing:
        </p>
        <ul>
          <li>An identification of the copyrighted work you claim has been infringed.</li>
          <li>An identification of the material you claim is infringing, including the URL or location.</li>
          <li>Your contact information.</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorised by the copyright owner, its agent, or the law.</li>
          <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the owner, or authorised to act on behalf of the owner, of the right alleged to be infringed.</li>
          <li>Your full legal name and your electronic or physical signature.</li>
        </ul>
      </section>

      <section>
        <h2>16. Third-Party Content and Materials</h2>
        <p>
          You may be able to access or use third-party websites, resources, content,
          communications, or information (&ldquo;Third-Party Materials&rdquo;) via the
          Services. You alone are responsible for, and assume all risk arising from, your
          access to or reliance on any Third-Party Materials. Ciao! is not
          responsible for their availability or accuracy and has no liability for any
          harm resulting from your use of them.
        </p>
      </section>

      <section>
        <h2>17. Third-Party Software</h2>
        <p>
          The Services may incorporate third-party software, which is licensed under the
          terms of the relevant third-party licence. Nothing in these Terms supersedes
          those licences.
        </p>
      </section>

      <section>
        <h2>18. Feedback</h2>
        <p>
          If you submit comments or ideas about the Services, you agree that your
          disclosure is gratuitous, unsolicited, and without restriction, and that we
          are free to use it without any obligation or compensation to you.
        </p>
      </section>

      <section>
        <h2>19. Miscellaneous</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire agreement
          between you and Ciao! relating to the Services. These Terms may be modified
          only in writing or by us posting an updated version. If any part of these Terms
          is held to be unlawful, void, or unenforceable, that part will be severed and
          the remaining provisions will continue in effect. Our failure to enforce any
          right or provision will not constitute a waiver. You may not assign these Terms
          or any rights granted under them without our prior written consent.
        </p>
      </section>

      <section>
        <h2>20. Contact</h2>
        <p>
          If you have any question about these Terms, please contact us at{" "}
          <a href="mailto:legal@ciaobang.com">legal@ciaobang.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
