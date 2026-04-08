import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, Lock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ProgramAllocation {
  programArea: string;
  amountAllocated: number;
}

const TransparencySection = () => {
  const [allocations, setAllocations] = useState<ProgramAllocation[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE}/api/reports/impact`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load allocation data"))))
      .then((data: { allocationsByProgramArea?: ProgramAllocation[] }) => {
        if (isMounted) {
          setAllocations(data.allocationsByProgramArea ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAllocations([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, item) => sum + item.amountAllocated, 0),
    [allocations]
  );

  const moneyGoes = useMemo(
    () =>
      allocations.map((item) => ({
        ...item,
        sharePct: totalAllocated > 0 ? (item.amountAllocated / totalAllocated) * 100 : 0,
      })),
    [allocations, totalAllocated]
  );

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-3">
            <p className="font-body text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Trust & Accountability
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
              Your trust is not something
              <br className="hidden md:block" />
              we take for granted.
            </h2>
            <div className="space-y-4 font-body text-muted-foreground leading-relaxed max-w-xl">
              <p>
                We publish annual financial reports, submit to independent audits,
                and maintain strict data-protection policies. Because the girls we
                serve are minors and survivors of abuse, privacy isn't a feature —
                it's a foundational requirement.
              </p>
              <p>
                Donors receive regular updates on how their contributions are being
                used, tied to real program outcomes — without ever compromising
                resident safety or anonymity.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-body text-foreground border border-border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                2025 Annual Report
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-body text-foreground border border-border">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Independent Audit
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-secondary rounded-2xl p-6 border border-border">
              <Lock className="h-6 w-6 text-accent mb-4" />
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                Privacy First
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                All resident data is encrypted and access-controlled. We never
                publish identifying information. Our systems are designed to
                protect survivors above all else.
              </p>
              <Link
                to="/privacy"
                className="inline-block mt-4 font-body text-xs font-semibold text-accent hover:text-teal-light transition-colors"
              >
                Read our privacy commitment →
              </Link>
            </div>

            <div className="bg-navy rounded-2xl p-6">
              <p className="font-body text-xs text-teal-light font-semibold tracking-widest uppercase mb-3">
                Where Your Money Goes
              </p>
              <div className="space-y-3">
                {moneyGoes.length > 0 ? moneyGoes.map((item) => (
                  <div key={item.programArea}>
                    <div className="flex justify-between text-sm font-body text-white/80 mb-1">
                      <span>{item.programArea}</span>
                      <span className="font-semibold text-white">
                        PHP {Math.round(item.amountAllocated).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-teal"
                        style={{ width: `${item.sharePct}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="font-body text-sm text-white/70 leading-relaxed">
                    Allocation data will appear here once donation spending has been recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransparencySection;
