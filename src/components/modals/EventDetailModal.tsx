'use client';
import { useRouter } from 'next/navigation';
import { Edit, TrashCan, Checkmark, Close, Location, Time, View } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import type { Event } from '../../services/events.service';

const MODAL_ID = 'event-detail-modal';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toDateOnly = (dateStr: string) => dateStr.split(' ')[0];

const formatTime12 = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const formatDateNice = (dateStr: string) => {
  const clean = dateStr.split(' ')[0];
  const [y, mo, d] = clean.split('-').map(Number);
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
};

interface EventDetailModalProps {
  event: Event | null;
  canEdit: boolean;
  canDelete: boolean;
  onApprove: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const EventDetailModal = ({ event, canEdit, canDelete, onApprove, onDelete }: EventDetailModalProps) => {
  const router = useRouter();

  return (
    <section className="xui-modal" xui-modal={MODAL_ID}>
      {event && <div className="xui-modal-content xui-max-w-[450px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]" style={{ flex: 1, marginRight: '12px' }}>{event.title}</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={() => modalHide(MODAL_ID)}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />

        <div className="xui-d-flex xui-grid-gap-half xui-mb-1" style={{ flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: event.status === 1 ? 'var(--success)' : event.status === 2 ? 'var(--warning, #f59e0b)' : 'var(--error)',
            color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
          }}>
            {event.status === 1 ? 'Published' : event.status === 2 ? 'Pending' : 'Draft'}
          </span>
          <span style={{
            backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)',
            padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
          }}>
            {event.type}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', color: 'var(--neutral-700)' }}>
            <Time size={16} />
            <span>
              {formatDateNice(event.start_date)} at {formatTime12(event.start_time)}
              {event.end_time && ` – ${formatTime12(event.end_time)}`}
            </span>
          </div>
          {event.end_date && toDateOnly(event.end_date) !== toDateOnly(event.start_date) && (
            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', color: 'var(--neutral-700)' }}>
              <Time size={16} />
              <span>Ends {formatDateNice(event.end_date)}</span>
            </div>
          )}
          {event.location && (
            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', color: 'var(--neutral-700)' }}>
              <Location size={16} />
              <span>{event.location}</span>
            </div>
          )}
          {event.views > 0 && (
            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', color: 'var(--neutral-500)' }}>
              <View size={16} />
              <span>{event.views.toLocaleString()} views</span>
            </div>
          )}
        </div>

        <div className="xui-d-grid xui-grid-gap-half xui-grid-col-2">
          {event.status === 1 && (
            <button type="button" className="xui-btn xui-btn-block xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--neutral-100)', border: 'none' }}
              onClick={() => { modalHide(MODAL_ID); router.push(`/dashboard/supporter-portal/events/view/${event.unique_id}`); }}>
              <View size={14} /> View Full Details
            </button>
          )}
          {canEdit && event.status !== 1 && (
            <button type="button" className="xui-btn xui-btn-block xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
              onClick={() => { modalHide(MODAL_ID); router.push(`/dashboard/supporter-portal/events/edit/${event.unique_id}`); }}>
              <Edit size={14} /> Edit
            </button>
          )}
          {canEdit && event.status !== 1 && (
            <button type="button" className="xui-btn xui-btn-block xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--success-light, #dcfce7)', border: 'none', color: 'var(--success)' }}
              onClick={() => { modalHide(MODAL_ID); onApprove(event); }}>
              <Checkmark size={14} /> Approve
            </button>
          )}
          {canDelete && (
            <button type="button" className="xui-btn xui-btn-block xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
              onClick={() => { modalHide(MODAL_ID); onDelete(event); }}>
              <TrashCan size={14} /> Delete
            </button>
          )}
        </div>
      </div>}
    </section>
  );
};

export default EventDetailModal;
