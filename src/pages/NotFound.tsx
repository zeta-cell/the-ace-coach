import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass, Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Compass size={40} className="text-primary" />
        </div>
        <h1 className="font-display text-6xl tracking-wider mb-3">404</h1>
        <p className="font-display text-lg tracking-wider text-muted-foreground mb-2">
          PAGE NOT FOUND
        </p>
        <p className="font-body text-sm text-muted-foreground mb-8">
          We couldn't find{" "}
          <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
            {location.pathname}
          </code>
          . It may have moved, or never existed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Link
            to="/"
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Home size={18} className="text-primary" />
            <span className="font-display text-[10px] tracking-wider">HOME</span>
          </Link>
          <Link
            to="/find-a-coach"
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Search size={18} className="text-primary" />
            <span className="font-display text-[10px] tracking-wider">FIND COACH</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <ArrowLeft size={18} className="text-primary" />
            <span className="font-display text-[10px] tracking-wider">GO BACK</span>
          </button>
        </div>

        <p className="text-xs font-body text-muted-foreground">
          Need help?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link to="/community" className="text-primary hover:underline">
            visit the community
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default NotFound;
