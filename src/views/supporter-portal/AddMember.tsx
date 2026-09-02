'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import membersService from '../../services/members.service';
import memberRolesService from '../../services/memberRoles.service';
import type { MemberRole } from '../../services/memberRoles.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { support_group_unique_id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  nin: string;
  code: string;
  member_role_unique_id: string;
}

const AddMember = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);

  const accessIds = getAccessIds('supporter-portal', 'members');



  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);



  useEffect(() => {


    if (!accessIds) return;


    supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id })


      .then(res => { if (res.success && res.data) setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []); })


      .catch(() => {});


  }, [accessIds?.module_unique_id]);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { support_group_unique_id: '', firstname: '', middlename: '', lastname: '', email: '', phone_number: '', gender: '', date_of_birth: '', nin: '', code: '', member_role_unique_id: '' },
  });

  useEffect(() => {
    memberRolesService.publicGetAll({ size: 200 }).then(res => {
      if (res.success && res.data) setMemberRoles(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }    setLoading(true);
    try {
      const response = await membersService.add(
        { support_group_unique_id: data.support_group_unique_id,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          member_role_unique_id: data.member_role_unique_id,
          code: data.code,
          ...(data.middlename && { middlename: data.middlename }),
          ...(data.phone_number && { phone_number: data.phone_number }),
          ...(data.gender && { gender: data.gender }),
          ...(data.date_of_birth && { date_of_birth: data.date_of_birth }),
          ...(data.nin && { nin: data.nin }),
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Member added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/members'), 1500);
      } else { setError(response.message || 'Failed to add member'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add member')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Member" subtitle="Register a new support group member" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the member details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
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
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.member_role_unique_id && { 'xui-error': 'true' })}>
                <label htmlFor="member_role_unique_id">Member Role *</label>
                <select id="member_role_unique_id" {...register('member_role_unique_id', { required: 'Member role is required' })}>
                  <option value="">Select a role</option>
                  {memberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
                </select>
                {errors.member_role_unique_id && <span className="message">{errors.member_role_unique_id.message}</span>}
              </div>

              <div className="xui-form-box" {...(errors.code && { 'xui-error': 'true' })}>
                <label htmlFor="code">Member Code *</label>
                <input type="text" id="code" placeholder="Enter member code" {...register('code', { required: 'Code is required' })} />
                {errors.code && <span className="message">{errors.code.message}</span>}
              </div>

              <div className="xui-form-box" {...(errors.firstname && { 'xui-error': 'true' })}>
                <label htmlFor="firstname">First Name *</label>
                <input type="text" id="firstname" placeholder="Enter first name" {...register('firstname', { required: 'First name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })} />
                {errors.firstname && <span className="message">{errors.firstname.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="middlename">Middle Name</label>
                <input type="text" id="middlename" placeholder="Enter middle name" {...register('middlename')} />
              </div>

              <div className="xui-form-box" {...(errors.lastname && { 'xui-error': 'true' })}>
                <label htmlFor="lastname">Last Name *</label>
                <input type="text" id="lastname" placeholder="Enter last name" {...register('lastname', { required: 'Last name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })} />
                {errors.lastname && <span className="message">{errors.lastname.message}</span>}
              </div>
            </div>

            <div>
              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" placeholder="Enter email address" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
                {errors.email && <span className="message">{errors.email.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="phone_number">Phone Number</label>
                <input type="tel" id="phone_number" placeholder="Enter phone number" {...register('phone_number')} />
              </div>

              <div className="xui-form-box">
                <label htmlFor="gender">Gender</label>
                <select id="gender" {...register('gender')}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input type="date" id="date_of_birth" {...register('date_of_birth')} />
              </div>

              <div className="xui-form-box">
                <label htmlFor="nin">NIN</label>
                <input type="text" id="nin" placeholder="Enter 11-digit NIN" maxLength={11} {...register('nin', { pattern: { value: /^\d{11}$/, message: 'NIN must be exactly 11 digits' } })} />
                {errors.nin && <span className="message">{errors.nin.message}</span>}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
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
