'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import eventsService from '../../services/events.service';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';

const buildLink = (value: string, prefix: string): string => {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
};

interface FormData { candidate_unique_id: string; title: string; alt_text: string; type: string; start_date: string; start_time: string; end_date: string; end_time: string; location: string; link: string; }

const AddEvent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const accessIds = getAccessIds('candidate-portal', 'events');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { candidate_unique_id: '', title: '', alt_text: '', type: '', start_date: searchParams.get('date') || '', start_time: '', end_date: '', end_time: '', location: '', link: '' }
  });

  useEffect(() => {
    candidatesService.publicGetAll({ size: 200 }).then(res => {
      if (res.success && res.data) setCandidates(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!description || description === '<p><br></p>') { setError('Description is required'); showAlert('error-alert'); return; }
    setLoading(true);
    const cleanDescription = sanitizeHTML(description);
    if (cleanDescription.length > 4294967295) { setError(`Description is too long (${cleanDescription.length.toLocaleString()} characters). Maximum allowed is 4,294,967,295 characters.`); showAlert('error-alert'); setLoading(false); return; }
    try {
      const response = await eventsService.add(
        {
          candidate_unique_id: data.candidate_unique_id,
          title: data.title, alt_text: data.alt_text, type: data.type, description: cleanDescription,
          start_date: data.start_date, start_time: data.start_time,
          ...(data.end_date && { end_date: data.end_date }),
          ...(data.end_time && { end_time: data.end_time }),
          ...(data.location && { location: data.location }),
          ...(data.link && { link: buildLink(data.link, 'https://') }),
          ...(image && { image, image_public_id: imagePublicId }),
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Event added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/candidate-portal/events'), 1500);
      } else { setError(response.message || 'Failed to add event'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add event')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Event" subtitle="Create a new event" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the event details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.candidate_unique_id && { 'xui-error': 'true' })}>
                <label htmlFor="candidate_unique_id">Candidate *</label>
                <select id="candidate_unique_id" {...register('candidate_unique_id', { required: 'Candidate is required' })}>
                  <option value="">Select a candidate</option>
                  {candidates.map(c => <option key={c.unique_id} value={c.unique_id}>{c.name}{(c as any).Position?.name ? ` (${(c as any).Position.name})` : c.state ? ` - ${c.state}` : ''}</option>)}
                </select>
                {errors.candidate_unique_id && <span className="message">{errors.candidate_unique_id.message}</span>}
              </div>
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
            {loading ? 'Adding Event...' : 'Add Event'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddEvent;
