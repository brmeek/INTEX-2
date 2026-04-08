import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface PublicImpactData {
  totalResidents: number;
  totalRaisedThisYear: number;
  activeRegionCount: number;
}

const ImpactSection = () => {
  const [impactData, setImpactData] = useState<PublicImpactData | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE}/api/reports/impact`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load impact data"))))
      .then((data: PublicImpactData) => {
        if (isMounted) {
          setImpactData(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImpactData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        value: impactData ? impactData.totalResidents.toLocaleString() : "-",
        label: "Residents helped since founding",
      },
      { value: "24/7", label: "On-site care at every home" },
      {
        value: impactData ? `₱${Math.round(impactData.totalRaisedThisYear).toLocaleString()}` : "-",
        label: "Raised this year",
      },
      {
        value: impactData ? impactData.activeRegionCount.toLocaleString() : "-",
        label: "Regions with active programs",
      },
    ],
    [impactData]
  );

  return (
    <section className="py-24 md:py-32 bg-navy text-white">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
            Our Impact
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-6">
            The numbers tell part
            <br className="hidden md:block" />
            of the story.
          </h2>
          <p className="font-body text-white/60 leading-relaxed">
            Behind every statistic is a young woman rebuilding her life. We track
            outcomes carefully, not to generate reports, but to make sure every
            girl in our care is truly progressing.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-navy p-8 lg:p-10">
              <p className="font-heading text-4xl md:text-5xl font-bold text-teal-light mb-3">
                {stat.value}
              </p>
              <p className="font-body text-sm text-white/60 leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
