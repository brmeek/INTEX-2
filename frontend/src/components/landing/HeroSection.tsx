import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/harbor.jpg";
import { ShieldAlert, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Hope Harbor exterior"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
      </div>

      <div className="relative container pb-20 pt-40 md:pb-28 md:pt-48">
        <div className="max-w-2xl">
          <p className="font-body text-teal-light text-sm tracking-widest uppercase mb-4">
            A 501(c)(3) Nonprofit Organization
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6">
            Every girl deserves
            <br />
            a safe place to heal.
          </h1>
          <p className="font-body text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
            Hope Harbor operates safe homes for survivors of trafficking and
            sexual abuse, providing shelter, counseling, education, and a path
            toward independence.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/donor/login">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-teal-light rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Support Our Work
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/programs">
              <Button
                variant="ghost"
                size="lg"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full font-body h-12 text-base"
              >
                See How We Help
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button
        className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 text-white text-xs font-body font-semibold shadow-elevated hover:bg-red-700 transition-colors"
        onClick={() => {
          window.location.replace("https://google.com");
        }}
        aria-label="Quick exit — immediately leave this site"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        Quick Exit
      </button>
    </section>
  );
};

export default HeroSection;
