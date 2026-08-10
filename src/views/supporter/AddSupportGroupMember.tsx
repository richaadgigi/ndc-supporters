'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupMembersService from '../../services/supportGroupMembers.service';
import supportGroupsService from '../../services/supportGroups.service';
import membersService from '../../services/members.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import type { Member } from '../../services/members.service';
import { Alert, showAlert, PhoneNumberInput, DateOfBirthSelect } from '../../components/common';
import { extractErrorMessage, sortAlphabetically } from '../../utils/formatters';

const unwrap = (res: any): any[] => (res?.success && res.data ? (Array.isArray(res.data) ? res.data : res.data.rows || []) : []);

interface FormData {
  support_group_unique_id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  password: string;
  confirmPassword: string;
}

const AddSupportGroupMember = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const accessIds = getAccessIds('supporter', 'support-group-members');
  const memberAccessIds = getAccessIds('supporter', 'members');

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      support_group_unique_id: '', firstname: '', middlename: '', lastname: '', email: '',
      phone_number: '', gender: '', date_of_birth: '', password: '', confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const selectedGroupId = watch('support_group_unique_id');

  useEffect(() => {
    if (!accessIds) return;
    const fetchGroups = async () => {
      try {
        const res = await supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });
        setSupportGroups(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to load support groups:', err); }
    };
    fetchGroups();
  }, [accessIds?.module_unique_id]);

  useEffect(() => {
    if (mode !== 'existing' || !memberAccessIds) return;
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const base = { module_unique_id: memberAccessIds.module_unique_id, sub_module_unique_id: memberAccessIds.sub_module_unique_id };
        const res = memberQuery.trim().length >= 2
          ? await membersService.search({ ...base, search: memberQuery.trim(), size: 50 })
          : await membersService.getAll({ ...base, size: 50 });
        setMembers(unwrap(res));
      } catch (err) { console.error('Failed to load members:', err); setMembers([]); } finally { setMembersLoading(false); }
    };
    const timer = setTimeout(fetchMembers, 400);
    return () => clearTimeout(timer);
  }, [mode, memberQuery, memberAccessIds?.module_unique_id]);

  const onSubmitExisting = async () => {
    if (!selectedGroupId) { setError('Select a support group'); showAlert('error-alert'); return; }
    if (!selectedMemberId) { setError('Select a member'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const response = await supportGroupMembersService.portalJoinViaProfile(
        { support_group_unique_id: selectedGroupId, member_unique_id: selectedMemberId },
        { module_unique_id: accessIds!.module_unique_id, sub_module_unique_id: accessIds!.sub_module_unique_id },
      );
      if (response.success) {
        setSuccessMessage('Member joined the support group successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-group-members'), 1500);
      } else { setError(response.message || 'Failed to join support group'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to join support group')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('');
    try {
      const response = await supportGroupMembersService.publicJoin({
        support_group_unique_id: data.support_group_unique_id,
        firstname: data.firstname,
        ...(data.middlename && { middlename: data.middlename }),
        lastname: data.lastname,
        email: data.email,
        phone_number: data.phone_number,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      if (response.success) {
        setSuccessMessage('Member joined the support group successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-group-members'), 1500);
      } else { setError(response.message || 'Failed to join support group'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to join support group')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Support Group Member" subtitle="Join a new member to a support group" />
      <div className="xui-py-1">
        <a onClick={() => router.push('/dashboard/supporter/support-group-members')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">
          {mode === 'new'
            ? 'This creates a login account for the person and joins them to the selected support group. They will appear as Pending until approved.'
            : 'This joins an existing NDC member to the selected support group using their member profile. They will appear as Pending until approved.'}
        </p>

        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-mt-1">
          {(['new', 'existing'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500" style={mode === m ? { backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' } : { border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}>
              {m === 'new' ? 'New person' : 'Existing member'}
            </button>
          ))}
        </div>
        <hr className="xui-my-2" />

        <form onSubmit={mode === 'new' ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); onSubmitExisting(); }} className="xui-form">
          <div className="xui-form-box" {...(errors.support_group_unique_id && { 'xui-error': 'true' })}>
            <label htmlFor="support_group_unique_id">Support Group *</label>
            <select id="support_group_unique_id" {...register('support_group_unique_id', { required: 'Support group is required' })}>
              <option value="">Select a support group</option>
              {supportGroups.map(g => (
                <option key={g.unique_id} value={g.unique_id}>{g.name}{g.state ? ` - ${g.state}` : ''}</option>
              ))}
            </select>
            {errors.support_group_unique_id && <span className="message">{errors.support_group_unique_id.message}</span>}
          </div>

          {mode === 'existing' ? (
            <div>
              <div className="xui-form-box">
                <label htmlFor="member-search">Find Member</label>
                <input type="text" id="member-search" placeholder="Search by name, email or code" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} />
              </div>
              {membersLoading ? (
                <div className="xui-d-grid xui-grid-gap-half">
                  {[1, 2, 3].map(i => <div key={i} className="xui--skeleton xui-h-50 xui-bdr-rad-half" />)}
                </div>
              ) : members.length === 0 ? (
                <p className="xui-font-sz-85 xui-opacity-5 xui-py-1">No members found.</p>
              ) : (
                <div className="xui-d-grid xui-grid-gap-half" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {members.map(m => (
                    <label key={m.unique_id} className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-p-1 xui-bdr-rad-half xui-cursor-pointer" style={{ border: `1px solid ${selectedMemberId === m.unique_id ? 'var(--primary-600)' : 'var(--neutral-300)'}` }}>
                      <input type="radio" name="member" value={m.unique_id} checked={selectedMemberId === m.unique_id} onChange={() => setSelectedMemberId(m.unique_id)} />
                      <span>
                        <span className="xui-d-block xui-font-w-500">{m.User ? `${m.User.firstname} ${m.User.lastname}` : m.code}</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">{[m.User?.email, m.code, m.state].filter(Boolean).join(' • ')}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Member Details</p>

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

              <DateOfBirthSelect label="Date of Birth" required value={watch('date_of_birth') || ''} onChange={(val) => setValue('date_of_birth', val, { shouldValidate: true })} />
              <input type="hidden" {...register('date_of_birth', { required: 'Date of birth is required' })} />
              {errors.date_of_birth && <span className="message" style={{ color: 'var(--error)' }}>{errors.date_of_birth.message}</span>}
            </div>

            <div>
              <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Contact & Login</p>

              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" placeholder="Enter email address" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
                {errors.email && <span className="message">{errors.email.message}</span>}
              </div>

              <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" required />

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
          )}

          <hr className="xui-my-2" />
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'transparent', border: '1px solid var(--neutral-300)', color: 'inherit' }} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
              {loading ? 'Joining...' : 'Join Support Group'}
            </button>
          </div>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddSupportGroupMember;
