import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserCog } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/lib/authApi";
import { getPortalRedirectPath } from "@/lib/portalRoutes";
import sunsetImage from "@/assets/philippine-sunset.jpg";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { authSession, isAuthenticated, refreshAuthSession } = useAuth();

  if (isAuthenticated && authSession?.roles.includes("Admin")) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password, true);
      await refreshAuthSession();
      window.location.assign(getPortalRedirectPath("admin"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={sunsetImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container relative">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] items-start">
            <div className="rounded-3xl bg-secondary p-8 md:p-10 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <UserCog className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-heading text-4xl font-bold text-foreground">
                  Admin Portal
                </h1>
              </div>
              <p className="font-body text-muted-foreground leading-relaxed mb-6">
                Log in to access staff tools and administrative dashboards.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-muted-foreground">
                    Secure staff access
                  </p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-muted-foreground">
                    Case and reporting dashboards
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 md:p-10 shadow-card border border-border">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                Welcome back
              </h2>
              <p className="font-body text-muted-foreground mb-8">
                {isAuthenticated
                  ? "Your current account does not have staff access. Sign in with staff credentials to continue."
                  : "Sign in to continue to the staff dashboard."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    placeholder="you@hopeharbor.org"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-navy text-white hover:bg-navy-light font-body font-semibold text-base"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>

                <p className="font-body text-xs text-muted-foreground text-center">
                  Admin credentials: <span className="font-mono">admin@hopeharbor.org</span> /{" "}
                  <span className="font-mono">HopeHarbor2025!</span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LoginPage;
