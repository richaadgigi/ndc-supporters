'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupTypesService from '../../services/supportGroupTypes.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { title: string; description: string; }

const AddSupportGroupType = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('supporter', 'support-group-types');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { title: '', description: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await supportGroupTypesService.add(
        { title: data.title, ...(data.description && { description: data.description }) },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Support group type added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-group-types'), 1500);
      } else { setError(response.message || 'Failed to add support group type'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add support group type')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Support Group Type" subtitle="Create a new support group type" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the type details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form" style={{ maxWidth: '600px' }}>
          <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
            <label htmlFor="title">Title *</label>
            <input type="text" id="title" placeholder="e.g. Youth Wing, Diaspora Chapter" {...register('title', { required: 'Title is required', maxLength: { value: 500, message: 'Maximum 500 characters' } })} />
            {errors.title && <span className="message">{errors.title.message}</span>}
          </div>

          <div className="xui-form-box" {...(errors.description && { 'xui-error': 'true' })}>
            <label htmlFor="description">Description</label>
            <textarea id="description" rows={5} placeholder="Describe this support group type" {...register('description', { minLength: { value: 2, message: 'Minimum 2 characters' } })} />
            {errors.description && <span className="message">{errors.description.message}</span>}
          </div>

          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Adding Type...' : 'Add Type'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddSupportGroupType;
