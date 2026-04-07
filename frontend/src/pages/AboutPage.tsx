import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe,
  Users,
  Shield,
  Heart,
  Home,
  HeartPulse,
  BookOpen,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Safety Above All",
    text: "Every decision we make starts with one question: does this protect the girls in our care?",
  },
  {
    icon: Heart,
    title: "Dignity in Recovery",
    text: "Healing is not linear. We meet each resident where she is and walk alongside her at her own pace.",
  },
  {
    icon: Globe,
    title: "Local Partnership",
    text: "We partner with trusted in-country organizations and individuals who understand the culture and context.",
  },
  {
    icon: Users,
    title: "Radical Transparency",
    text: "Donors deserve to know exactly how their money is used and what outcomes it makes possible.",
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
    text: "Expansion continues carefully, adding vocational training and reintegration support programs.",
  },
];

const programs = [
  {
    icon: Home,
    title: "Safe Homes",
    text: "Small, family-style residences give each girl a secure place to rest, recover, and be known by name.",
    points: [
      "24/7 on-site supervision",
      "Nutritious meals and medical care",
      "Safe, stable living environment",
    ],
  },
  {
    icon: HeartPulse,
    title: "Trauma Recovery",
    text: "Licensed counselors provide trauma-informed care that helps survivors rebuild trust, stability, and emotional health.",
    points: [
      "Individual and group counseling",
      "Structured case conferences",
      "Regular progress assessments",
    ],
  },
  {
    icon: BookOpen,
    title: "Education & Independence",
    text: "We equip each resident for the future through education, life skills, and practical preparation for independence.",
    points: [
      "Basic literacy through secondary education",
      "Vocational skills training",
      "Reintegration and placement support",
    ],
  },
];

const AboutPage = () => {
  return (
    <Layout>
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
              alone. Hope Harbor exists to make sure she does not have to.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-16 lg:gap-20 items-start">
            <div className="max-w-3xl">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-8">
                How we got here
              </h2>
              <div className="space-y-5 font-body text-muted-foreground leading-relaxed text-lg">
                <p>
                  In early 2023, our founders attended a presentation by
                  Lighthouse Sanctuary, a US-based nonprofit that operates safe
                  homes for girls who are survivors of sexual abuse and sex
                  trafficking in the Philippines. The work was extraordinary,
                  and the need was clearly far larger than any single
                  organization could meet.
                </p>
                <p>
                  Lighthouse Sanctuary generously shared anonymized operational
                  data, including caseload records, counseling documentation,
                  home visitation reports, and annual accomplishment templates,
                  to help us understand what running this kind of organization
                  actually looks like day to day.
                </p>
                <p>
                  Armed with that knowledge, we set out to build Hope Harbor: a
                  new organization using the same proven model, designed from
                  the ground up with modern technology to help limited staff
                  manage cases, retain donors, and protect the privacy of
                  everyone involved.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-warm-cream p-8 md:p-10 shadow-soft lg:mt-10">
              <div className="space-y-0">
                {timeline.map((item, i) => (
                  <div key={item.year} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent mt-2 shrink-0" />
                      {i < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-8 last:pb-0">
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
          </div>
        </div>
      </section>

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
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-8 shadow-soft"
              >
                <value.icon className="h-6 w-6 text-accent mb-4" />
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-secondary">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Core Programs
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Three interconnected pillars of care
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.title}
                className="bg-background rounded-2xl p-8 lg:p-10 shadow-soft"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <program.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  {program.title}
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed mb-4">
                  {program.text}
                </p>
                <ul className="space-y-2 font-body text-sm text-muted-foreground">
                  {program.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-warm-cream">
        <div className="container text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
            Support the mission or reach out directly.
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Donations keep safe homes operating, and our team is available if
            you want to learn more about the work.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/donate">
              <Button
                size="lg"
                className="bg-navy text-white hover:bg-navy-light rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Donate
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
