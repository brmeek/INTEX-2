import { Link } from "react-router-dom";
import { Home, HeartPulse, BookOpen, ArrowRight } from "lucide-react";

const programs = [
  {
    icon: Home,
    title: "Safe Homes",
    description:
      "Small, family-style residences staffed around the clock. Each home serves a limited number of girls so caregivers can provide individual attention.",
  },
  {
    icon: HeartPulse,
    title: "Trauma Recovery",
    description:
      "Licensed counselors deliver structured therapy — including process recordings and regular case conferences — so progress is documented and gaps are caught early.",
  },
  {
    icon: BookOpen,
    title: "Education & Reintegration",
    description:
      "From basic literacy to vocational training, we help each resident build the skills and confidence she needs to live independently when she's ready.",
  },
];

const ProgramsPreview = () => {
  return (
    <section className="py-24 md:py-32 bg-warm-cream">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
            What We Do
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Three pillars of care
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {programs.map((program) => (
            <div
              key={program.title}
              className="group bg-white rounded-2xl p-8 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <program.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                {program.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {program.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-accent hover:text-teal-light transition-colors"
          >
            Learn more about our programs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProgramsPreview;
