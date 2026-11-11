import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | Dave Hajdu',
  description: 'The terms for using davehajdu.com.',
};

const link = 'text-[#287BE8] underline underline-offset-2';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="11 November 2026">
      <p>These terms apply to davehajdu.com, run by Dave Hajdu. By using the site you agree to them.</p>

      <LegalSection heading="Using the site">
        <p>
          You are welcome to read, link to and share what is published here. Please do not misuse the site: do not
          try to break it, get into areas that are not public, or submit false or abusive inquiries.
        </p>
      </LegalSection>

      <LegalSection heading="Content">
        <p>
          The articles, talks and other material on this site are mine unless stated otherwise. You may quote them
          with a link back. Please ask before republishing anything in full.
        </p>
        <p>
          The content is general information drawn from my own experience. It is not professional advice for your
          specific situation, and you should not rely on it as such.
        </p>
      </LegalSection>

      <LegalSection heading="Inquiries and bookings">
        <p>
          Sending an inquiry does not create an engagement. Any speaking, workshop or consulting work is covered by
          a separate agreement.
        </p>
      </LegalSection>

      <LegalSection heading="Private area">
        <p>
          Part of the site is a private application for my own use. It is not offered as a service, and access by
          anyone else is not permitted.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The site is provided as is. I try to keep it accurate and available but cannot promise either, and to the
          extent the law allows I am not liable for loss arising from its use. Links to other sites are provided for
          convenience; I am not responsible for their content.
        </p>
      </LegalSection>

      <LegalSection heading="Privacy">
        <p>
          How the site handles personal data is set out in the{' '}
          <Link className={link} href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          These terms may be updated; the current version is always on this page. Questions can be sent through the{' '}
          <Link className={link} href="/schedule-consultation">
            contact form
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
