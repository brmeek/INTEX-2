import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, HeartHandshake, History } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { loginUser, registerUser } from "@/lib/authApi";
import { getPortalRedirectPath, hasDonorPortalAccess } from "@/lib/portalRoutes";
import sunsetImage from "@/assets/philippine-sunset.jpg";

const DonorLoginPage = () => {
  const [mode, setMode] = useState<"login" | "create">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { authSession, isAuthenticated, refreshAuthSession } = useAuth();

  const submitLabel = useMemo(() => {
    if (loading) return mode === "login" ? "Signing in..." : "Creating account...";
    return mode === "login" ? "Sign In to Continue" : "Create Donor Account";
  }, [loading, mode]);

  if (isAuthenticated && hasDonorPortalAccess(authSession)) return <Navigate to="/donor" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await loginUser(email, password, true);
        await refreshAuthSession();
        window.location.assign(getPortalRedirectPath("donor"));
      } else {
        await registerUser(email, password);
        setMode("login");
        setPassword("");
        setSuccess("If the account can be created, you can now sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
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
                  <HeartHandshake className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-heading text-4xl font-bold text-foreground">
                  Donor Portal
                </h1>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <HeartHandshake className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-muted-foreground">
                    Log in to donate
                  </p>
                </div>
                <div className="flex gap-3">
                  <History className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-muted-foreground">
                    View your donation history
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-card p-8 md:p-10 shadow-card border border-border">
              <div className="flex gap-2 rounded-full bg-secondary p-1 mb-8">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-body font-semibold transition-colors ${
                    mode === "login" ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-body font-semibold transition-colors ${
                    mode === "create" ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                {mode === "login" ? "Welcome back" : "Create your donor account"}
              </h2>
              <p className="font-body text-muted-foreground mb-8">
                {mode === "login"
                  ? isAuthenticated
                    ? "Your current session can already use the donor portal."
                    : "Sign in to continue to your donor dashboard."
                  : "Create a secure account to donate and keep a history of your gifts."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200">
                    {success}
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
                    placeholder="you@example.com"
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
                      minLength={14}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder={mode === "login" ? "Enter your password" : "At least 14 characters"}
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
                  {submitLabel}
                  {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>

                <p className="font-body text-xs text-muted-foreground text-center">
                  Staff member? <Link to="/login" className="text-accent hover:underline">Use the staff portal</Link>
                </p>

                <p className="font-body text-xs text-muted-foreground text-center">
                  Need help signing in? Use the contact page and we will assist.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DonorLoginPage;
