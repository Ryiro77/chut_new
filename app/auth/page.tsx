'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { signIn } from 'next-auth/react'
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devUsername, setDevUsername] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);

  // Get the callbackUrl, defaulting to the previous page or home
  const callbackUrl = searchParams.get('callbackUrl') || pathname || '/';
  
  // Check if callback URL is a user-specific page
  const isUserPage = callbackUrl.startsWith('/account') || callbackUrl.startsWith('/orders');
  const finalCallbackUrl = isUserPage ? '/' : callbackUrl;

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
      const result = await signIn('credentials', {
        phone,
        otp,
        redirect: false,
        callbackUrl: finalCallbackUrl
      });

      if (result?.error) {
        throw new Error('Invalid OTP');
      }

      toast.success('Login successful!');
      router.push(finalCallbackUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
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
        callbackUrl: finalCallbackUrl
      });

      if (result?.error) {
        throw new Error('Invalid credentials');
      }

      toast.success('Login successful!');
      router.push(finalCallbackUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

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
                  Enter your phone number to receive a WhatsApp OTP
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
                      disabled={otpSent || loading}
                    />
                  </div>

                  {otpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
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
                      onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {otpSent ? 'Verify OTP' : 'Send OTP'}
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