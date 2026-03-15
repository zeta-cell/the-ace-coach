import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
// Logo removed during cleanup

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const Login = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleLogin = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setError("");
    setLoading(true);
    // TODO: Re-enable email confirmation in production
    // Lovable Cloud → Users → Auth Settings → Enable email confirmations → ON
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/onboarding");
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin');
      if (error) throw error;
      toast.success('Admin account created!', {
        description: data.message,
        duration: 10000,
      });
    } catch (err: any) {
      toast.error('Bootstrap failed', { description: err.message });
    }
    setBootstrapping(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back to website */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-body mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to website
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-display text-xl text-primary-foreground">CA</div>
          <span className="font-display text-2xl text-foreground tracking-wide">MEMBER PORTAL</span>
        </div>

        {/* Tab toggle */}
        <div className="flex mb-6 bg-card rounded-lg p-1 border border-border">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-md font-display text-sm tracking-wider transition-colors ${
              mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2.5 rounded-md font-display text-sm tracking-wider transition-colors ${
              mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            REGISTER
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-body rounded-lg p-3 mb-4">
            {error}
          </div>
        )}


        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">EMAIL</label>
              <input
                {...loginForm.register("email")}
                type="email"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="your@email.com"
              />
              {loginForm.formState.errors.email && (
                <p className="text-destructive text-xs mt-1 font-body">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">PASSWORD</label>
              <div className="relative">
                <input
                  {...loginForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-destructive text-xs mt-1 font-body">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">FULL NAME</label>
              <input
                {...registerForm.register("full_name")}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="John Doe"
              />
              {registerForm.formState.errors.full_name && (
                <p className="text-destructive text-xs mt-1 font-body">{registerForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">EMAIL</label>
              <input
                {...registerForm.register("email")}
                type="email"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="your@email.com"
              />
              {registerForm.formState.errors.email && (
                <p className="text-destructive text-xs mt-1 font-body">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">PASSWORD</label>
              <div className="relative">
                <input
                  {...registerForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-destructive text-xs mt-1 font-body">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">CONFIRM PASSWORD</label>
              <input
                {...registerForm.register("confirm_password")}
                type="password"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {registerForm.formState.errors.confirm_password && (
                <p className="text-destructive text-xs mt-1 font-body">{registerForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>
        )}

        {/* Bootstrap admin - first time setup */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs font-body mb-2 text-center">First time setup</p>
          <button
            type="button"
            onClick={handleBootstrap}
            disabled={bootstrapping}
            className="w-full py-2.5 rounded-lg border border-border text-muted-foreground font-body text-xs hover:bg-card transition-colors disabled:opacity-50"
          >
            {bootstrapping ? 'Creating admin account...' : 'Bootstrap admin@the-ace.academy'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
