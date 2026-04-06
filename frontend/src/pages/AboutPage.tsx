import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Shield, Heart } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Safety Above All",
    text: "Every decision we make — from technology choices to staffing policies — starts with one question: does this protect the girls in our care?",
  },
  {
    icon: Heart,
    title: "Dignity in Recovery",
    text: "Healing is not linear. We meet each resident where she is and walk alongside her at her own pace, never rushing reintegration.",
  },
  {
    icon: Globe,
    title: "Local Partnership",
    text: "We don't parachute in. We partner with trusted in-country organizations and individuals who understand the culture and context.",
  },
  {
    icon: Users,
    title: "Radical Transparency",
    text: "Donors deserve to know exactly how their money is used. We publish detailed reports and tie contributions to real outcomes.",
  },
];

const timeline = [
  {
    year: "2023",
    title: "The Spark",
    text: "Founders attend a Lighthouse Sanctuary presentation and decide to replicate the model in underserved regions.",
  },
  {
    year: "2024",
    title: "Building the Foundation",
    text: "Hope Harbor incorporates as a 501(c)(3), secures initial funding, and begins partnership conversations in Southeast Asia and Central America.",
  },
  {
    year: "2025",
    title: "First Safe Homes Open",
    text: "Two partner-operated safe homes begin accepting residents, with full case management and counseling infrastructure in place.",
  },
  {
    year: "2026",
    title: "Scaling with Care",
    text: "Expanding to additional regions while deepening services — adding vocational training and reintegration support programs.",
  },
];

const AboutPage = () => {
  return (
    <Layout>
      {/* Header */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              About Hope Harbor
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              We started with a simple conviction.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              No child who escapes trafficking should have to face recovery
              alone. Hope Harbor exists to make sure she doesn't have to.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-8">
              How we got here
            </h2>
            <div className="space-y-5 font-body text-muted-foreground leading-relaxed text-lg">
              <p>
                In early 2023, our founders attended a presentation by
                Lighthouse Sanctuary, a US-based nonprofit that operates safe
                homes for girls who are survivors of sexual abuse and sex
                trafficking in the Philippines. The work was extraordinary — and
                the need was clearly far larger than any single organization
                could meet.
              </p>
              <p>
                Lighthouse Sanctuary generously shared anonymized operational
                data — caseload records, counseling documentation, home
                visitation reports, annual accomplishment templates — to help us
                understand what running this kind of organization actually looks
                like day to day.
              </p>
              <p>
                Armed with that knowledge, we set out to build Hope Harbor: a
                new organization using the same proven model, designed from the
                ground up with modern technology to help limited staff manage
                cases, retain donors, and protect the privacy of everyone
                involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-warm-cream">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Our Values
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
              What guides every decision
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 shadow-soft"
              >
                <v.icon className="h-6 w-6 text-accent mb-4" />
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {v.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Our Journey
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Building something that lasts
            </h2>
          </div>

          <div className="max-w-3xl space-y-0">
            {timeline.map((item, i) => (
              <div key={item.year} className="flex gap-6 md:gap-10">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-accent mt-2 shrink-0" />
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-12">
                  <p className="font-body text-xs font-semibold text-accent tracking-widest uppercase mb-1">
                    {item.year}
                  </p>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="container text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
            Want to be part of this story?
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Whether you give, volunteer, or simply share our mission with
            someone who needs to hear it — you make this work possible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/donate">
              <Button
                size="lg"
                className="bg-navy text-white hover:bg-navy-light rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Support Our Work
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
