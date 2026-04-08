import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowRight, Eye, EyeOff, HeartHandshake, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginUser, registerUser } from "@/lib/authApi";

const DonorLoginPage = () => {
  const [mode, setMode] = useState<"login" | "create">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, refreshAuthSession } = useAuth();
  const navigate = useNavigate();

  const submitLabel = useMemo(() => {
    if (loading) return mode === "login" ? "Signing in..." : "Creating account...";
    return mode === "login" ? "Sign In to Donate" : "Create Donor Account";
  }, [loading, mode]);

  if (isAuthenticated) return <Navigate to="/portal" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await loginUser(email, password, true);
        await refreshAuthSession();
        navigate("/portal");
      } else {
        await registerUser(email, password);
        navigate("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 bg-navy text-white">
        <Link to="/" className="flex items-center gap-2.5">
          <Anchor className="h-6 w-6 text-teal-light" />
          <span className="font-heading text-xl font-bold text-white">Hope Harbor</span>
        </Link>

        <div>
          <h1 className="font-heading text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Donor Portal
          </h1>
          <p className="font-body text-white/60 leading-relaxed max-w-md mb-8">
            Sign in to give securely, track your donation trends, and see the impact your generosity is making.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/70">
              <HeartHandshake className="h-4 w-4 text-teal-light" />
              <span className="font-body text-sm">One-time and monthly giving</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <TrendingUp className="h-4 w-4 text-teal-light" />
              <span className="font-body text-sm">Personal giving trends and impact</span>
            </div>
          </div>
        </div>

        <p className="font-body text-xs text-white/40">Donor access is restricted to donor-only features.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-2.5 mb-8">
              <Anchor className="h-6 w-6 text-teal-light" />
              <span className="font-heading text-xl font-bold text-white">Hope Harbor</span>
            </Link>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Donor Portal</h1>
            <p className="font-body text-sm text-white/50">Sign in or create an account to donate</p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-border shadow-card">
            <div className="flex gap-2 p-1 bg-secondary rounded-full mb-6">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full py-2 text-sm font-body font-semibold transition-colors ${mode === "login" ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`flex-1 rounded-full py-2 text-sm font-body font-semibold transition-colors ${mode === "create" ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
                {mode === "login" ? "Welcome back" : "Start giving today"}
              </h2>
              <p className="font-body text-sm text-muted-foreground mb-6">
                {mode === "login"
                  ? "Sign in to continue to your donor dashboard."
                  : "Create a secure donor account to make your first contribution."}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-body text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={14}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="At least 14 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

              </div>

              <Button type="submit" size="lg" disabled={loading} className="w-full mt-6 rounded-xl h-12 font-body font-semibold">
                {submitLabel}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <p className="font-body text-xs text-muted-foreground text-center mt-6">
              Staff member? <Link to="/login" className="text-accent hover:underline">Use staff portal</Link>
            </p>
            <p className="font-body text-xs text-muted-foreground text-center mt-3">
              Demo donor credentials: <span className="font-mono">donor@hopeharbor.org</span> /{" "}
              <span className="font-mono">HopeHarborDonor2025!</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DonorLoginPage;
