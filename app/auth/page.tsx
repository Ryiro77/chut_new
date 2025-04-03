'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function AuthContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [devUsername, setDevUsername] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);

  // Get the callbackUrl, defaulting to home
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.replace(callbackUrl);
    }
  }, [status, session, callbackUrl]);

  const handleSendOTP = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/whatsapp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP');
      }

      setOtpVerified(true);
      toast.success('OTP verified successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignIn = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        phone,
        otp,
        name,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to sign in');
      }

      // Show success message
      toast.success('Login successful!');
      
      // Force a full page refresh and prevent going back to login
      window.location.replace(callbackUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('development', {
        username: devUsername,
        password: devPassword,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Invalid credentials');
      }

      // Show success message
      toast.success('Login successful!');
      
      // Force a full page refresh and prevent going back to login
      window.location.replace(callbackUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      if (showDevLogin) {
        handleDevLogin();
      } else if (otpVerified) {
        handleCompleteSignIn();
      } else if (otpSent) {
        handleVerifyOTP();
      } else {
        handleSendOTP();
      }
    }
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Container>
            <div className="flex items-center justify-center min-h-[80vh]">
              <Card className="w-full max-w-md p-6">
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </Card>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Container>
          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Sign in</CardTitle>
                <CardDescription>
                  {!otpVerified 
                    ? 'Enter your phone number to receive a WhatsApp OTP'
                    : 'Enter your name to complete sign in'}
                </CardDescription>
              </CardHeader>
              
              {!showDevLogin ? (
                // WhatsApp Login Form
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your 10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={otpSent || loading || otpVerified}
                    />
                  </div>

                  {otpSent && !otpVerified && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={loading}
                      />
                    </div>
                  )}

                  {otpVerified && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={loading}
                      />
                    </div>
                  )}
                </CardContent>
              ) : (
                // Development Login Form
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={devUsername}
                      onChange={(e) => setDevUsername(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={devPassword}
                      onChange={(e) => setDevPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              )}

              <CardFooter className="flex flex-col gap-2">
                {!showDevLogin ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={otpVerified ? handleCompleteSignIn : (otpSent ? handleVerifyOTP : handleSendOTP)}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {otpVerified ? 'Complete Sign In' : (otpSent ? 'Verify OTP' : 'Send OTP')}
                    </Button>
                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowDevLogin(true)}
                      >
                        Development Login
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={handleDevLogin}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowDevLogin(false)}
                    >
                      Back to WhatsApp Login 
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}