import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      await api.post("/api/contact", formData);
      toast({
        title: "Message sent",
        description:
          "Thank you for reaching out. We'll respond within 2 business days.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      const fallbackMessage =
        "We couldn't send your message right now. Please try again later.";
      const errorMessage =
        error instanceof Error && !error.message.trim().startsWith("{")
          ? error.message
          : fallbackMessage;

      toast({
        title: "Message failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Header */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Contact
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              We'd love to hear from you.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              Questions about our work, interested in partnering, or want to
              learn how to help? Reach out and we'll get back to you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-card p-8 md:p-10 border border-border space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="">Select a topic</option>
                    <option value="Donation Inquiry">Donation Inquiry</option>
                    <option value="Partnership Opportunity">Partnership Opportunity</option>
                    <option value="Volunteering">Volunteering</option>
                    <option value="Media / Press">Media / Press</option>
                    <option value="General Question">General Question</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-navy text-white hover:bg-navy-light rounded-xl font-body font-semibold h-12 text-base mt-2"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-28 space-y-6">
                <div className="bg-secondary rounded-2xl p-8 border border-border">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-6">
                    Other ways to reach us
                  </h3>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          Email
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          info@hopeharbor.org
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          Phone
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          +1 (555) 012-3456
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          Mailing Address
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          Hope Harbor Sanctuary
                          <br />
                          P.O. Box 12345
                          <br />
                          Provo, UT 84602
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-navy rounded-2xl p-8 text-white">
                  <h3 className="font-heading text-lg font-bold mb-2">
                    Need immediate help?
                  </h3>
                  <p className="font-body text-sm text-white/60 leading-relaxed mb-4">
                    If you or someone you know is in danger, contact the
                    National Human Trafficking Hotline.
                  </p>
                  <a
                    href="tel:18883737888"
                    className="inline-block font-body text-lg font-bold text-teal-light hover:text-teal transition-colors"
                  >
                    1-888-373-7888
                  </a>
                  <p className="font-body text-xs text-white/40 mt-2">
                    Available 24/7 · Call or text
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
