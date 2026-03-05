import React, { useState } from 'react';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string) => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token);
      } else {
        setError(data.message || 'Login failed');
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
          <h2 className="text-2xl font-serif font-bold text-white">Admin Login</h2>
          <p className="text-purple-200 text-xs mt-2 uppercase tracking-widest font-black">The Hair Gallery</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center space-x-3 text-red-600">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-purple-50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Sign In</span>}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-600 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
