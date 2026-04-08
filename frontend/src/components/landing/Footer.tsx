import { Link } from "react-router-dom";
import { Anchor } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-white">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Anchor className="h-5 w-5 text-teal-light" />
              <span className="font-heading text-lg font-bold">Hope Harbor</span>
            </Link>
            <p className="font-body text-sm text-white/50 leading-relaxed max-w-xs">
              A 501(c)(3) nonprofit providing safe homes and rehabilitation
              services for survivors of trafficking and sexual abuse.
            </p>
          </div>

          <div>
            <h4 className="font-body text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">
              Organization
            </h4>
            <nav className="space-y-2.5">
              <Link to="/about" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/donor/login" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                Donate
              </Link>
              <Link to="/contact" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-body text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">
              Resources
            </h4>
            <nav className="space-y-2.5">
              <span className="block font-body text-sm text-white/70">Annual Report</span>
              <span className="block font-body text-sm text-white/70">Financial Statements</span>
              <Link to="/privacy" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link to="/login" className="block font-body text-sm text-white/70 hover:text-white transition-colors">
                Staff Portal
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-body text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">
              Get Help
            </h4>
            <p className="font-body text-sm text-white/50 leading-relaxed mb-4">
              If you or someone you know is in danger, please contact the
              National Human Trafficking Hotline.
            </p>
            <a
              href="tel:18883737888"
              className="inline-block font-body text-base font-semibold text-teal-light hover:text-teal transition-colors"
            >
              1-888-373-7888
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">
            © {new Date().getFullYear()} Hope Harbor Sanctuary. All rights reserved.
          </p>
          <p className="font-body text-xs text-white/30">
            EIN: XX-XXXXXXX · Hope Harbor is a registered 501(c)(3) organization.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
