'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import memberRolesService from '../../services/memberRoles.service';
import type { MemberRole } from '../../services/memberRoles.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { name: string; }

const EditMemberRole = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<MemberRole | null>(null);
  const accessIds = getAccessIds('campaign', 'member-roles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { name: '' } });

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const res = await memberRolesService.get(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) { setItem(res.data); reset({ name: res.data.name }); }
      } catch (err) { setError('Failed to load member role details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchData();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id || !item) { setError('You do not have access'); showAlert('error-alert'); return; }
    if (data.name === item.name) { setError('No changes detected'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const response = await memberRolesService.editDetails({ unique_id: id, name: data.name }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) { setSuccessMessage('Member role updated successfully'); showAlert('success-alert'); setTimeout(() => router.push('/dashboard/campaign/member-roles'), 1500); }
      else { setError(response.message || 'Failed to update member role'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update member role')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (<div><Navbar title="Edit Member Role" subtitle="Modify member role" /><div className="xui-py-1"><FormSkeleton /></div></div>);
  if (!item) return (<div><Navbar title="Edit Member Role" subtitle="Modify member role" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Member role not found or you do not have access.</p></div></div>);

  return (
    <div>
      <Navbar title="Edit Member Role" subtitle="Modify member role" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form" style={{ maxWidth: '500px' }}>
          <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}><label htmlFor="name">Name *</label><input type="text" id="name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })} />{errors.name && <span className="message">{errors.name.message}</span>}</div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>{loading ? 'Updating Member Role...' : 'Update Member Role'}</button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} /><Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditMemberRole;
