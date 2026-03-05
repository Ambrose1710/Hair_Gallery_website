import React, { useState } from 'react';
import { Mail, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  onTokenGenerated: (token: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onTokenGenerated }) => {
  const [step, setStep] = useState<'username' | 'email'>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerifyUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('email');
      } else {
        setError(data.message || 'Username not found');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Switch to reset view after a delay
        setTimeout(() => onTokenGenerated(""), 2000);
      } else {
        setError(data.message || 'Request failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="bg-purple-900 p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-white">Reset Password</h2>
          <p className="text-purple-200 text-xs mt-2 uppercase tracking-widest font-black">The Hair Gallery</p>
        </div>
        
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center space-x-3 text-red-600">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center space-x-3 text-green-600">
              <CheckCircle size={18} />
              <p className="text-xs font-bold">{success}</p>
            </div>
          )}

          {step === 'username' ? (
            <form onSubmit={handleVerifyUsername} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Verify Username</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Enter your registered email"
                    required
                  />
                </div>
                <p className="text-[9px] text-purple-400 ml-1 italic">Hint: Use nwagwu2ebere@gmail.com for testing</p>
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Send Reset Link</span>}
              </button>
            </form>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
