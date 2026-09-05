import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Benefits } from "@/components/marketing/benefits";
import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Benefits />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
