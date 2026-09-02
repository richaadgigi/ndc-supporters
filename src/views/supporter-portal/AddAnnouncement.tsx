'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import announcementsService from '../../services/announcements.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';

interface FormData { support_group_unique_id: string; title: string; start_date: string; end_date: string; }

const AddAnnouncement = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [description, setDescription] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'announcements');



  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);



  useEffect(() => {


    if (!accessIds) return;


    supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id })


      .then(res => { if (res.success && res.data) setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []); })


      .catch(() => {});


  }, [accessIds?.module_unique_id]);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { support_group_unique_id: '', title: '', start_date: '', end_date: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    const cleanDescription = description && description !== '<p><br></p>' ? sanitizeHTML(description) : '';
    if (!cleanDescription) { setError('Description is required'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await announcementsService.add(
        { support_group_unique_id: data.support_group_unique_id,
          title: data.title,
          description: cleanDescription,
          ...(data.start_date && { start_date: `${data.start_date} 00:00` }),
          ...(data.end_date && { end_date: `${data.end_date} 00:00` }),
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Announcement added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/announcements'), 1500);
      } else { setError(response.message || 'Failed to add announcement'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add announcement')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Announcement" subtitle="Create a new support group announcement" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the announcement details below. Fields marked with * are required.</p>
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
                <label>Description *</label>
                <QuillEditor value={description} onChange={setDescription} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Adding Announcement...' : 'Add Announcement'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddAnnouncement;
