import { Heart, Users, GraduationCap } from "lucide-react";

const stats = [
  {
    icon: Heart,
    value: "24/7",
    label: "Medical & Emotional Care",
    color: "bg-accent text-accent-foreground",
  },
  {
    icon: Users,
    value: "120+",
    label: "Survivors Supported",
    color: "bg-coral text-primary-foreground",
  },
  {
    icon: GraduationCap,
    value: "100%",
    label: "Educational Success",
    color: "bg-navy text-primary-foreground",
  },
];

const ImpactSection = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
          Direct Impact
        </h2>
        <p className="font-body text-muted-foreground max-w-2xl mx-auto mb-14 leading-relaxed">
          Transparency is the bedrock of our sanctuary. Every contribution translates into measurable transformation.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-2xl p-8 shadow-card transition-transform hover:-translate-y-1`}
            >
              <stat.icon className="h-10 w-10 mx-auto mb-4 opacity-90" />
              <div className="font-heading text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="font-body text-sm font-medium opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
