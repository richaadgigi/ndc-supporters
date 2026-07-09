'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import eventsService from '../../services/events.service';
import type { Event } from '../../services/events.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

const stripPrefix = (url: string | null, prefix: string): string => {
  if (!url) return '';
  return url.replace(prefix, '');
};

const buildLink = (value: string, prefix: string): string => {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
};

interface FormData { title: string; alt_text: string; type: string; start_date: string; start_time: string; end_date: string; end_time: string; location: string; link: string; }

const EditEvent = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Event | null>(null);
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [description, setDescription] = useState('');

  const accessIds = getAccessIds('candidate-portal', 'events');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', alt_text: '', type: '', start_date: '', start_time: '', end_date: '', end_time: '', location: '', link: '' }
  });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const res = await eventsService.get(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) {
          setItem(res.data);
          reset({
            title: res.data.title, alt_text: res.data.alt_text, type: res.data.type,
            start_date: res.data.start_date, start_time: res.data.start_time,
            end_date: res.data.end_date || '', end_time: res.data.end_time || '',
            location: res.data.location || '', link: stripPrefix(res.data.link, 'https://'),
          });
          setDescription(res.data.description || '');
          setImage(res.data.image || '');
          setImagePublicId(res.data.image_public_id || '');
        }
      } catch (err) { setError('Failed to load event details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id || !item) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!description || description === '<p><br></p>') { setError('Description is required'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    const cleanDescription = sanitizeHTML(description);
    if (cleanDescription.length > 4294967295) { setError(`Description is too long (${cleanDescription.length.toLocaleString()} characters). Maximum allowed is 4,294,967,295 characters.`); showAlert('error-alert'); setLoading(false); return; }
    try {
      const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
      const promises: Promise<any>[] = [];

      if (data.title !== item.title || data.alt_text !== item.alt_text || data.type !== item.type || data.location !== (item.location || '') || data.link !== stripPrefix(item.link, 'https://')) {
        promises.push(eventsService.editDetails({ unique_id: id, title: data.title, alt_text: data.alt_text, type: data.type, ...(data.location && { location: data.location }), ...(data.link && { link: buildLink(data.link, 'https://') }) }, params));
      }
      if (cleanDescription !== item.description) {
        promises.push(eventsService.editDescription({ unique_id: id, description: cleanDescription }, params));
      }
      if (data.start_date !== item.start_date || data.start_time !== item.start_time || data.end_date !== (item.end_date || '') || data.end_time !== (item.end_time || '')) {
        promises.push(eventsService.editTimeline({ unique_id: id, start_date: data.start_date, start_time: data.start_time, ...(data.end_date && { end_date: data.end_date }), ...(data.end_time && { end_time: data.end_time }) }, params));
      }
      if (image !== (item.image || '') || imagePublicId !== (item.image_public_id || '')) {
        promises.push(eventsService.editImage({ unique_id: id, image, image_public_id: imagePublicId }, params));
      }

      if (promises.length === 0) { setError('No changes detected'); showAlert('error-alert'); setLoading(false); return; }

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.success);
      if (failed) { setError(failed.message || 'Failed to update event'); showAlert('error-alert'); }
      else { setSuccessMessage('Event updated successfully'); showAlert('success-alert'); setTimeout(() => router.push('/dashboard/candidate-portal/events'), 1500); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update event')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (<div><Navbar title="Edit Event" subtitle="Modify event" /><div className="xui-py-1"><FormSkeleton fields={5} /></div></div>);
  if (!item) return (<div><Navbar title="Edit Event" subtitle="Modify event" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Event not found or you do not have access.</p></div></div>);

  return (
    <div>
      <Navbar title="Edit Event" subtitle="Modify event" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" placeholder="Enter event title" {...register('title', { required: 'Title is required' })} />
                {errors.title && <span className="message">{errors.title.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.alt_text && { 'xui-error': 'true' })}>
                <label htmlFor="alt_text">Alt Text (SEO) *</label>
                <input type="text" id="alt_text" placeholder="Enter alt text" {...register('alt_text', { required: 'Alt text is required', maxLength: { value: 500, message: 'Maximum 500 characters' } })} />
                {errors.alt_text && <span className="message">{errors.alt_text.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.type && { 'xui-error': 'true' })}>
                <label htmlFor="type">Type *</label>
                <select id="type" {...register('type', { required: 'Type is required' })}>
                  <option value="">--Select type--</option>
                  <option value="Live">Live</option>
                  <option value="Physical">Physical</option>
                </select>
                {errors.type && <span className="message">{errors.type.message}</span>}
              </div>
              <div className="xui-form-box">
                <label htmlFor="location">Location</label>
                <input type="text" id="location" placeholder="Enter event location" {...register('location')} />
              </div>
              <div className="xui-form-box">
                <label htmlFor="link">Link</label>
                <div className="input-holder">
                  <div className="left"><span>https://</span></div>
                  <input type="text" id="link" placeholder="example.com/event" {...register('link')} />
                </div>
              </div>
              <ImageUpload
                label="Event Image"
                value={image}
                publicId={imagePublicId}
                onChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); }}
                onError={(msg) => { setError(msg); showAlert('error-alert'); }}
                folder="ndccampaign/events"
              />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="xui-form-box">
                <label>Description *</label>
                <QuillEditor value={description} onChange={setDescription} />
                <p style={{ fontSize: '12px', marginTop: '6px', color: description.length > 4294967295 ? 'var(--error)' : description.length > 4000000000 ? 'var(--warning, #f59e0b)' : 'var(--neutral-400)' }}>
                  {description.length.toLocaleString()} / 4,294,967,295 characters
                </p>
              </div>
              <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                <div className="xui-form-box" {...(errors.start_date && { 'xui-error': 'true' })}>
                  <label htmlFor="start_date">Start Date *</label>
                  <input type="date" id="start_date" {...register('start_date', { required: 'Start date is required' })} />
                  {errors.start_date && <span className="message">{errors.start_date.message}</span>}
                </div>
                <div className="xui-form-box" {...(errors.start_time && { 'xui-error': 'true' })}>
                  <label htmlFor="start_time">Start Time *</label>
                  <input type="time" id="start_time" {...register('start_time', { required: 'Start time is required' })} />
                  {errors.start_time && <span className="message">{errors.start_time.message}</span>}
                </div>
              </div>
              <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                <div className="xui-form-box">
                  <label htmlFor="end_date">End Date</label>
                  <input type="date" id="end_date" {...register('end_date')} />
                </div>
                <div className="xui-form-box">
                  <label htmlFor="end_time">End Time</label>
                  <input type="time" id="end_time" {...register('end_time')} />
                </div>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Updating Event...' : 'Update Event'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditEvent;
