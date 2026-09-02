'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ViewFilled, ViewOffFilled, Password } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { Alert, showAlert } from '../../components/common';
import { useGeneral } from '../../context/GeneralContext';
import authService from '../../services/auth.service';
import usersService from '../../services/users.service';

interface PasswordFormData {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user, logout } = useGeneral();
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>();

  useEffect(() => {
    usersService.getProfile()
      .then(res => {
        if (res.success && res.data) {
          setEmail(res.data.email || '');
          setRoleName(res.data.Role?.name || '');
        }
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await authService.changePassword({
        oldPassword: data.oldPassword,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      if (res.success !== false) {
        setSuccessMessage('Password changed successfully! Logging you out...');
        showAlert('success-alert');
        reset();
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to change password');
        showAlert('error-alert');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.data?.errors?.[0]?.msg || 'Failed to change password';
      setErrorMessage(msg);
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar title="Profile" />
      <div className="xui-py-1-half xui-px-1 xui-lg-px-2">
        <h2 className="xui-font-sz-[22px] xui-font-w-700" style={{ color: 'var(--neutral-900)' }}>Profile</h2>
        <p className="xui-font-sz-[13px] xui-mt-[4px]" style={{ color: 'var(--neutral-500)' }}>View your details and change your password</p>

        <div className="xui-d-grid xui-lg-grid-col-2 xui-grid-gap-1-half xui-mt-1-half">
          <div className="xui-bg-white xui-bdr-rad-[8px] xui-p-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
            <h3 className="xui-font-sz-[16px] xui-font-w-600 xui-pb-1" style={{ color: 'var(--neutral-900)', borderBottom: '1px solid var(--neutral-100)' }}>
              Personal Details
            </h3>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mt-1">
              <div
                className="xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#111827' }}
              >
                <span className="xui-text-white xui-font-sz-[22px] xui-font-w-700">
                  {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="xui-font-sz-[17px] xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>
                  {user?.fullname || 'User'}
                </p>
                <p className="xui-font-sz-[13px] xui-mt-[2px]" style={{ color: 'var(--neutral-500)' }}>
                  {roleName || 'User'}
                </p>
              </div>
            </div>

            <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1 xui-mt-1-half">
              <div>
                <p className="xui-font-sz-[11px] xui-font-w-600 xui-text-uppercase" style={{ color: 'var(--neutral-400)', letterSpacing: '0.5px' }}>Email</p>
                <p className="xui-font-sz-[14px] xui-mt-[4px]" style={{ color: 'var(--neutral-800)' }}>{email || user?.email || '—'}</p>
              </div>
              <div>
                <p className="xui-font-sz-[11px] xui-font-w-600 xui-text-uppercase" style={{ color: 'var(--neutral-400)', letterSpacing: '0.5px' }}>Name</p>
                <p className="xui-font-sz-[14px] xui-mt-[4px]" style={{ color: 'var(--neutral-800)' }}>{user?.fullname || '—'}</p>
              </div>
            </div>
          </div>

          <div className="xui-bg-white xui-bdr-rad-[8px] xui-p-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-pb-1" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
              <Password size={18} style={{ color: 'var(--neutral-600)' }} />
              <h3 className="xui-font-sz-[16px] xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>
                Change Password
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="xui-form xui-d-flex xui-flex-dir-column xui-grid-gap-1 xui-mt-1">
              <div>
                <label className="xui-font-sz-[13px] xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>Old Password</label>
                <div className="xui-pos-relative xui-mt-[6px]">
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="xui-font-5 xui-w-fluid-100 xui-bdr-rad-[6px] xui-p-[10px] xui-font-sz-[14px]"
                    style={{ border: `1px solid ${errors.oldPassword ? 'var(--error)' : 'var(--neutral-300)'}`, outline: 'none', paddingRight: '40px' }}
                    placeholder="Enter your current password"
                    {...register('oldPassword', { required: 'Old password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-cursor-pointer"
                    style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-400)' }}
                  >
                    {showOld ? <ViewOffFilled size={18} /> : <ViewFilled size={18} />}
                  </button>
                </div>
                {errors.oldPassword && <p className="xui-font-sz-[12px] xui-mt-[4px]" style={{ color: 'var(--error)' }}>{errors.oldPassword.message}</p>}
              </div>

              <div>
                <label className="xui-font-sz-[13px] xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>New Password</label>
                <div className="xui-pos-relative xui-mt-[6px]">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="xui-font-5 xui-w-fluid-100 xui-bdr-rad-[6px] xui-p-[10px] xui-font-sz-[14px]"
                    style={{ border: `1px solid ${errors.password ? 'var(--error)' : 'var(--neutral-300)'}`, outline: 'none', paddingRight: '40px' }}
                    placeholder="Min 8 chars, uppercase, lowercase, number, special"
                    {...register('password', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
                        message: 'Must include uppercase, lowercase, number, and special character',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-cursor-pointer"
                    style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-400)' }}
                  >
                    {showNew ? <ViewOffFilled size={18} /> : <ViewFilled size={18} />}
                  </button>
                </div>
                {errors.password && <p className="xui-font-sz-[12px] xui-mt-[4px]" style={{ color: 'var(--error)' }}>{errors.password.message}</p>}
              </div>

              <div>
                <label className="xui-font-sz-[13px] xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>Confirm New Password</label>
                <div className="xui-pos-relative xui-mt-[6px]">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="xui-font-5 xui-w-fluid-100 xui-bdr-rad-[6px] xui-p-[10px] xui-font-sz-[14px]"
                    style={{ border: `1px solid ${errors.confirmPassword ? 'var(--error)' : 'var(--neutral-300)'}`, outline: 'none', paddingRight: '40px' }}
                    placeholder="Re-enter your new password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-cursor-pointer"
                    style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-400)' }}
                  >
                    {showConfirm ? <ViewOffFilled size={18} /> : <ViewFilled size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="xui-font-sz-[12px] xui-mt-[4px]" style={{ color: 'var(--error)' }}>{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="xui-w-fluid-100 xui-py-[12px] xui-bdr-rad-[6px] xui-text-white xui-font-sz-[14px] xui-font-w-600 xui-cursor-pointer"
                style={{ backgroundColor: loading ? 'var(--neutral-400)' : 'var(--primary-600)', border: 'none', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={errorMessage} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </>
  );
}
