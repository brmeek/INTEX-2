import { Link } from "react-router-dom";
import missionImage from "@/assets/mission-counseling.jpg";

const MissionSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="order-2 lg:order-1">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Who We Are
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
              We exist because too many
              <br className="hidden md:block" />
              girls have nowhere to go.
            </h2>
            <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
              <p>
                In regions across the developing world, girls who escape trafficking
                or abuse face a devastating reality: there is no safe place waiting
                for them. No shelter. No counseling. No one tracking whether they're
                healing or falling back into danger.
              </p>
              <p>
                Hope Harbor was founded to change that. We partner with in-country
                organizations to operate safe homes — small, stable environments
                where survivors receive trauma-informed therapy, medical care,
                education, and legal support for as long as they need it.
              </p>
            </div>
            <Link
              to="/about"
              className="inline-block mt-8 font-body text-sm font-semibold text-accent hover:text-teal-light transition-colors border-b-2 border-accent hover:border-teal-light pb-0.5"
            >
              Read our full story
            </Link>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-card">
                <img
                  src={missionImage}
                  alt="A supportive counseling environment"
                  className="w-full h-full object-cover aspect-[4/3]"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-navy rounded-xl p-5 shadow-elevated hidden md:block">
                <p className="font-heading text-3xl font-bold text-white">5</p>
                <p className="font-body text-sm text-white/70">
                  safe homes
                  <br />
                  in operation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
