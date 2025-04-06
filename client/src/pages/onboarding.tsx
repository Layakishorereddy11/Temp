import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, loading, error, signInWithEmail, createUserWithEmail, signInWithGoogleProvider } = useFirebaseAuth();
  const { toast } = useToast();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form values
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Form visibility
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  // Handle authentication
  useEffect(() => {
    if (user) {
      // If user is authenticated, skip to success step or redirect to dashboard
      if (currentStep < 4) {
        setCurrentStep(4);
      }
    }
  }, [user, currentStep]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Step navigation
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };
  
  // Form submission handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(loginEmail, loginPassword);
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUserWithEmail(signupName, signupEmail, signupPassword);
  };
  
  // Finish onboarding
  const finishOnboarding = () => {
    setLocation('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Onboarding carousel */}
        <div className="onboarding-carousel">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="onboarding-step active">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 mb-6">
                  <svg className="h-full w-full text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-primary-500 mb-4">Welcome to Jobs Streak</h1>
                <p className="text-gray-600 mb-8">Track your job applications, maintain your daily streak, and compete with friends.</p>
                
                <div className="space-y-6 py-4">
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">🔍</span>
                    <div>
                      <h3 className="font-semibold">Automatic Job Detection</h3>
                      <p className="text-sm text-gray-500">We automatically detect when you're on a job application site.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">🔥</span>
                    <div>
                      <h3 className="font-semibold">Streak System</h3>
                      <p className="text-sm text-gray-500">Apply to at least 20 jobs daily to maintain your streak.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">👥</span>
                    <div>
                      <h3 className="font-semibold">Social Features</h3>
                      <p className="text-sm text-gray-500">Invite friends to view each other's streaks and share job URLs.</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => goToStep(2)}
                  className="mt-8 w-full"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Features */}
          {currentStep === 2 && (
            <div className="onboarding-step active">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Powerful Features</h2>
                <p className="text-gray-600 mb-8">Everything you need to supercharge your job search.</p>
                
                <div className="space-y-6 py-4">
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">📊</span>
                    <div>
                      <h3 className="font-semibold">Beautiful Statistics</h3>
                      <p className="text-sm text-gray-500">Visualize your application history with elegant charts.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">💾</span>
                    <div>
                      <h3 className="font-semibold">Cloud Sync</h3>
                      <p className="text-sm text-gray-500">Your data syncs across devices using Firebase.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 text-left">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <h3 className="font-semibold">Leaderboard</h3>
                      <p className="text-sm text-gray-500">Compete with friends and stay motivated together.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => goToStep(3)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Authentication */}
          {currentStep === 3 && (
            <div className="onboarding-step active">
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Get Started</h2>
                
                <div className="auth-forms">
                  {/* Login Form */}
                  {!showSignupForm ? (
                    <form onSubmit={handleLogin}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="login-email">Email</Label>
                          <Input 
                            type="email" 
                            id="login-email" 
                            placeholder="your@email.com" 
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="login-password">Password</Label>
                          <Input 
                            type="password" 
                            id="login-password" 
                            placeholder="********" 
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required 
                          />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                      </div>
                      
                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={signInWithGoogleProvider}
                          disabled={loading}
                        >
                          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="currentColor"></path>
                          </svg>
                          Sign in with Google
                        </Button>
                      </div>
                      
                      <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button 
                          type="button"
                          className="font-medium text-primary-500 hover:text-primary-600"
                          onClick={() => setShowSignupForm(true)}
                        >
                          Sign Up
                        </button>
                      </p>
                    </form>
                  ) : (
                    /* Signup Form */
                    <form onSubmit={handleSignup}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input 
                            type="text" 
                            id="signup-name" 
                            placeholder="John Doe" 
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="signup-email">Email</Label>
                          <Input 
                            type="email" 
                            id="signup-email" 
                            placeholder="your@email.com" 
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="signup-password">Password</Label>
                          <Input 
                            type="password" 
                            id="signup-password" 
                            placeholder="********" 
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required 
                          />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </div>
                      
                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={signInWithGoogleProvider}
                          disabled={loading}
                        >
                          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="currentColor"></path>
                          </svg>
                          Sign up with Google
                        </Button>
                      </div>
                      
                      <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <button 
                          type="button"
                          className="font-medium text-primary-500 hover:text-primary-600"
                          onClick={() => setShowSignupForm(false)}
                        >
                          Sign In
                        </button>
                      </p>
                    </form>
                  )}
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(2)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="onboarding-step active">
              <div className="text-center">
                <div className="success-animation mx-auto mb-6">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
                <p className="text-gray-600 mb-8">Your account is ready. You can now track your job applications and compete with friends.</p>
                
                <Button
                  onClick={finishOnboarding}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
