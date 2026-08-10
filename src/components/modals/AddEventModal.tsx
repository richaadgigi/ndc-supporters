'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import eventsService from '../../services/events.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { showAlert } from '../common';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';

const buildLink = (value: string, prefix: string): string => {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
};

interface AddEventFormData {
  support_group_unique_id: string;
  title: string;
  alt_text: string;
  type: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  link: string;
}

interface AddEventModalProps {
  date: string;
  accessIds: { module_unique_id: string; sub_module_unique_id: string } | null;
  onSuccess: () => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

const MODAL_ID = 'add-event-modal';

const AddEventModal = ({ date, accessIds, onSuccess, setError, setSuccessMessage }: AddEventModalProps) => {
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddEventFormData>({
    defaultValues: {
      support_group_unique_id: '', title: '', alt_text: '', type: 'Physical',
      start_date: date, start_time: '09:00', end_date: '', end_time: '',
      location: '', link: '',
    },
  });

  useEffect(() => {
    if (!accessIds) return;
    supportGroupsService.getAll({ size: 200, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }).then(res => {
      if (res.success && res.data) {
        setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
      }
    }).catch(() => {});
  }, [accessIds?.module_unique_id]);

  useEffect(() => {
    if (date) {
      reset({
        support_group_unique_id: '', title: '', alt_text: '', type: 'Physical',
        start_date: date, start_time: '09:00', end_date: '', end_time: '',
        location: '', link: '',
      });
      setDescription('');
    }
  }, [date, reset]);

  const closeModal = () => {
    reset();
    setDescription('');
    modalHide(MODAL_ID);
  };

  const onSubmit = async (data: AddEventFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    if (!description || description === '<p><br></p>') {
      setError('Description is required');
      showAlert('error-alert');
      return;
    }

    setSaving(true);
    const cleanDescription = sanitizeHTML(description);

    if (cleanDescription.length > 65535) {
      setError(`Description is too long (${cleanDescription.length.toLocaleString()} characters). Maximum allowed is 65,535 characters.`);
      showAlert('error-alert');
      setSaving(false);
      return;
    }

    try {
      const res = await eventsService.add(
        {
          support_group_unique_id: data.support_group_unique_id,
          title: data.title.trim(),
          alt_text: data.alt_text.trim(),
          type: data.type,
          description: cleanDescription,
          start_date: data.start_date,
          start_time: data.start_time,
          ...(data.end_date && { end_date: data.end_date }),
          ...(data.end_time && { end_time: data.end_time }),
          ...(data.location && { location: data.location }),
          ...(data.link && { link: buildLink(data.link, 'https://') }),
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );

      if (res.success) {
        setSuccessMessage('Event created successfully');
        showAlert('success-alert');
        reset();
        setDescription('');
        modalHide(MODAL_ID);
        onSuccess();
      } else {
        setError(res.message || 'Failed to create event');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create event'));
      showAlert('error-alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="xui-modal" xui-modal={MODAL_ID}>
      <div className="xui-modal-content xui-bdr-rad-[8px]" style={{ maxWidth: '70%' }}>
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">New Event</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-form-box" {...(errors.support_group_unique_id && { 'xui-error': 'true' })}>
            <label htmlFor="event_support_group">Support Group *</label>
            <select id="event_support_group" {...register('support_group_unique_id', { required: 'Support group is required' })}>
              <option value="">Select a support group</option>
              {supportGroups.map(g => (
                <option key={g.unique_id} value={g.unique_id}>
                  {g.name}{g.scope_option ? ` (${g.scope_option})` : ''}{g.state ? ` - ${g.state}` : ''}
                </option>
              ))}
            </select>
            {errors.support_group_unique_id && <span className="message">{errors.support_group_unique_id.message}</span>}
          </div>

          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
            <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
              <label htmlFor="event_title">Title *</label>
              <input
                type="text"
                id="event_title"
                placeholder="Enter event title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <span className="message">{errors.title.message}</span>}
            </div>

            <div className="xui-form-box" {...(errors.alt_text && { 'xui-error': 'true' })}>
              <label htmlFor="event_alt_text">Alt Text (SEO) *</label>
              <input
                type="text"
                id="event_alt_text"
                placeholder="Enter alt text for SEO"
                {...register('alt_text', { required: 'Alt text is required', maxLength: { value: 500, message: 'Maximum 500 characters' } })}
              />
              {errors.alt_text && <span className="message">{errors.alt_text.message}</span>}
            </div>
          </div>

          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
            <div className="xui-form-box" {...(errors.type && { 'xui-error': 'true' })}>
              <label htmlFor="event_type">Type *</label>
              <select id="event_type" {...register('type', { required: 'Type is required' })}>
                <option value="">--Select type--</option>
                <option value="Live">Live</option>
                <option value="Physical">Physical</option>
              </select>
              {errors.type && <span className="message">{errors.type.message}</span>}
            </div>
            <div className="xui-form-box">
              <label htmlFor="event_location">Location</label>
              <input type="text" id="event_location" placeholder="Enter location" {...register('location')} />
            </div>
          </div>

          <div className="xui-form-box" style={{ minWidth: 0, overflow: 'hidden' }}>
            <label>Description *</label>
            <QuillEditor value={description} onChange={setDescription} />
            <p style={{ fontSize: '12px', marginTop: '6px', color: description.length > 65535 ? 'var(--error)' : description.length > 55000 ? 'var(--warning, #f59e0b)' : 'var(--neutral-400)' }}>
              {description.length.toLocaleString()} / 65,535 characters
            </p>
          </div>

          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
            <div className="xui-form-box" {...(errors.start_date && { 'xui-error': 'true' })}>
              <label htmlFor="event_start_date">Start Date *</label>
              <input type="date" id="event_start_date" {...register('start_date', { required: 'Start date is required' })} />
              {errors.start_date && <span className="message">{errors.start_date.message}</span>}
            </div>
            <div className="xui-form-box" {...(errors.start_time && { 'xui-error': 'true' })}>
              <label htmlFor="event_start_time">Start Time *</label>
              <input type="time" id="event_start_time" {...register('start_time', { required: 'Start time is required' })} />
              {errors.start_time && <span className="message">{errors.start_time.message}</span>}
            </div>
          </div>

          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
            <div className="xui-form-box">
              <label htmlFor="event_end_date">End Date</label>
              <input type="date" id="event_end_date" {...register('end_date')} />
            </div>
            <div className="xui-form-box">
              <label htmlFor="event_end_time">End Time</label>
              <input type="time" id="event_end_time" {...register('end_time')} />
            </div>
          </div>

          <div className="xui-form-box">
            <label htmlFor="event_link">Link</label>
            <div className="input-holder">
              <div className="left"><span>https://</span></div>
              <input type="text" id="event_link" placeholder="example.com/event" {...register('link')} />
            </div>
          </div>

          <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
            <button
              type="button"
              className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              disabled={saving}
            >
              {saving ? 'Adding Event...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddEventModal;
