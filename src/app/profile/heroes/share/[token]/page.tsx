import ProfileHeroSharePageClient from '@/components/profile/ProfileHeroSharePageClient';

type ProfileHeroSharePageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    locale?: string | string[];
  }>;
};

export default async function ProfileHeroSharePage({ params, searchParams }: ProfileHeroSharePageProps) {
  const { token } = await params;
  const { locale } = await searchParams;
  const requestedLocale = Array.isArray(locale) ? locale[0] : locale;
  const localeOverride = requestedLocale === 'ru' || requestedLocale === 'en' ? requestedLocale : undefined;

  return <ProfileHeroSharePageClient token={token} localeOverride={localeOverride} />;
}
