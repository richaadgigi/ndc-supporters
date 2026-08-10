'use client';
import type { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import type { SupportGroupFormData } from './types';
import { PhoneNumberInput, DateOfBirthSelect } from '../../../components/common';

interface Props {
  register: UseFormRegister<SupportGroupFormData>;
  control: Control<SupportGroupFormData>;
  errors: FieldErrors<SupportGroupFormData>;
  dobValue: string;
  onDobChange: (value: string) => void;
  passwordValue: string;
}

const SupportGroupLeaderTab = ({ register, control, errors, dobValue, onDobChange, passwordValue }: Props) => (
  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Leader Details</p>

      <div className="xui-form-box" {...(errors.firstname && { 'xui-error': 'true' })}>
        <label htmlFor="firstname">First Name *</label>
        <input type="text" id="firstname" placeholder="Enter first name" {...register('firstname', { required: 'First name is required', maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
        {errors.firstname && <span className="message">{errors.firstname.message}</span>}
      </div>

      <div className="xui-form-box">
        <label htmlFor="middlename">Middle Name</label>
        <input type="text" id="middlename" placeholder="Enter middle name" {...register('middlename', { maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
      </div>

      <div className="xui-form-box" {...(errors.lastname && { 'xui-error': 'true' })}>
        <label htmlFor="lastname">Last Name *</label>
        <input type="text" id="lastname" placeholder="Enter last name" {...register('lastname', { required: 'Last name is required', maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
        {errors.lastname && <span className="message">{errors.lastname.message}</span>}
      </div>

      <div className="xui-form-box" {...(errors.gender && { 'xui-error': 'true' })}>
        <label htmlFor="gender">Gender *</label>
        <select id="gender" {...register('gender', { required: 'Gender is required' })}>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <span className="message">{errors.gender.message}</span>}
      </div>

      <DateOfBirthSelect label="Date of Birth" required value={dobValue} onChange={onDobChange} />
      <input type="hidden" {...register('date_of_birth', { required: 'Date of birth is required' })} />
      {errors.date_of_birth && <span className="message" style={{ color: 'var(--error)' }}>{errors.date_of_birth.message}</span>}
    </div>

    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Login Details</p>

      <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
        <label htmlFor="email">Email *</label>
        <input type="email" id="email" placeholder="Enter email address" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
        {errors.email && <span className="message">{errors.email.message}</span>}
      </div>

      <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" required />

      <div className="xui-form-box">
        <label htmlFor="country">Country</label>
        <input type="text" id="country" placeholder="Enter country" {...register('country', { maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
      </div>

      <div className="xui-form-box" {...(errors.password && { 'xui-error': 'true' })}>
        <label htmlFor="password">Password *</label>
        <input type="password" id="password" placeholder="Enter password" {...register('password', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Minimum 8 characters' },
          maxLength: { value: 50, message: 'Maximum 50 characters' },
          validate: (value) =>
            (/[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^a-zA-Z0-9]/.test(value))
            || 'Must include an uppercase, lowercase, number and special character',
        })} />
        {errors.password && <span className="message">{errors.password.message}</span>}
      </div>

      <div className="xui-form-box" {...(errors.confirmPassword && { 'xui-error': 'true' })}>
        <label htmlFor="confirmPassword">Confirm Password *</label>
        <input type="password" id="confirmPassword" placeholder="Re-enter password" {...register('confirmPassword', {
          required: 'Confirm password is required',
          validate: (value) => value === passwordValue || 'Passwords are different',
        })} />
        {errors.confirmPassword && <span className="message">{errors.confirmPassword.message}</span>}
      </div>
    </div>
  </div>
);

export default SupportGroupLeaderTab;
