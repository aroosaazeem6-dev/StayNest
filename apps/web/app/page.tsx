'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';
import { Hero } from '@/components/home/Hero';
import { SearchBar } from '@/components/home/SearchBar';
import { FeaturedStays } from '@/components/home/FeaturedStays';
import { HowItWorks } from '@/components/home/HowItWorks';
import { HostCTA } from '@/components/home/HostCTA';
import { FeatureSection } from '@/components/home/FeatureSection';

function roleHomePath(role: UserRole | undefined): string {
  switch (role) {
    case UserRole.HOST:
      return '/host';
    case UserRole.ADMIN:
      return '/admin';
    default:
      return '/dashboard';
  }
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(roleHomePath(user.role));
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-sage-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage-200 border-t-forest-900" />
          <span className="text-sm">Redirecting…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <SearchBar />
      <FeaturedStays />
      <HowItWorks />
      <HostCTA />
      <FeatureSection />
    </>
  );
}
