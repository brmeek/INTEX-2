import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDonorPortalPath } from "@/lib/portalRoutes";

const CTASection = () => {
  const { authSession } = useAuth();
  const donorPortalPath = getDonorPortalPath(authSession);

  return (
    <section className="py-24 md:py-32 bg-warm-cream dark:bg-background">
      <div className="container text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
          She can't wait.
          <br />
          <span className="text-accent">Neither should we.</span>
        </h2>
        <p className="font-body text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
          A monthly gift of any size helps us keep safe-home beds available for
          the next girl who needs one. Predictable funding means we can plan
          ahead instead of reacting to emergencies.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={donorPortalPath}>
            <Button
              size="lg"
              className="bg-navy text-white hover:bg-navy-light rounded-full font-body font-semibold px-8 h-12 text-base"
            >
              Give Monthly
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link to={donorPortalPath}>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-body font-semibold px-8 h-12 text-base"
            >
              One-Time Gift
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
