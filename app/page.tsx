import { allEssays, allProjects } from "content-collections";
import { HeroSection } from "@/components/home/HeroSection";
import { SignalGrid } from "@/components/home/SignalGrid";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { FeaturedWriting } from "@/components/home/FeaturedWriting";
import { CTASection } from "@/components/home/CTASection";
import { StarfieldClient } from "@/components/home/StarfieldClient";

export default function HomePage() {
  const isProduction = process.env.NODE_ENV === "production";
  const visibleEssays = isProduction
    ? allEssays.filter((essay) => essay.status !== "draft")
    : allEssays;

  const sortedEssays = [...visibleEssays].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const featuredPool = sortedEssays.filter((essay) => essay.featured);
  const fallbackPool = sortedEssays.filter((essay) => !essay.featured);
  const featuredEssays = (featuredPool.length
    ? [...featuredPool, ...fallbackPool]
    : sortedEssays
  ).slice(0, 3);

  const featuredProject = [...allProjects].sort((a, b) => {
    if (a.featuredRank !== b.featuredRank) {
      return a.featuredRank - b.featuredRank;
    }
    return a.name.localeCompare(b.name);
  })[0];

  return (
    <>
      <StarfieldClient />

      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="mx-auto w-full max-w-5xl px-4 py-24 sm:py-32">
          <HeroSection />
          <SignalGrid />
          <FeaturedProject project={featuredProject} />
          <FeaturedWriting essays={featuredEssays} />
          <CTASection />
        </div>
      </div>
    </>
  );
}
