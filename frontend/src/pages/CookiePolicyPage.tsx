import { Link } from "react-router-dom";

const CookiePolicyPage = () => {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container py-16 max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl text-navy mb-4">Cookie Policy</h1>
        <p className="font-body text-muted-foreground mb-8">
          This page explains the cookies used on Hope Harbor Sanctuary.
        </p>

        <section className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-xl text-navy mb-3">Cookies We Use</h2>
          <ul className="list-disc pl-5 space-y-2 font-body text-sm text-foreground">
            <li>
              Authentication/session cookie: used to keep signed-in users securely logged in.
            </li>
            <li>
              Cookie consent preference cookie: stores whether you accepted the cookie notice.
            </li>
          </ul>
        </section>

        <section className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-xl text-navy mb-3">What We Do Not Use</h2>
          <ul className="list-disc pl-5 space-y-2 font-body text-sm text-foreground">
            <li>No advertising cookies</li>
            <li>No cross-site tracking cookies</li>
            <li>No third-party analytics cookies</li>
          </ul>
        </section>

        <p className="font-body text-sm text-muted-foreground">
          If you clear your browser cookies, your consent preference is removed and the cookie
          banner will appear again on your next visit.
        </p>

        <div className="mt-8">
          <Link to="/" className="text-accent hover:underline font-body text-sm">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default CookiePolicyPage;
