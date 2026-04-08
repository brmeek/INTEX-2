import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getDonorPortalPath } from "@/lib/portalRoutes";
import {
  ArrowRight,
  Home,
  HeartPulse,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";

const lifecycle = [
  {
    step: "01",
    title: "Intake & Assessment",
    description:
      "Each new resident receives a comprehensive assessment covering physical health, psychological state, education level, and family situation. This creates her individualized care plan.",
    icon: ClipboardCheck,
  },
  {
    step: "02",
    title: "Stabilization & Healing",
    description:
      "Trauma-informed therapy begins immediately. Licensed counselors use structured process recordings to document each session and track emotional progress over time.",
    icon: HeartPulse,
  },
  {
    step: "03",
    title: "Education & Skills",
    description:
      "From basic literacy to vocational training, residents work toward educational goals at their own pace. Regular case conferences ensure nothing falls through the cracks.",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Reintegration Planning",
    description:
      "When a resident is ready, our team works with her — and, where appropriate, her family — to plan a safe, supported transition back to independent living.",
    icon: UserCheck,
  },
];

const ProgramsPage = () => {
  const { authSession } = useAuth();
  const donorPortalPath = getDonorPortalPath(authSession);

  return (
    <Layout>
      {/* Header */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Our Programs
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              Protection is just
              <br />
              the beginning.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              Rescue without rehabilitation isn't enough. Our programs cover the
              full lifecycle of care — from the moment a girl arrives at one of
              our safe homes to the day she's ready to thrive on her own.
            </p>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Core Programs
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Three interconnected pillars
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-warm-cream rounded-2xl p-8 lg:p-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Home className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                Safe Homes
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                We operate small, family-style residences — each serving a
                limited number of girls so caregivers can provide genuine
                individual attention. Homes are staffed around the clock by
                trained local caregivers.
              </p>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  24/7 on-site supervision
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Nutritious meals and medical care
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Safe, stable living environment
                </li>
              </ul>
            </div>

            <div className="bg-warm-cream rounded-2xl p-8 lg:p-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <HeartPulse className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                Trauma Recovery
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Licensed counselors deliver structured, evidence-based therapy.
                Every session is documented using process recordings — detailed
                notes that capture what happened, what was said, and what it
                means for the treatment plan.
              </p>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Individual and group counseling
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Structured case conferences
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Regular progress assessments
                </li>
              </ul>
            </div>

            <div className="bg-warm-cream rounded-2xl p-8 lg:p-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                Education & Independence
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Recovery isn't just about healing from the past — it's about
                building a future. We provide formal education, life-skills
                training, and vocational programs tailored to each resident's
                goals.
              </p>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Basic literacy through secondary education
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Vocational skills training
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                  Reintegration and placement support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Care Lifecycle */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              The Full Lifecycle
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
              From intake to independence
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              Our case management system tracks each resident through every
              phase of her recovery. Nothing falls through the cracks because
              the system won't let it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {lifecycle.map((phase) => (
              <div
                key={phase.step}
                className="bg-background rounded-2xl p-8 shadow-soft flex gap-6"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center">
                    <phase.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-body text-xs text-accent font-semibold tracking-widest uppercase mb-1">
                    Step {phase.step}
                  </p>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                    {phase.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                How We Track Progress
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                Documentation that drives
                <br className="hidden md:block" />
                better outcomes
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                Our staff use structured documentation — modeled on best
                practices shared by Lighthouse Sanctuary — to capture every
                aspect of a resident's journey. This isn't paperwork for
                paperwork's sake; it's how we make sure interventions are
                actually working.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: FileText,
                  title: "Process Recordings",
                  text: "Structured counseling session notes that capture dialogue, observations, and clinical impressions in a standardized format.",
                },
                {
                  icon: Home,
                  title: "Home Visitation Reports",
                  text: "Regular check-ins documenting the living environment, resident wellbeing, and any concerns flagged by caregivers.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Case Conference Notes",
                  text: "Multi-disciplinary team discussions reviewing each resident's progress, challenges, and updated care plans.",
                },
                {
                  icon: ShieldCheck,
                  title: "Intervention Plans",
                  text: "Individualized treatment strategies based on assessment data, reviewed and adjusted on a regular cycle.",
                },
              ].map((doc) => (
                <div
                  key={doc.title}
                  className="flex gap-4 p-5 rounded-xl bg-secondary border border-border"
                >
                  <doc.icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground mb-1">
                      {doc.title}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">
                      {doc.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-warm-cream">
        <div className="container text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
            Help us keep these programs running.
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Every dollar funds direct care. Your contribution keeps safe-home
            beds available for the next girl who needs one.
          </p>
          <Link to={donorPortalPath}>
            <Button
              size="lg"
              className="bg-navy text-white hover:bg-navy-light rounded-full font-body font-semibold px-8 h-12 text-base"
            >
              Donate Now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default ProgramsPage;
