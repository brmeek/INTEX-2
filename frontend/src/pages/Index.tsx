import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import MissionSection from "@/components/landing/MissionSection";
import ImpactSection from "@/components/landing/ImpactSection";
import TransparencySection from "@/components/landing/TransparencySection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <MissionSection />
        <ImpactSection />
        <TransparencySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
