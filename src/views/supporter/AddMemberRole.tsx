'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import memberRolesService from '../../services/memberRoles.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { name: string; }

const AddMemberRole = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const accessIds = getAccessIds('supporter', 'member-roles');
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { name: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await memberRolesService.add({ name: data.name }, { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });
      if (response.success) { setSuccessMessage('Member role added successfully'); showAlert('success-alert'); setTimeout(() => router.push('/dashboard/supporter/member-roles'), 1500); }
      else { setError(response.message || 'Failed to add member role'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add member role')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Member Role" subtitle="Create a new member role" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form" style={{ maxWidth: '500px' }}>
          <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}><label htmlFor="name">Name *</label><input type="text" id="name" placeholder="Enter member role name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })} />{errors.name && <span className="message">{errors.name.message}</span>}</div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>{loading ? 'Adding Member Role...' : 'Add Member Role'}</button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} /><Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddMemberRole;
