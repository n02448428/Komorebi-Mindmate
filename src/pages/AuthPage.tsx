import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import NatureVideoBackground from '../components/NatureVideoBackground';
import { getTimeOfDay } from '../utils/timeUtils';

const AuthPage: React.FC = () => {
  const { login, signup, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const timeOfDay = getTimeOfDay();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/session');
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password, name);
      navigate('/session');
    } catch (err) {
      setError('Signup failed. Please check your details and try again.');
    }
  };

  const handleBack = () => {
    navigate('/session');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NatureVideoBackground 
        scene="ocean" 
        timeOfDay={timeOfDay.period === 'morning' || timeOfDay.period === 'evening' ? timeOfDay.period : 'morning'} 
      />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6 flex justify-between items-center gap-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 shrink-0 ${
            timeOfDay.period === 'morning'
              ? 'bg-white/20 hover:bg-white/30 text-gray-700'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden xs:inline sm:inline">Back</span>
        </button>
        
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 shrink-0" />
          <span className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Komorebi</span>
        </div>
        
        <div className="w-10 sm:w-16 shrink-0" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="backdrop-blur-md bg-white/20 rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isSignup ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-700">
                {isSignup 
                  ? 'Join the mindful reflection journey and save your insights'
                  : 'Sign in to access your saved insights and continue your journey'
                }
              </p>
            </div>

            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
              {isSignup && (
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 rounded-2xl border-0 bg-white/20 text-gray-800 placeholder-gray-600 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    placeholder="Your name"
                  />
                </div>
              )}
              
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-2xl border-0 bg-white/20 text-gray-800 placeholder-gray-600 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                  placeholder="Your email address"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-2xl border-0 bg-white/20 text-gray-800 placeholder-gray-600 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                  placeholder={isSignup ? "Choose a password" : "Your password"}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-red-100/80 border border-red-300/50 text-red-700 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
              >
                {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-8">
              <div className="text-center text-sm text-gray-600 mb-4">
                {isSignup ? 'Already have an account?' : "Don't have an account yet?"}
              </div>
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="w-full p-3 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 text-gray-800 font-medium transition-all duration-200 backdrop-blur-sm"
              >
                {isSignup ? 'Sign In' : 'Create Free Account'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Free to use • No credit card required • Private & secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;