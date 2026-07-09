'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Checkmark } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import announcementsService from '../../services/announcements.service';
import type { Announcement } from '../../services/announcements.service';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { title: string; start_date: string; end_date: string; }

const EditAnnouncement = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Announcement | null>(null);
  const [description, setDescription] = useState('');
  const [editorReady, setEditorReady] = useState(false);

  const accessIds = getAccessIds('candidate-portal', 'announcements');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { title: '', start_date: '', end_date: '' } });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      const parseDate = (d: string | null) => d ? d.split('T')[0].split(' ')[0] : '';
      try {
        const res = await announcementsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) {
          setItem(res.data);
          reset({ title: res.data.title, start_date: parseDate(res.data.start_date), end_date: parseDate(res.data.end_date) });
          setDescription(res.data.description || '');
          setEditorReady(true);
        }
      } catch (err) { setError('Failed to load announcement details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
    const cleanDescription = description && description !== '<p><br></p>' ? sanitizeHTML(description) : '';
    try {
      const detailsRes = await announcementsService.editDetails({ unique_id: id, title: data.title }, params);
      if (!detailsRes.success) { setError(detailsRes.message || 'Failed to update announcement'); showAlert('error-alert'); return; }

      if (cleanDescription) {
        const descRes = await announcementsService.editDescription({ unique_id: id, description: cleanDescription }, params);
        if (!descRes.success) { setError(descRes.message || 'Failed to update description'); showAlert('error-alert'); return; }
      }

      if (data.start_date || data.end_date) {
        const timelinePayload: Record<string, any> = { unique_id: id };
        if (data.start_date) timelinePayload.start_date = `${data.start_date} 00:00`;
        if (data.end_date) timelinePayload.end_date = `${data.end_date} 00:00`;
        const timelineRes = await announcementsService.editTimeline(timelinePayload, params);
        if (!timelineRes.success) { setError(timelineRes.message || 'Failed to update timeline'); showAlert('error-alert'); return; }
      }

      setSuccessMessage('Announcement updated successfully'); showAlert('success-alert');
      setTimeout(() => router.push('/dashboard/candidate-portal/announcements'), 1500);
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update announcement')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  const handleApproveConfirm = async (): Promise<{ success: boolean; message: string }> => {
    if (!moduleId || !subModuleId || !id) return { success: false, message: 'Missing access information' };
    const response = await announcementsService.approve({ unique_id: id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
    if (response.success) setItem(prev => prev ? { ...prev, approved_by: 'approved', status: 1 } : prev);
    return response;
  };

  if (loadingItem) return (<div><Navbar title="Edit Announcement" subtitle="Modify announcement details" /><div className="xui-py-1"><FormSkeleton /></div></div>);
  if (!item) return (<div><Navbar title="Edit Announcement" subtitle="Modify announcement details" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Announcement not found or you do not have access.</p></div></div>);

  const isPending = item.approved_by === null;

  return (
    <div>
      <Navbar title="Edit Announcement" subtitle="Modify announcement details" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          {isPending && (
            <button type="button" onClick={() => modalShow('approve-announcement-modal')} className="xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none' }}>
              <span className="icon-container"><Checkmark size={16} /></span>
              Approve Announcement
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" placeholder="Enter announcement title" {...register('title', { required: 'Title is required' })} />
                {errors.title && <span className="message">{errors.title.message}</span>}
              </div>
              <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                <div className="xui-form-box">
                  <label htmlFor="start_date">Start Date</label>
                  <input type="date" id="start_date" {...register('start_date')} />
                </div>
                <div className="xui-form-box">
                  <label htmlFor="end_date">End Date</label>
                  <input type="date" id="end_date" {...register('end_date')} />
                </div>
              </div>
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="xui-form-box">
                <label>Description</label>
                {editorReady && <QuillEditor value={description} onChange={setDescription} />}
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Updating Announcement...' : 'Update Announcement'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal
        id="approve-announcement-modal"
        title="Approve Announcement"
        message="Are you sure you want to approve the announcement"
        itemName={item.title}
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

export default EditAnnouncement;
