import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Check, AlertCircle, Building2 } from 'lucide-react';
import authService from '../lib/authService';
import { getErrorMessage } from '../lib/client';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    clinicName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    const unmetRequirements = passwordRequirements.filter((req) => !req.met);
    if (unmetRequirements.length > 0) {
      setError('Please meet all password requirements');
      return;
    }

    // Validate full name
    if (formData.fullName.trim().split(' ').length < 2) {
      setError('Please enter your full name (first and last name)');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signUp({
        fullName: formData.fullName.trim(),
        clinicName: formData.clinicName.trim() || undefined,
        email: formData.email.trim(),
        password: formData.password,
      });

      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);

      // Extract error message using helper
      const errorMessage = getErrorMessage(err);

      // Handle specific error cases
      if (err.response?.status === 400) {
        if (errorMessage.toLowerCase().includes('email')) {
          setError('This email is already registered. Please use a different email or sign in.');
        } else if (errorMessage.toLowerCase().includes('slug')) {
          setError(
            'This clinic name is already taken. Please choose a different clinic name.'
          );
        } else {
          setError(errorMessage);
        }
      } else if (err.response?.status === 422) {
        // Validation error
        setError(errorMessage);
      } else {
        setError(errorMessage || 'An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains a number', met: /\d/.test(formData.password) },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">AnosiumAI</h1>
              <p className="text-xs text-muted-foreground">Clinic Management</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Create an account
            </h2>
            <p className="text-muted-foreground mt-2">
              Get started with AnosiumAI clinic management
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-up">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Registration Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Dr. John Smith"
                className="input-modern"
                required
                disabled={isLoading}
                autoComplete="name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your first and last name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Clinic Name
                <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
              </label>
              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="Smith Medical Center"
                  className="input-modern pl-12"
                  disabled={isLoading}
                  autoComplete="organization"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use your name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@clinic.com"
                className="input-modern"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-modern pr-12"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          req.met ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                      >
                        {req.met && <Check size={10} className="text-white" />}
                      </div>
                      <span
                        className={`text-xs ${
                          req.met ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-modern"
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Passwords do not match
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Check size={12} />
                    Passwords match
                  </p>
                )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-border text-secondary focus:ring-secondary"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-secondary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-secondary hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !agreed}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link
              to="/"
              className="text-secondary font-medium hover:underline"
              tabIndex={isLoading ? -1 : 0}
            >
              Sign in
            </Link>
          </p>

          {/* Development Helper */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
              <p className="font-semibold mb-2">Development Info:</p>
              <p>API: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}</p>
              <p className="mt-1">
                Tenant will be created with slug based on email username
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-bl from-brand-navy to-brand-navy/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-40 right-20 w-72 h-72 bg-brand-teal/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-20 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-brand-teal flex items-center justify-center shadow-teal">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">AnosiumAI</h1>
              <p className="text-white/70">Clinic Management</p>
            </div>
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight mb-6">
            Join the Future of
            <br />
            <span className="text-brand-teal">Healthcare Management</span>
          </h2>
          <ul className="space-y-4">
            {[
              'Intuitive patient management',
              'Smart appointment scheduling',
              'Comprehensive analytics dashboard',
              'Secure and HIPAA compliant',
              'AI-powered lead automation',
              'Multi-channel communication',
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-teal/20 flex items-center justify-center">
                  <Check size={14} className="text-brand-teal" />
                </div>
                <span className="text-white/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignUp;