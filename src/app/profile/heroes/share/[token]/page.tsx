import ProfileHeroSharePageClient from '@/components/profile/ProfileHeroSharePageClient';

type ProfileHeroSharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ProfileHeroSharePage({ params }: ProfileHeroSharePageProps) {
  const { token } = await params;
  return <ProfileHeroSharePageClient token={token} />;
}
