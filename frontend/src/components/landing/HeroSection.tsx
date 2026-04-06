import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-sanctuary.jpg";
import { ShieldAlert } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="A warm, peaceful sanctuary living space"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
      </div>

      <div className="relative container py-32 md:py-40">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-body font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm border border-accent/30">
            Coordinated Security & Care
          </span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
            A Sanctuary for{" "}
            <em className="not-italic font-heading italic text-sand">Soft Strength</em>
          </h1>
          <p className="font-body text-lg md:text-xl text-primary-foreground/80 leading-relaxed mb-10 max-w-xl">
            We provide more than just shelter. Hope Harbor is a professionally curated environment where survivors of trafficking find the stability to heal and the resources to thrive.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="lg">
              Give Monthly
            </Button>
            <Button variant="hero-outline" size="lg" className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              Our Mission
            </Button>
          </div>
        </div>
      </div>

      <button
        className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-body font-semibold shadow-elevated hover:bg-destructive/90 transition-colors"
        onClick={() => {
          window.location.href = "https://google.com";
        }}
        aria-label="Quick exit - immediately leave this site"
      >
        <ShieldAlert className="h-4 w-4" />
        Quick Exit
      </button>
    </section>
  );
};

export default HeroSection;
