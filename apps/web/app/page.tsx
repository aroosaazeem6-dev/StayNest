import { Hero } from '@/components/home/Hero';
import { SearchBar } from '@/components/home/SearchBar';
import { FeaturedStays } from '@/components/home/FeaturedStays';
import { FeatureSection } from '@/components/home/FeatureSection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchBar />
      <FeaturedStays />
      <FeatureSection />
    </>
  );
}