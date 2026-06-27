import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import hero9 from '../assets/hero13.jpg';

// Utility: visually hidden but accessible to screen readers
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function AuthModal({ isOpen, onClose, apiBase, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  // Focus management & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the modal (close button is the first focusable landmark)
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: keep focus within modal
      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusable = modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      if (isLogin) {
        onLogin(data.token, data.username);
        onClose();
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Outer backdrop — dialog container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Visually hidden skip link to jump straight to the form */}
        <a
          href="#auth-form"
          style={srOnly}
          onFocus={(e) => { e.currentTarget.style.clip = 'auto'; e.currentTarget.style.width = 'auto'; e.currentTarget.style.height = 'auto'; }}
          onBlur={(e) => { e.currentTarget.style.clip = 'rect(0,0,0,0)'; e.currentTarget.style.width = '1px'; e.currentTarget.style.height = '1px'; }}
        >
          Skip to form
        </a>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          aria-hidden="true"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
        >
          {/* Left Side - Image/Visuals */}
          <div className="w-full md:w-1/2 bg-muted p-8 hidden md:flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent z-0" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white shadow-lg mb-6 shadow-accent-glow">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Unlock the power of <span className="text-accent">AI Enhancement</span>
              </h2>
              <p className="text-muted-foreground">Join thousands of professionals restoring and upscaling images with incredible precision.</p>
            </div>
            
            <div className="relative z-10 w-full h-48 rounded-xl overflow-hidden shadow-lg border border-card-border group">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] mix-blend-overlay opacity-30 z-10 pointer-events-none" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" aria-hidden="true" />
              <img src={hero9} alt="AI-enhanced abstract image showcasing upscaling quality" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 relative">
            <button 
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close authentication modal"
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            
            <div className="max-w-sm mx-auto h-full flex flex-col justify-center py-8">
              {/* id matches aria-labelledby on the dialog */}
              <h3 id="auth-modal-title" className="text-2xl font-bold text-foreground mb-2">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h3>
              <p className="text-muted-foreground text-sm mb-8">
                {isLogin ? 'Enter your details to access your account.' : 'Get started with AI image enhancement today.'}
              </p>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center"
                >
                  {error}
                </div>
              )}

              <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label htmlFor="auth-username" className="block text-xs font-semibold text-foreground mb-1">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input 
                        id="auth-username"
                        type="text"
                        required
                        autoComplete="username"
                        ref={firstInputRef}
                        className="w-full bg-muted border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-foreground mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <input 
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      className="w-full bg-muted border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-foreground mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <input 
                      id="auth-password"
                      type="password"
                      required
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="w-full bg-muted border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-light text-white rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  aria-label={isLogin ? 'Switch to Sign up form' : 'Switch to Log in form'}
                  className="text-accent font-semibold hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
