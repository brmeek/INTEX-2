import { FileText, Award } from "lucide-react";

const TransparencySection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trust & Transparency
          </h2>
          <p className="font-body text-muted-foreground leading-relaxed mb-10">
            We maintain the highest standards of financial accountability. As a beacon of hope, we ensure that 98 cents of every dollar goes directly to survivor programs. Explore our records and certifications below.
          </p>

          <div className="flex flex-wrap gap-8 mb-10">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border shadow-soft">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border shadow-soft">
              <Award className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-wrap gap-8 font-body text-sm">
            <div>
              <span className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">Reporting</span>
              <p className="text-foreground font-medium mt-1">
                2025 Annual Report →
              </p>
            </div>
            <div>
              <span className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">Audits</span>
              <p className="text-foreground font-medium mt-1">
                Financial Statement →
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransparencySection;
