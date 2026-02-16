import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onSwitchToRegister?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isRegistering) {
        result = await register(email, password, name || undefined);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004d4a] to-[#002f2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Akomi</h1>
          <p className="text-white/70 mt-2">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Login/Register Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            {isRegistering ? 'Register' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#004d4a] hover:bg-[#003d3a] disabled:bg-[#006666] text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isRegistering ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  <Shield size={18} />
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="ml-1 text-[#004d4a] hover:text-[#003d3a] font-semibold"
              >
                {isRegistering ? 'Sign In' : 'Register'}
              </button>
            </p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Demo: Use the backend to register a new user</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
