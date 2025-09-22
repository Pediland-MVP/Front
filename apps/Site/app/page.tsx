import {
  HomeCustomers,
  HomeFAQ,
  HomeHero,
  HomeIntroMovie,
  HomeMetaApi,
  HomePricing,
  HomeReturnPolicy,
  HomeScreenRecord,
  HomeSupport,
  HomeFeatures,
} from "@/components";

export default function Home() {
  return (
    <main>
      <HomeHero />

      <HomeScreenRecord />

      <HomeIntroMovie />

      <HomeFeatures />

      <HomeMetaApi />

      <HomeCustomers />

      <HomePricing />

      <HomeReturnPolicy />

      <HomeFAQ />

      <HomeSupport />
    </main>
  );
}
