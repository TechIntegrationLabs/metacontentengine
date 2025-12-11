import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, Palmtree, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Props {
  onNavigate: (page: 'login') => void;
}

const ForgotPassword: React.FC<Props> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center p-4">
        <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-pcc-teal/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-pcc-coral/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md text-center">
          <div className="bg-void-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 mb-6">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
              Click the link to reset your password.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="text-pcc-teal hover:text-pcc-teal/80 font-medium transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-pcc-teal/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-pcc-coral/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pcc-teal to-pcc-gold shadow-lg shadow-pcc-teal/20 mb-4">
            <Palmtree className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Reset password</h1>
          <p className="text-slate-500 mt-2">Enter your email to receive a reset link</p>
        </div>

        {/* Form Card */}
        <div className="bg-void-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-void-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pcc-coral to-pcc-gold hover:from-pcc-coral/90 hover:to-pcc-gold/90 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-pcc-coral/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <button
          onClick={() => onNavigate('login')}
          className="flex items-center justify-center space-x-2 w-full mt-6 text-slate-500 hover:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sign in</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
