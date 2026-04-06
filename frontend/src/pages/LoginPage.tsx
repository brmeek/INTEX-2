import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16">
        <Link to="/" className="flex items-center gap-2.5">
          <Anchor className="h-6 w-6 text-teal-light" />
          <span className="font-heading text-xl font-bold text-white">Hope Harbor</span>
        </Link>

        <div>
          <h1 className="font-heading text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Staff Portal
          </h1>
          <p className="font-body text-white/50 leading-relaxed max-w-md">
            Securely access case management, donor records, and operational
            tools. All activity is logged and monitored to protect resident privacy.
          </p>
        </div>

        <div className="flex items-center gap-3 text-white/30">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-body text-xs">
            Protected by encryption and role-based access control
          </span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-2.5 mb-8">
              <Anchor className="h-6 w-6 text-teal-light" />
              <span className="font-heading text-xl font-bold text-white">Hope Harbor</span>
            </Link>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Staff Portal</h1>
            <p className="font-body text-sm text-white/50">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-elevated">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="font-body text-sm text-muted-foreground mb-8">Enter your credentials to continue</p>

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
                  placeholder="you@hopeharbor.org"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    placeholder="••••••••"
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

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-navy text-white hover:bg-navy-light rounded-xl font-body font-semibold h-12 text-base mt-6"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>

            <p className="font-body text-xs text-muted-foreground text-center mt-6">
              Default credentials: <span className="font-mono">admin@hopeharbor.org</span> / <span className="font-mono">HopeHarbor2025!</span>
            </p>
          </form>

          <p className="font-body text-xs text-white/30 text-center mt-6">
            This portal is for authorized Hope Harbor staff only.
            <br />
            Unauthorized access attempts are logged and reported.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
