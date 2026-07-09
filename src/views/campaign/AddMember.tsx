'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import membersService from '../../services/members.service';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import memberRolesService from '../../services/memberRoles.service';
import type { MemberRole } from '../../services/memberRoles.service';
import { Alert, showAlert, PhoneNumberInput, DateOfBirthSelect } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData {
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  code: string;
  nin: string;
  candidate_unique_id: string;
  member_role_unique_id: string;
}

const AddMember = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);

  const accessIds = getAccessIds('campaign', 'members');

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      firstname: '', middlename: '', lastname: '', email: '', phone_number: '',
      gender: '', date_of_birth: '', code: '', nin: '', candidate_unique_id: '', member_role_unique_id: '',
    },
  });

  useEffect(() => {
    if (!accessIds) return;
    const params = { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id };
    const loadDropdowns = async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          candidatesService.publicGetAll({ size: 200, module_unique_id: accessIds.module_unique_id }),
          memberRolesService.getAll({ size: 100, ...params }),
        ]);
        if (cRes.success && cRes.data) setCandidates(Array.isArray(cRes.data) ? cRes.data : (cRes.data as any).rows || []);
        if (rRes.success && rRes.data) setMemberRoles(Array.isArray(rRes.data) ? rRes.data : rRes.data.rows || []);
      } catch {}
    };
    loadDropdowns();
  }, [accessIds?.module_unique_id]);

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        member_role_unique_id: data.member_role_unique_id,
        candidate_unique_id: data.candidate_unique_id,
        code: data.code,
      };
      if (data.middlename) payload.middlename = data.middlename;
      if (data.phone_number) payload.phone_number = data.phone_number;
      if (data.gender) payload.gender = data.gender;
      if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;
      if (data.nin) payload.nin = data.nin;

      const response = await membersService.add(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });
      if (response.success) {
        setSuccessMessage('Member added successfully');
        showAlert('success-alert');
        reset();
        setTimeout(() => router.push('/dashboard/campaign/members'), 1500);
      } else {
        setError(response.message || 'Failed to add member');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add member'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Add Member" subtitle="Register a new campaign member" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the member details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.firstname && { 'xui-error': 'true' })}>
                <label htmlFor="firstname">First Name *</label>
                <input type="text" id="firstname" placeholder="Enter first name" {...register('firstname', { required: 'First name is required', minLength: { value: 1, message: 'Minimum 1 character' }, maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
                {errors.firstname && <span className="message">{errors.firstname.message}</span>}
              </div>
              <div className="xui-form-box">
                <label htmlFor="middlename">Middle Name</label>
                <input type="text" id="middlename" placeholder="Enter middle name" {...register('middlename', { maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
              </div>
              <div className="xui-form-box" {...(errors.lastname && { 'xui-error': 'true' })}>
                <label htmlFor="lastname">Last Name *</label>
                <input type="text" id="lastname" placeholder="Enter last name" {...register('lastname', { required: 'Last name is required', minLength: { value: 1, message: 'Minimum 1 character' }, maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
                {errors.lastname && <span className="message">{errors.lastname.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" placeholder="Enter email address" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
                {errors.email && <span className="message">{errors.email.message}</span>}
              </div>
              <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" />
              <div className="xui-form-box" {...(errors.gender && { 'xui-error': 'true' })}>
                <label htmlFor="gender">Gender</label>
                <select id="gender" {...register('gender')}>
                  <option value="">--Select gender--</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="message">{errors.gender.message}</span>}
              </div>
              <div className="xui-form-box">
                <DateOfBirthSelect
                  label="Date of Birth"
                  value={watch('date_of_birth') || ''}
                  onChange={(val) => setValue('date_of_birth', val, { shouldValidate: true })}
                />
                <input type="hidden" {...register('date_of_birth')} />
              </div>
            </div>
            <div>
              <div className="xui-form-box" {...(errors.code && { 'xui-error': 'true' })}>
                <label htmlFor="code">Member Code *</label>
                <input type="text" id="code" placeholder="Enter member reference code" {...register('code', { required: 'Member code is required', minLength: { value: 3, message: 'Minimum 3 characters' }, maxLength: { value: 50, message: 'Maximum 50 characters' } })} />
                {errors.code && <span className="message">{errors.code.message}</span>}
              </div>
              <div className="xui-form-box">
                <label htmlFor="nin">NIN</label>
                <input type="text" id="nin" placeholder="Enter 11-digit NIN" maxLength={11} {...register('nin', { pattern: { value: /^\d{10,11}$/, message: 'NIN must be 10-11 digits' } })} />
                {errors.nin && <span className="message">{errors.nin.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.candidate_unique_id && { 'xui-error': 'true' })}>
                <label htmlFor="candidate_unique_id">Candidate *</label>
                <select id="candidate_unique_id" {...register('candidate_unique_id', { required: 'Candidate is required' })}>
                  <option value="">Select a candidate</option>
                  {candidates.map((c) => (
                    <option key={c.unique_id} value={c.unique_id}>{c.name}{(c as any).Position?.name ? ` (${(c as any).Position.name})` : c.state ? ` - ${c.state}` : ''}</option>
                  ))}
                </select>
                {errors.candidate_unique_id && <span className="message">{errors.candidate_unique_id.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.member_role_unique_id && { 'xui-error': 'true' })}>
                <label htmlFor="member_role_unique_id">Member Role *</label>
                <select id="member_role_unique_id" {...register('member_role_unique_id', { required: 'Member role is required' })}>
                  <option value="">Select a role</option>
                  {memberRoles.map((r) => (
                    <option key={r.unique_id} value={r.unique_id}>{r.name}</option>
                  ))}
                </select>
                {errors.member_role_unique_id && <span className="message">{errors.member_role_unique_id.message}</span>}
              </div>
            </div>
          </div>
          <hr className="xui-my-2" />
          <button type="submit" disabled={loading} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Adding Member...' : 'Add Member'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddMember;
