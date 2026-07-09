'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { View, ViewOff, ArrowLeft } from '@carbon/icons-react';
import { APP_NAME } from '../../Globals';
import { useGeneral } from '../../context/GeneralContext';
import authService from '../../services/auth.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

const Login = () => {
  const router = useRouter();
  const { login } = useGeneral();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
      });

      if (response.success && response.data) {
        const { token, fullname, acls } = response.data;
        setSuccessMessage('Login successful! Redirecting...');
        showAlert('success-alert');
        setTimeout(() => {
          login(token, { fullname }, acls, data.remember_me);
          router.push('/dashboard');
        }, 1500);
      } else if (response.success && !response.data) {
        setOtpRequired(true);
        setOtpEmail(data.email);
        setRememberMe(data.remember_me);
        setSuccessMessage(response.message || 'OTP sent to your email');
        showAlert('success-alert');
        setIsLoading(false);
      } else {
        setErrorMessage(response.message || 'Login failed. Please try again.');
        showAlert('error-alert');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'An error occurred. Please try again.'));
      showAlert('error-alert');
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      showAlert('error-alert');
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await authService.verifyOtp({
        email: otpEmail,
        otp,
        remember_me: rememberMe,
      });

      if (response.success && response.data) {
        const { token, fullname, acls } = response.data;
        setSuccessMessage('OTP verified! Redirecting...');
        showAlert('success-alert');
        setTimeout(() => {
          login(token, { fullname }, acls, rememberMe);
          router.push('/dashboard');
        }, 1500);
      } else {
        setErrorMessage(response.message || 'OTP verification failed');
        showAlert('error-alert');
        setVerifyingOtp(false);
      }
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'OTP verification failed'));
      showAlert('error-alert');
      setVerifyingOtp(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpRequired(false);
    setOtp('');
    setOtpEmail('');
    setIsLoading(false);
    setVerifyingOtp(false);
  };

  return (
    <div className="xui-max-w-[360px] xui-w-fluid-100 xui-mx-auto">
      <img
        src="/ndc-logo2.jpeg"
        alt="NDC"
        style={{ width: '80px', height: 'auto' }}
      />
      <div className="xui-mt-2 xui-md-mt-4">
        {otpRequired ? (
          <>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1"
              style={{ background: 'none', border: 'none', color: 'var(--primary-600)', padding: 0 }}
            >
              <ArrowLeft size={16} />
              <span className="xui-font-sz-[13px]">Back to login</span>
            </button>
            <h1 className="xui-font-sz-[28px]">Verify OTP</h1>
            <p className="xui-font-sz-[14px] xui-mt-1">
              <span className="xui-opacity-4">Enter the 6-digit code sent to your email</span>
            </p>

            <form onSubmit={onVerifyOtp} className="xui-form xui-mt-1">
              <div className="xui-form-box">
                <label htmlFor="otp">OTP Code</label>
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setOtp(val);
                  }}
                />
              </div>

              <div className="xui-form-box">
                <button
                  type="submit"
                  className="xui-btn xui-btn-block xui-bdr-rad-[8px] xui-font-sz-[13px] xui-py-[16px]"
                  style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="xui-font-sz-[28px]">Sign In</h1>
            <p className="xui-font-sz-[14px] xui-mt-1">
              <span className="xui-opacity-4">Welcome to {APP_NAME}</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="xui-form xui-mt-1">
              <div className="xui-form-box">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.email.message}</span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="password">Password</label>
                <div className="xui-pos-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    style={{ paddingRight: '40px' }}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                    style={{
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--neutral-400)',
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOff size={20} /> : <View size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.password.message}</span>
                )}
              </div>

              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
                <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-[12px]">
                  <input
                    type="checkbox"
                    {...register('remember_me')}
                    className="xui-cursor-pointer"
                  />
                  <span className="xui-opacity-6">Remember me</span>
                </label>
                <Link href="/forgot-password" className="xui-font-sz-[12px]" style={{ color: 'var(--primary-600)' }}>
                  Forgot Password?
                </Link>
              </div>

              <div className="xui-form-box">
                <button
                  type="submit"
                  className="xui-btn xui-btn-block xui-bdr-rad-[8px] xui-font-sz-[13px] xui-py-[16px]"
                  style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={errorMessage} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default Login;
