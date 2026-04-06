import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <Anchor className="h-6 w-6 text-accent" />
        <span className="font-heading text-xl font-bold text-foreground">
          Hope Harbor
        </span>
      </Link>
      <p className="font-body text-sm text-accent font-semibold tracking-widest uppercase mb-3">
        Page Not Found
      </p>
      <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-4">
        404
      </h1>
      <p className="font-body text-muted-foreground text-center max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full font-body font-semibold px-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
