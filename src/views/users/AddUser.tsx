'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, View, ViewOff } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import usersService from '../../services/users.service';
import type { RoleOption } from '../../services/users.service';
import { Alert, showAlert, DateOfBirthSelect, PhoneNumberInput } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface UserFormData {
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone_number: string;
  alt_phone_number: string;
  gender: string;
  date_of_birth: string;
  address: string;
  country: string;
  state: string;
  city: string;
  role_unique_id: string;
}

const AddUser = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const accessIds = getAccessIds('administration', 'users');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      firstname: '',
      middlename: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone_number: '',
      alt_phone_number: '',
      gender: '',
      date_of_birth: '',
      address: '',
      country: '',
      state: '',
      city: '',
      role_unique_id: '',
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await usersService.getRoles();
        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setRoles(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        gender: data.gender,
        ...(data.middlename && { middlename: data.middlename }),
        ...(data.phone_number && { phone_number: data.phone_number }),
        ...(data.alt_phone_number && { alt_phone_number: data.alt_phone_number }),
        ...(data.date_of_birth && { date_of_birth: data.date_of_birth }),
        ...(data.address && { address: data.address }),
        ...(data.country && { country: data.country }),
        ...(data.state && { state: data.state }),
        ...(data.city && { city: data.city }),
        ...(data.role_unique_id && { role_unique_id: data.role_unique_id }),
      };

      const response = await usersService.addUser(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage(response.message || 'User created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          router.push('/dashboard/admin/users');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create user');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create user'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoles) {
    return (
      <div>
        <Navbar title="Add User" subtitle="Create a new user account" />
        <div className="xui-py-1">
          <FormSkeleton fields={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add User" subtitle="Create a new user account" />
      <div className="xui-py-1">
        <a
          onClick={() => router.back()}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the user details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.firstname && { 'xui-error': 'true' })}>
                <label htmlFor="firstname">First Name *</label>
                <input
                  type="text"
                  id="firstname"
                  placeholder="Enter first name"
                  {...register('firstname', {
                    required: 'First name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.firstname && (
                  <span className="message">
                    {errors.firstname.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="middlename">Middle Name</label>
                <input
                  type="text"
                  id="middlename"
                  placeholder="Enter middle name"
                  {...register('middlename')}
                />
              </div>

              <div className="xui-form-box" {...(errors.lastname && { 'xui-error': 'true' })}>
                <label htmlFor="lastname">Last Name *</label>
                <input
                  type="text"
                  id="lastname"
                  placeholder="Enter last name"
                  {...register('lastname', {
                    required: 'Last name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.lastname && (
                  <span className="message">
                    {errors.lastname.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email address"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && (
                  <span className="message">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.password && { 'xui-error': 'true' })}>
                <label htmlFor="password">Password *</label>
                <div className="xui-pos-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter password"
                    style={{ paddingRight: '40px' }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                    style={{
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOff size={20} /> : <View size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="message">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.confirmPassword && { 'xui-error': 'true' })}>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="xui-pos-relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Confirm password"
                    style={{ paddingRight: '40px' }}
                    {...register('confirmPassword', {
                      required: 'Confirm password is required',
                      validate: (value) => value === watch('password') || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                    style={{
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <ViewOff size={20} /> : <View size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="message">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" />

              <PhoneNumberInput control={control} name="alt_phone_number" label="Alt Phone Number" id="alt_phone_number" />

              <div className="xui-form-box" {...(errors.gender && { 'xui-error': 'true' })}>
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="">--Select gender--</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <span className="message">
                    {errors.gender.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <DateOfBirthSelect
                  label="Date of Birth"
                  value={watch('date_of_birth') || ''}
                  onChange={(val) => setValue('date_of_birth', val)}
                />
                <input type="hidden" {...register('date_of_birth')} />
              </div>

              <div className="xui-form-box">
                <label htmlFor="role_unique_id" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Role <a href="/dashboard/roles/add" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 500, backgroundColor: 'var(--primary-100)', padding: '2px 10px', borderRadius: '20px', textDecoration: 'none' }}>+ Add new</a></label>
                <select
                  id="role_unique_id"
                  {...register('role_unique_id')}
                >
                  <option value="">--Select role (optional)--</option>
                  {roles.map((role) => (
                    <option key={role.unique_id} value={role.unique_id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box" {...(errors.address && { 'xui-error': 'true' })}>
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  placeholder="Enter address"
                  {...register('address', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 300, message: 'Maximum 300 characters' },
                  })}
                />
                {errors.address && (
                  <span className="message">
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.country && { 'xui-error': 'true' })}>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  placeholder="Enter country"
                  {...register('country', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.country && (
                  <span className="message">
                    {errors.country.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.state && { 'xui-error': 'true' })}>
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  placeholder="Enter state"
                  {...register('state', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.state && (
                  <span className="message">
                    {errors.state.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box" {...(errors.city && { 'xui-error': 'true' })}>
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  placeholder="Enter city"
                  {...register('city', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.city && (
                  <span className="message">
                    {errors.city.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddUser;
