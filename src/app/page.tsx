import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import RecentMemories from "@/components/home/RecentMemories";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <RecentMemories />
      </main>
    </>
  );
}
