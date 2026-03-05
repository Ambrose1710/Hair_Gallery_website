import React, { useState } from 'react';
import { Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token: initialToken, onSuccess }) => {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful!');
        setTimeout(onSuccess, 2000);
      } else {
        setError(data.message || 'Reset failed');
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
          <h2 className="text-2xl font-serif font-bold text-white">New Password</h2>
          <p className="text-purple-200 text-xs mt-2 uppercase tracking-widest font-black">The Hair Gallery</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Reset Token</label>
            <div className="relative">
              <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                placeholder="Enter the token from your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                placeholder="Enter new password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Reset Password</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
