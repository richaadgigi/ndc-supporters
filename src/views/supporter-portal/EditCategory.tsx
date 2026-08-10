'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Checkmark } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import categoriesService from '../../services/categories.service';
import type { Category } from '../../services/categories.service';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { name: string; }

const EditCategory = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Category | null>(null);

  const accessIds = getAccessIds('supporter-portal', 'categories');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { name: '' } });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const res = await categoriesService.portalGetOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) { setItem(res.data); reset({ name: res.data.name }); }
      } catch { setError('Failed to load category details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const response = await categoriesService.portalEditDetails({ unique_id: id, name: data.name }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) {
        setSuccessMessage('Category updated successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/categories'), 1500);
      } else { setError(response.message || 'Failed to update category'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update category')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  const handleApproveConfirm = async (): Promise<{ success: boolean; message: string }> => {
    if (!moduleId || !subModuleId || !id) return { success: false, message: 'Missing access information' };
    const response = await categoriesService.portalApprove({ unique_id: id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
    if (response.success) setItem(prev => prev ? { ...prev, approved_by: 'approved', status: 1 } : prev);
    return response;
  };

  if (loadingItem) return (<div><Navbar title="Edit Category" subtitle="Modify category details" /><div className="xui-py-1"><FormSkeleton /></div></div>);
  if (!item) return (<div><Navbar title="Edit Category" subtitle="Modify category details" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Category not found or you do not have access.</p></div></div>);

  const isPending = item.approved_by === null;

  return (
    <div>
      <Navbar title="Edit Category" subtitle="Modify category details" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          {isPending && (
            <button
              type="button"
              onClick={() => modalShow('approve-category-modal')}
              className="xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none' }}
            >
              <span className="icon-container"><Checkmark size={16} /></span>
              Approve Category
            </button>
          )}
        </div>

        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
          <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
            <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}>
              <label htmlFor="name">Name *</label>
              <input type="text" id="name" {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Minimum 3 characters' }, maxLength: { value: 200, message: 'Maximum 200 characters' } })} />
              {errors.name && <span className="message">{errors.name.message}</span>}
            </div>
            <button type="submit" disabled={loading || !isPending} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: isPending ? 'var(--primary-600)' : 'var(--neutral-300)', color: isPending ? 'var(--secondary-700)' : 'var(--neutral-500)', cursor: isPending ? 'pointer' : 'not-allowed' }}>
              {loading ? 'Updating...' : isPending ? 'Update Category' : 'Already Approved'}
            </button>
            {!isPending && <p className="xui-font-sz-75 xui-opacity-5 xui-mt-half">Approved categories cannot be edited.</p>}
          </form>

          <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)', alignSelf: 'start' }}>
            <p className="xui-font-sz-75 xui-font-w-600 xui-opacity-5 xui-mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details</p>
            <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
              <span className="xui-font-sz-80 xui-opacity-5">Status</span>
              <span className={`xui-badge ${item.status === 1 ? 'xui-badge-success' : item.status === 2 ? 'xui-badge-warning' : 'xui-badge-danger'} xui-font-sz-70`}>
                {item.status === 1 ? 'Active' : item.status === 2 ? 'Pending' : 'Inactive'}
              </span>
            </div>
            {item.Creator && (
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <span className="xui-font-sz-80 xui-opacity-5">Created By</span>
                <div className="xui-text-right">
                  <p className="xui-font-sz-80 xui-font-w-500">{item.Creator.firstname} {item.Creator.lastname}</p>
                  {item.Creator.Role && <p className="xui-font-sz-70 xui-opacity-5">{item.Creator.Role.name}</p>}
                </div>
              </div>
            )}
            {item.Approver && (
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <span className="xui-font-sz-80 xui-opacity-5">Approved By</span>
                <span className="xui-font-sz-80 xui-font-w-500">{(item.Approver as any).firstname} {(item.Approver as any).lastname}</span>
              </div>
            )}
            <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-half">
              <span className="xui-font-sz-80 xui-opacity-5">Created</span>
              <span className="xui-font-sz-80">{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal
        id="approve-category-modal"
        title="Approve Category"
        message="Are you sure you want to approve the category"
        itemName={item.name}
        confirmText="Approve"
        confirmingText="Approving..."
        confirmButtonStyle="success"
        onConfirm={handleApproveConfirm}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default EditCategory;
