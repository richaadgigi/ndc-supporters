'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import enquiriesService from '../../services/enquiries.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert, PhoneNumberInput } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { support_group_unique_id: string; name: string; email: string; phone_number: string; title: string; details: string; }

const AddEnquiry = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    defaultValues: { support_group_unique_id: '', name: '', email: '', phone_number: '', title: '', details: '' },
  });

  useEffect(() => {
    supportGroupsService.publicGetAll({ size: 200 }).then(res => {
      if (res.success && res.data) {
        const rows = Array.isArray(res.data) ? res.data : (res.data as any).rows || [];
        setSupportGroups(rows);
      }
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('');
    try {
      const payload: Record<string, any> = {
        support_group_unique_id: data.support_group_unique_id,
        name: data.name,
        email: data.email,
        title: data.title,
        details: data.details,
      };
      if (data.phone_number) payload.phone_number = data.phone_number;
      const response = await enquiriesService.publicAdd(payload);
      if (response.success) {
        setSuccessMessage('Enquiry submitted successfully'); showAlert('success-alert');
        reset();
        setTimeout(() => router.push('/dashboard/supporter-portal/enquiries'), 1500);
      } else { setError(response.message || 'Failed to submit enquiry'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to submit enquiry')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Enquiry" subtitle="Submit a new enquiry" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the enquiry details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.support_group_unique_id && { 'xui-error': 'true' })}>
                <label htmlFor="support_group_unique_id">Support Group *</label>
                <select id="support_group_unique_id" {...register('support_group_unique_id', { required: 'Support group is required' })}>
                  <option value="">--Select support group--</option>
                  {supportGroups.map(g => <option key={g.unique_id} value={g.unique_id}>{g.name}{g.state ? ` - ${g.state}` : ''}</option>)}
                </select>
                {errors.support_group_unique_id && <span className="message">{errors.support_group_unique_id.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}>
                <label htmlFor="name">Full Name *</label>
                <input type="text" id="name" placeholder="Enter full name" {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' }, maxLength: { value: 200, message: 'Maximum 200 characters' } })} />
                {errors.name && <span className="message">{errors.name.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" placeholder="Enter email address" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
                {errors.email && <span className="message">{errors.email.message}</span>}
              </div>
              <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" />
              <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" placeholder="Enter enquiry title" {...register('title', { required: 'Title is required', minLength: { value: 2, message: 'Minimum 2 characters' }, maxLength: { value: 300, message: 'Maximum 300 characters' } })} />
                {errors.title && <span className="message">{errors.title.message}</span>}
              </div>
            </div>
            <div>
              <div className="xui-form-box" {...(errors.details && { 'xui-error': 'true' })}>
                <label htmlFor="details">Details *</label>
                <textarea id="details" placeholder="Enter enquiry details" rows={10} {...register('details', { required: 'Details are required', minLength: { value: 3, message: 'Minimum 3 characters' }, maxLength: { value: 5000, message: 'Maximum 5000 characters' } })} />
                {errors.details && <span className="message">{errors.details.message}</span>}
              </div>
            </div>
          </div>
          <hr className="xui-my-2" />
          <button type="submit" disabled={loading} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Submitting Enquiry...' : 'Submit Enquiry'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddEnquiry;
