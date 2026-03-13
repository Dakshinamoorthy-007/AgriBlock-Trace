import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sprout, Truck, UserCheck, Shield,
  Phone, MessageSquare, Chrome, ChevronRight,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firebaseLogin } from '@/lib/api';

type LoginMethod = 'classic' | 'otp' | 'google';
type OtpStep = 'phone' | 'verify' | 'success';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { login } = useAuth();

  const initialRole = (searchParams.get('role') as UserRole) || 'farmer';
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('classic');

  // ── Classic login state ──────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── OTP state ────────────────────────────────────────────────────────────
  const [otpPhone, setOtpPhone] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // ── Resend countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const roles = [
    { role: 'farmer' as UserRole,    icon: Sprout, labelEn: 'Farmer',    labelTa: 'விவசாயி' },
    { role: 'middleman' as UserRole, icon: Truck,  labelEn: 'Middleman', labelTa: 'இடைத்தரகர்' },
  ];

  // ── Shared: exchange Firebase ID token for your app JWT ──────────────────
  const exchangeToken = async (idToken: string, nameOverride?: string, phoneOverride?: string) => {
    const res = await firebaseLogin({
      idToken,
      role: selectedRole,
      name: nameOverride || name || otpName || 'User',
      phone: phoneOverride || otpPhone,
    });
    // Reuse existing AuthContext login plumbing — store user + token
    // We call the existing login to persist state, but skip the API call
    // by directly setting via the context's internal setter if available,
    // OR we expose a `loginWithToken` method. For simplicity, we set
    // localStorage directly (matching AuthContext's STORAGE_KEY logic)
    localStorage.setItem('agrichain_token', res.token);
    localStorage.setItem('agrichain_auth', JSON.stringify({ user: res.user, token: res.token }));
    window.location.href = '/dashboard'; // full reload so AuthContext re-hydrates
  };

  // ── Classic login ────────────────────────────────────────────────────────
  const handleClassicLogin = async () => {
    if (!phone.trim() || phone.length !== 10) return;
    setIsLoading(true);
    try {
      await login(phone, selectedRole, name || 'User');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP: send ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (otpPhone.length !== 10) return;
    setOtpError('');
    setOtpLoading(true);

    try {
      // Initialize invisible reCAPTCHA (required by Firebase phone auth)
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' }
        );
      }

      const formattedPhone = `+91${otpPhone}`; // India prefix — adjust if needed
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setOtpStep('verify');
      setResendTimer(30);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(
        language === 'en'
          ? 'Failed to send OTP. Check the number and try again.'
          : 'OTP அனுப்ப முடியவில்லை. எண்ணை சரிபார்க்கவும்.'
      );
      // Reset reCAPTCHA on error
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP: verify ──────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    const code = otp.join('');
    if (code.length !== 6) return;

    setOtpLoading(true);
    setOtpError('');

    try {
      const result = await confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();
      setOtpStep('success');
      await exchangeToken(idToken, otpName, otpPhone);
    } catch (err: any) {
      setOtpError(
        language === 'en'
          ? 'Invalid OTP. Please try again.'
          : 'தவறான OTP. மீண்டும் முயற்சிக்கவும்.'
      );
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP input box handlers ────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const googleName = result.user.displayName || 'User';
      await exchangeToken(idToken, googleName);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google login failed:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Role selector (shared) ───────────────────────────────────────────────
  const RoleSelector = () => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">
        {language === 'en' ? 'Select Your Role' : 'உங்கள் பாத்திரத்தை தேர்வு செய்யவும்'}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {roles.map(({ role, icon: Icon, labelEn, labelTa }) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              selectedRole === role
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-8 w-8" />
            <span className="font-medium text-sm">
              {language === 'en' ? labelEn : labelTa}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Method tabs ───────────────────────────────────────────────────────────
  const MethodTabs = () => (
    <div className="flex rounded-xl bg-muted p-1 gap-1">
      {([
        { key: 'classic', label: language === 'en' ? 'Phone' : 'தொலைபேசி', icon: Phone },
        { key: 'otp',     label: language === 'en' ? 'OTP'   : 'OTP',       icon: MessageSquare },
        { key: 'google',  label: 'Google',                                   icon: Chrome },
      ] as { key: LoginMethod; label: string; icon: typeof Phone }[]).map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setLoginMethod(key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
            loginMethod === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      {/* Invisible reCAPTCHA anchor — required by Firebase */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground mb-4">
              <UserCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t('login', language)}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Select your role and sign in securely'
                : 'உங்கள் பாத்திரத்தை தேர்வு செய்து பாதுகாப்பாக உள்நுழையவும்'}
            </p>
          </div>

          <div className="card-govt">
            <div className="card-govt-header">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {language === 'en' ? 'Secure Login' : 'பாதுகாப்பான உள்நுழைவு'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <RoleSelector />
              <MethodTabs />

              {/* ── CLASSIC ─────────────────────────────────────────── */}
              {loginMethod === 'classic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {language === 'en' ? 'Your Name' : 'உங்கள் பெயர்'}
                    </label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="h-12" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}
                    </label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{phone.length}/10 digits</p>
                  </div>
                  <Button className="w-full h-14 text-base" onClick={handleClassicLogin} disabled={isLoading || phone.length !== 10}>
                    {isLoading ? 'Signing in...' : (language === 'en' ? 'Sign In' : 'உள்நுழை')}
                  </Button>
                </div>
              )}

              {/* ── OTP ─────────────────────────────────────────────── */}
              {loginMethod === 'otp' && (
                <div className="space-y-4">
                  {otpStep === 'phone' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {language === 'en' ? 'Your Name' : 'உங்கள் பெயர்'}
                        </label>
                        <Input value={otpName} onChange={e => setOtpName(e.target.value)} placeholder="Enter your name" className="h-12" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}
                        </label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 h-12 rounded-lg border border-border bg-muted text-sm font-mono text-muted-foreground">
                            +91
                          </div>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={otpPhone}
                            onChange={e => { setOtpPhone(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                            placeholder="10-digit number"
                            className="h-12 flex-1 font-mono"
                          />
                        </div>
                      </div>
                      {otpError && <p className="text-sm text-destructive">{otpError}</p>}
                      <Button className="w-full h-14 text-base" onClick={handleSendOtp} disabled={otpLoading || otpPhone.length !== 10}>
                        {otpLoading
                          ? <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          : <><MessageSquare className="h-4 w-4" /> {language === 'en' ? 'Send OTP' : 'OTP அனுப்பு'}</>}
                      </Button>
                    </>
                  )}

                  {otpStep === 'verify' && (
                    <>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {language === 'en'
                            ? `OTP sent to +91 ${otpPhone}`
                            : `+91 ${otpPhone} க்கு OTP அனுப்பப்பட்டது`}
                        </p>
                        <button
                          onClick={() => { setOtpStep('phone'); setOtp(['','','','','','']); setOtpError(''); }}
                          className="text-xs text-primary mt-1 hover:underline"
                        >
                          {language === 'en' ? 'Change number' : 'எண்ணை மாற்று'}
                        </button>
                      </div>

                      {/* 6-digit OTP boxes */}
                      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className={cn(
                              'w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all outline-none',
                              digit ? 'border-primary text-primary' : 'border-border',
                              'focus:border-primary focus:ring-2 focus:ring-primary/20'
                            )}
                          />
                        ))}
                      </div>

                      {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}

                      <Button
                        className="w-full h-14 text-base"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otp.join('').length !== 6}
                      >
                        {otpLoading
                          ? <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          : (language === 'en' ? 'Verify OTP' : 'OTP சரிபார்')}
                      </Button>

                      {/* Resend */}
                      <div className="text-center">
                        {resendTimer > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {language === 'en' ? `Resend in ${resendTimer}s` : `${resendTimer}s பிறகு மீண்டும் அனுப்பு`}
                          </p>
                        ) : (
                          <button onClick={handleSendOtp} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                            <RefreshCw className="h-3 w-3" />
                            {language === 'en' ? 'Resend OTP' : 'OTP மீண்டும் அனுப்பு'}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {otpStep === 'success' && (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
                      <p className="font-bold text-foreground">
                        {language === 'en' ? 'Verified! Redirecting...' : 'சரிபார்க்கப்பட்டது! திருப்பி அனுப்புகிறது...'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── GOOGLE ──────────────────────────────────────────── */}
              {loginMethod === 'google' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {language === 'en'
                      ? 'Sign in with your Google account. Your role will be set to the selection above.'
                      : 'உங்கள் Google கணக்கில் உள்நுழையவும். மேலே தேர்ந்தெடுத்த பாத்திரம் பயன்படுத்தப்படும்.'}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base gap-3"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        {/* Google 'G' logo */}
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {language === 'en' ? 'Continue with Google' : 'Google உடன் தொடரவும்'}
                      </>
                    )}
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;