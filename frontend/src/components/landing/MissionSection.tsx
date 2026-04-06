import { Shield, Scale } from "lucide-react";
import missionImage from "@/assets/mission-counseling.jpg";

const MissionSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="rounded-2xl overflow-hidden shadow-card">
            <img
              src={missionImage}
              alt="Supportive counseling session"
              className="w-full h-full object-cover aspect-[4/3]"
              loading="lazy"
              width={800}
              height={600}
            />
          </div>

          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Mission: Restoring Agency
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-8">
              At Hope Harbor, we believe that strength isn't always loud. It is the quiet persistence of a survivor reclaiming her life. Our mission is to facilitate that journey through holistic care, legal advocacy, and educational empowerment.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-secondary border border-border">
                <Shield className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Holistic Healing</h3>
                <p className="text-sm font-body text-muted-foreground">
                  Trauma-informed therapy and medical care tailored to individual needs.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-secondary border border-border">
                <Scale className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Legal Advocacy</h3>
                <p className="text-sm font-body text-muted-foreground">
                  Dedicated legal support to ensure justice during every survivor's journey.
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
