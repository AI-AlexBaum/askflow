import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Palette,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#6366f1', accent: '#8b5cf6' },
  { name: 'Blue', primary: '#2563eb', accent: '#3b82f6' },
  { name: 'Emerald', primary: '#059669', accent: '#10b981' },
  { name: 'Rose', primary: '#e11d48', accent: '#f43f5e' },
  { name: 'Orange', primary: '#ea580c', accent: '#f97316' },
  { name: 'Slate', primary: '#475569', accent: '#64748b' },
];

const TOTAL_STEPS = 4;

export default function SetupWizard() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState(0);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COLOR_PRESETS[0].primary);
  const [accentColor, setAccentColor] = useState(COLOR_PRESETS[0].accent);
  const [selectedPreset, setSelectedPreset] = useState(0);

  // UI state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.needsSetup === false) {
          navigate('/admin/login', { replace: true });
        } else {
          setCheckingStatus(false);
        }
      })
      .catch(() => {
        setCheckingStatus(false);
      });
  }, [navigate]);

  function goNext() {
    setError('');
    // Validate current step
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    if (step === 2) {
      if (!companyName.trim()) {
        setError('Company name is required.');
        return;
      }
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError('');
    setStep((s) => s - 1);
  }

  async function handleComplete() {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          companyName,
          primaryColor,
          accentColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Setup failed.');
        return;
      }
      if (data.accessToken && data.user) {
        loginWithToken(data.accessToken, data.user);
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingStatus) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-modern p-8">
          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-indigo-500'
                    : i < step
                      ? 'w-2 bg-indigo-300'
                      : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-50 mb-6">
                <Sparkles className="w-7 h-7 text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Welcome to AskFlow
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Let's get your FAQ portal set up in just a few quick steps.
                You'll create your admin account, name your brand, and pick
                your colors.
              </p>
              <button
                onClick={goNext}
                className="btn-modern-primary w-full flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Admin Account */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Admin Account</h2>
                  <p className="text-slate-400 text-xs">Create your login credentials</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    autoFocus
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
                    required
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="input-modern"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={goBack}
                  className="btn-modern-secondary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  className="btn-modern-primary flex-1 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Brand */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Your Brand</h2>
                  <p className="text-slate-400 text-xs">Tell us about your company</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                  required
                  autoFocus
                  className="input-modern"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={goBack}
                  className="btn-modern-secondary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  className="btn-modern-primary flex-1 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Colors */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50">
                  <Palette className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Colors</h2>
                  <p className="text-slate-400 text-xs">Choose your brand palette</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {COLOR_PRESETS.map((preset, i) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSelectedPreset(i);
                      setPrimaryColor(preset.primary);
                      setAccentColor(preset.accent);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      selectedPreset === i
                        ? 'bg-slate-100 border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
                        }}
                      />
                      {selectedPreset === i && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-slate-600 text-xs font-medium">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="btn-modern-secondary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="btn-modern-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">Powered by AskFlow</p>
      </div>
    </div>
  );
}
