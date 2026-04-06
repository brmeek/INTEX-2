import Layout from "@/components/Layout";
import HeroSection from "@/components/landing/HeroSection";
import MissionSection from "@/components/landing/MissionSection";
import ProgramsPreview from "@/components/landing/ProgramsPreview";
import ImpactSection from "@/components/landing/ImpactSection";
import TransparencySection from "@/components/landing/TransparencySection";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <MissionSection />
      <ProgramsPreview />
      <ImpactSection />
      <TransparencySection />
      <CTASection />
    </Layout>
  );
};

export default Index;
