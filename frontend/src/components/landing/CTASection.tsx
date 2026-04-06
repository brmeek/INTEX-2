import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="bg-navy rounded-3xl p-10 md:p-16 text-center shadow-elevated">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Become a Harbor Keeper
          </h2>
          <p className="font-body text-primary-foreground/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Monthly contributions provide the predictable funding necessary to keep our doors open and our services free for survivors 365 days a year.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" className="bg-primary-foreground text-navy hover:bg-primary-foreground/90">
              Give Monthly
            </Button>
            <Button variant="cta-outline" size="lg" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              One-time Gift
            </Button>
          </div>
          <p className="font-body text-xs text-primary-foreground/50 mt-6">
            Your donation is 100% tax-deductible.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
