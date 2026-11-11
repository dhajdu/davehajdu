import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dave Hajdu',
  description: 'What davehajdu.com collects, why, and how to ask for it to be removed.',
};

const link = 'text-[#287BE8] underline underline-offset-2';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11 November 2026">
      <p>
        This site is run by Dave Hajdu. This page explains what the site collects, what it is used for and how to
        have it removed. It covers davehajdu.com and the private tools hosted on it.
      </p>

      <LegalSection heading="What you send me">
        <p>
          When you fill in an inquiry or consultation form, the site stores what you enter: your name, email address
          and the details of your request. I use it to reply to you and to follow up on that request. I do not sell
          it or pass it to anyone for their own marketing.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics">
        <p>
          The site uses Umami and Vercel Analytics to count page views. Both are cookie-free and do not identify
          individual visitors. They record things like the page visited, the referring site, and the browser,
          device type and country.
        </p>
      </LegalSection>

      <LegalSection heading="The private area and Google data">
        <p>
          Part of this site is a private application that only I can sign in to. It connects to my own accounts,
          including Google Photos, Gmail and Whoop, to keep a personal record. No visitor data is involved.
        </p>
        <p>
          For Google Photos, the application uses the Google Photos Picker. It can see only the photos I select in
          Google&apos;s own picker, copies those into private storage that only I can access, and uses them for no
          other purpose. It does not read the rest of the library, and it does not share Google user data with
          anyone or use it for advertising or to train AI models. Its use of information received from Google APIs
          follows the{' '}
          <a className={link} href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Access can be removed at any time from the Google Account
          permissions page, and the copied photos can be deleted in the application.
        </p>
      </LegalSection>

      <LegalSection heading="Where it is kept">
        <p>
          The site is hosted on Vercel and its data is stored with Supabase. These providers process data on my
          behalf to run the site.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can ask for a copy of what you sent me, or ask me to correct or delete it, through the{' '}
          <Link className={link} href="/schedule-consultation">
            contact form
          </Link>
          . I will act on it promptly.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>If this policy changes, the new version will be posted here with a new date.</p>
      </LegalSection>
    </LegalPage>
  );
}
