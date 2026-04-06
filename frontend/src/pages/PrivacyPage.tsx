import Layout from "@/components/Layout";
import { Shield, Lock, Eye, Server, UserX, AlertTriangle } from "lucide-react";

const principles = [
  {
    icon: Lock,
    title: "Encryption at Rest and in Transit",
    text: "All resident data is encrypted using industry-standard protocols (AES-256 at rest, TLS 1.3 in transit). Even in the unlikely event of a breach, data remains unreadable.",
  },
  {
    icon: Eye,
    title: "Role-Based Access Control",
    text: "Staff members can only access the data they need for their specific role. A counselor sees therapy notes; a donor coordinator sees giving history. No one sees everything unless they absolutely must.",
  },
  {
    icon: Server,
    title: "Minimal Data Collection",
    text: "We only collect what we need. We don't track browsing behavior, sell data, or share information with third parties for marketing purposes — ever.",
  },
  {
    icon: UserX,
    title: "Anonymization by Default",
    text: "When sharing impact data with donors or publishing reports, all resident information is anonymized. No names, no photos, no identifying details.",
  },
  {
    icon: AlertTriangle,
    title: "Quick Exit Feature",
    text: "Our website includes a Quick Exit button on every page. One click immediately redirects to a safe external site and clears the browser history entry — because sometimes just visiting this site could put someone at risk.",
  },
  {
    icon: Shield,
    title: "Regular Security Audits",
    text: "Our systems undergo annual third-party security assessments. We treat vulnerabilities as critical issues and patch them immediately.",
  },
];

const PrivacyPage = () => {
  return (
    <Layout>
      {/* Header */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Privacy & Safety
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              Privacy isn't a feature.
              <br />
              It's a requirement.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              The people we serve are minors who have survived abuse and
              trafficking. Protecting their information isn't just a legal
              obligation — it's a moral one.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Our Commitments
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
              How we protect everyone
              <br className="hidden md:block" />
              in our ecosystem
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              Residents, staff, donors, and partners all deserve robust privacy
              protections. Here's how we deliver them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {principles.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-8 shadow-soft border border-border"
              >
                <p.icon className="h-6 w-6 text-accent mb-4" />
                <h3 className="font-heading text-lg font-bold text-foreground mb-3">
                  {p.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donor Privacy */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                Donor Privacy
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                Your giving is your business.
              </h2>
              <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                <p>
                  We will never sell, trade, or share your personal information
                  with third parties for their marketing purposes. Your donation
                  history is confidential and accessible only to authorized staff
                  members who need it to process your gifts and provide tax
                  receipts.
                </p>
                <p>
                  You can request a full export or deletion of your donor data at
                  any time by contacting us directly. We honor all such requests
                  within 30 days.
                </p>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-8 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Your rights as a donor
              </h3>
              <ul className="space-y-3">
                {[
                  "Access all data we hold about you",
                  "Request correction of inaccurate information",
                  "Request deletion of your data",
                  "Opt out of communications at any time",
                  "Receive a tax receipt for every gift",
                  "Know exactly how your donation is used",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 font-body text-sm text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Governance */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="max-w-3xl">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Data Governance
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-8">
              How we handle data internally
            </h2>
            <div className="space-y-6 font-body text-muted-foreground leading-relaxed">
              <p>
                All staff with data access undergo background checks and sign
                confidentiality agreements. Access is provisioned on a
                need-to-know basis and reviewed quarterly. Terminated accounts
                are deactivated within 24 hours.
              </p>
              <p>
                Our case management system maintains a complete audit trail —
                every access, edit, and export is logged. This means we can
                always answer the question: "Who saw this data, and when?"
              </p>
              <p>
                We retain resident data only as long as legally required or
                operationally necessary. When data is no longer needed, it is
                securely deleted — not just archived.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPage;
