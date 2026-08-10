'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupTypesService from '../../services/supportGroupTypes.service';
import type { SupportGroupType } from '../../services/supportGroupTypes.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { title: string; description: string; }

const EditSupportGroupType = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<SupportGroupType | null>(null);

  const accessIds = getAccessIds('supporter', 'support-group-types');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { title: '', description: '' } });

  useEffect(() => {
    if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
    let cancelled = false;
    supportGroupTypesService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => {
        if (cancelled || !res.success || !res.data) return;
        setItem(res.data);
        reset({ title: res.data.title, description: res.data.description || '' });
      })
      .catch(err => { if (!cancelled) { setError(extractErrorMessage(err, 'Failed to load type')); showAlert('error-alert'); } })
      .finally(() => { if (!cancelled) setLoadingItem(false); });
    return () => { cancelled = true; };
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const response = await supportGroupTypesService.editDetails(
        { unique_id: id, title: data.title, ...(data.description && { description: data.description }) },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );
      if (response.success) {
        setSuccessMessage('Support group type updated successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-group-types'), 1500);
      } else { setError(response.message || 'Failed to update support group type'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update support group type')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (<div><Navbar title="Edit Support Group Type" subtitle="Update support group type details" /><div className="xui-py-1"><FormSkeleton fields={2} /></div></div>);

  if (!item) return (
    <div>
      <Navbar title="Edit Support Group Type" subtitle="Update support group type details" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">Support group type not found or you do not have access.</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Edit Support Group Type" subtitle="Update support group type details" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
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
            {loading ? 'Updating...' : 'Update Type'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditSupportGroupType;
