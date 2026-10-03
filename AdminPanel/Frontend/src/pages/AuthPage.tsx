import React, { useState } from 'react';
import { AtSign, Lock, Eye, EyeOff, CheckCircle, Shield, User, Phone, Briefcase, Building, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup' | 'forgotPassword';
type PanelProps = { setAuthMode: (mode: AuthMode) => void };

const inputClass =
  "shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-10 pr-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-slate-700 text-sm font-bold mb-2 text-left";
const primaryButton =
  "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full disabled:bg-blue-400";
const linkButton = "text-xs text-blue-600 hover:underline mt-2 inline-block";

const PASSWORD_HINT = "At least 8 characters, with a letter and a number";
const isStrongPassword = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

interface FieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

const Field = ({ id, label, icon: Icon, value, onChange, type = 'text', placeholder, required, autoComplete }: FieldProps) => (
  <div>
    <label className={labelClass} htmlFor={id}>
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  </div>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete: string;
}

const PasswordField = ({ id, label, value, onChange, placeholder, autoComplete }: PasswordFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelClass} htmlFor={id}>{label}<span className="text-red-500"> *</span></label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-10`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

const ErrorMessage = ({ error }: { error: string }) =>
  error ? <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-lg">{error}</p> : null;

const LoginPanel = ({ setAuthMode }: PanelProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      toast({ title: "Login Successful", description: "Welcome back to Project Saaransh!" });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Sign In</h2>
      <p className="text-slate-500 mb-6 text-sm">Enter your official credentials to access the portal.</p>
      <ErrorMessage error={error} />
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="email" label="Email Address" icon={AtSign} type="email" value={email} onChange={setEmail}
          placeholder="your.name@mca.gov.in" autoComplete="email" required />
        <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" className={primaryButton} disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
        <div className="flex justify-between">
          <button type="button" onClick={() => setAuthMode('forgotPassword')} className={linkButton}>
            Forgot Password?
          </button>
          <button type="button" onClick={() => setAuthMode('signup')} className={linkButton}>
            New here? Create an account
          </button>
        </div>
      </form>
    </>
  );
};

const SignupPanel = ({ setAuthMode }: PanelProps) => {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', designation: '', department: '', location: '',
    password: '', confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!isStrongPassword(form.password)) return setError(`Password must be ${PASSWORD_HINT.toLowerCase()}.`);
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      const { confirmPassword: _confirm, ...data } = form;
      await signup({ ...data, fullName: data.fullName.trim(), email: data.email.trim() });
      toast({ title: "Account Created", description: "Welcome to Project Saaransh!" });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Account</h2>
      <p className="text-slate-500 mb-6 text-sm">These details are shown on your profile in the admin panel.</p>
      <ErrorMessage error={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="fullName" label="Full Name" icon={User} value={form.fullName} onChange={set('fullName')}
            placeholder="e.g. Ravi Kumar" autoComplete="name" required />
          <Field id="signup-email" label="Official Email" icon={AtSign} type="email" value={form.email}
            onChange={set('email')} placeholder="your.name@mca.gov.in" autoComplete="email" required />
          <Field id="designation" label="Designation" icon={Briefcase} value={form.designation}
            onChange={set('designation')} placeholder="e.g. Policy Analyst" autoComplete="organization-title" />
          <Field id="department" label="Department" icon={Building} value={form.department}
            onChange={set('department')} placeholder="e.g. Ministry of Corporate Affairs" autoComplete="organization" />
          <Field id="phone" label="Phone" icon={Phone} type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+91 98765 43210" autoComplete="tel" />
          <Field id="location" label="Location" icon={MapPin} value={form.location} onChange={set('location')}
            placeholder="e.g. New Delhi" autoComplete="address-level2" />
          <PasswordField id="signup-password" label="Password" value={form.password} onChange={set('password')}
            placeholder={PASSWORD_HINT} autoComplete="new-password" />
          <PasswordField id="confirm-password" label="Confirm Password" value={form.confirmPassword}
            onChange={set('confirmPassword')} placeholder="Re-enter password" autoComplete="new-password" />
        </div>
        <button type="submit" className={primaryButton} disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
        <div className="text-center">
          <button type="button" onClick={() => setAuthMode('login')} className={linkButton}>
            Already have an account? Sign In
          </button>
        </div>
      </form>
    </>
  );
};

// Password reset by email needs a mail service; until then admins reset it for the user.
const ForgotPasswordPanel = ({ setAuthMode }: PanelProps) => (
  <>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h2>
    <p className="text-slate-600 mb-6 text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
      Self-service password reset by email is not available yet. Please contact your system
      administrator to reset your password. If you are signed in, you can change your password
      under <strong>User Settings &rarr; Security</strong>.
    </p>
    <button type="button" onClick={() => setAuthMode('login')} className={primaryButton}>
      Back to Sign In
    </button>
  </>
);

const AuthPage = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" style={{ backgroundImage: `url('https://www.toptal.com/designers/subtlepatterns/uploads/double-bubble-outline.png')` }}>
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div className="text-center">
            <img src="/mca.png" alt="MCA Emblem" className="h-20 mb-6 mx-auto" />
            {authMode === 'login' && <LoginPanel setAuthMode={setAuthMode} />}
            {authMode === 'signup' && <SignupPanel setAuthMode={setAuthMode} />}
            {authMode === 'forgotPassword' && <ForgotPasswordPanel setAuthMode={setAuthMode} />}
          </div>
          <div className="mt-8">
            <h3 className="text-center text-sm font-semibold text-slate-600 mb-3">Quick Government Portals</h3>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <a href="https://www.pmindia.gov.in/en/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">PMO India</a>
              <span className="select-none">|</span>
              <a href="https://www.mca.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">Ministry of Corporate Affairs</a>
              <span className="select-none">|</span>
              <a href="https://presidentofindia.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">President of India</a>
              <span className="select-none">|</span>
              <a href="https://pgportal.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">Public Grievance Portal</a>
            </div>
          </div>
        </div>
        <div className="hidden lg:block bg-slate-800 p-12 text-white bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1554224155-169544351720?q=80&w=2070&auto=format&fit=crop')` }}>
          <div className="bg-slate-900 bg-opacity-60 p-8 rounded-lg flex flex-col h-full">
            <h2 className="text-3xl font-bold mb-4 text-white">Project Saaransh</h2>
            <p className="text-slate-200 mb-8">AI-Powered analysis for transparent and responsive corporate governance.</p>
            <div className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Comprehensive Insights</h3>
                  <p className="text-slate-300 text-sm">Leverage state-of-the-art AI to understand public sentiment, stance, and key themes from thousands of submissions instantly.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Secure & Auditable</h3>
                  <p className="text-slate-300 text-sm">Accounts are protected with hashed passwords and signed session tokens; every API call requires a valid login.</p>
                </div>
              </div>
            </div>
            <div className="mt-auto text-center">
              <img src="/mca1.png" alt="Digital India Logo" className="mx-auto h-16" />
              <p className="text-xs text-slate-400 mt-4">&copy; 2025 Ministry of Corporate Affairs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
