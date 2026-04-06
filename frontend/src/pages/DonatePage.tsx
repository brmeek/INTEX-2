import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const amounts = [25, 50, 100, 250, 500];

const impactItems = [
  { amount: "$25/mo", result: "Covers school supplies and uniforms for one resident" },
  { amount: "$50/mo", result: "Funds weekly counseling sessions for one girl" },
  { amount: "$100/mo", result: "Provides nutritious meals for an entire safe home for a week" },
  { amount: "$250/mo", result: "Covers full monthly care costs for one resident" },
  { amount: "$500/mo", result: "Sponsors an entire safe home's operational costs for a month" },
];

const DonatePage = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [isMonthly, setIsMonthly] = useState(true);
  const [customAmount, setCustomAmount] = useState("");

  const activeAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null);

  return (
    <Layout>
      {/* Header */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Give
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              Your generosity changes lives.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              100% of your donation goes to operating safe homes and
              rehabilitation services. Hope Harbor is a registered 501(c)(3) —
              every gift is tax-deductible.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-card p-8 md:p-10 border border-border">
                {/* Frequency Toggle */}
                <div className="flex gap-1 p-1 bg-secondary rounded-full w-fit mb-8">
                  <button
                    onClick={() => setIsMonthly(true)}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-body font-semibold transition-all",
                      isMonthly
                        ? "bg-navy text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsMonthly(false)}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-body font-semibold transition-all",
                      !isMonthly
                        ? "bg-navy text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    One-Time
                  </button>
                </div>

                {/* Amount Selection */}
                <p className="font-body text-sm font-medium text-foreground mb-3">
                  Select an amount
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "py-3 rounded-xl text-sm font-body font-semibold transition-all border",
                        selectedAmount === amt
                          ? "bg-navy text-white border-navy shadow-soft"
                          : "bg-secondary text-foreground border-border hover:border-navy/30"
                      )}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="relative mb-8">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>

                {/* Donor Info */}
                <p className="font-body text-sm font-medium text-foreground mb-3">
                  Your information
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="First name"
                    className="px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    className="px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent mb-8"
                />

                <Button
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-teal-light rounded-xl font-body font-semibold h-12 text-base"
                  disabled={!activeAmount}
                >
                  {isMonthly ? "Give" : "Donate"}{" "}
                  {activeAmount ? `$${activeAmount}` : ""}
                  {isMonthly ? " Monthly" : ""}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>

                <p className="font-body text-xs text-muted-foreground text-center mt-4">
                  Secure payment processing. You can cancel monthly gifts at
                  any time.
                </p>
              </div>
            </div>

            {/* Impact Sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <div className="bg-navy rounded-2xl p-8 text-white mb-6">
                  <Heart className="h-6 w-6 text-teal-light mb-4" />
                  <h3 className="font-heading text-xl font-bold mb-2">
                    Why monthly giving matters
                  </h3>
                  <p className="font-body text-sm text-white/60 leading-relaxed">
                    Monthly donors provide the predictable funding that lets us
                    plan ahead instead of reacting to emergencies. It means
                    keeping beds available for the next girl who needs one — not
                    just the girls already in our care.
                  </p>
                </div>

                <div className="bg-secondary rounded-2xl p-8 border border-border">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                    What your gift provides
                  </h3>
                  <div className="space-y-4">
                    {impactItems.map((item) => (
                      <div key={item.amount} className="flex gap-3">
                        <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-body text-sm font-semibold text-foreground">
                            {item.amount}
                          </span>
                          <p className="font-body text-xs text-muted-foreground">
                            {item.result}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DonatePage;
