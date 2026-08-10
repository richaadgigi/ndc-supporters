'use client';
import { useRouter } from 'next/navigation';
import { Edit, TrashCan, Add, Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import type { Event } from '../../services/events.service';

const MODAL_ID = 'day-events-modal';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

interface DayEventsModalProps {
  date: string;
  events: Event[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  todayKey: string;
  onSelectEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

const DayEventsModal = ({ date, events, canAdd, canEdit, canDelete, todayKey, onSelectEvent, onDeleteEvent }: DayEventsModalProps) => {
  const router = useRouter();

  return (
    <section className="xui-modal" xui-modal={MODAL_ID}>
      <div className="xui-modal-content xui-max-w-[450px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">{date && formatDateNice(date)}</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={() => modalHide(MODAL_ID)}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-80 xui-opacity-5 xui-mb-1">{events.length} event{events.length !== 1 ? 's' : ''} on this day</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {events.map(ev => (
            <div
              key={ev.unique_id}
              className="xui-bdr-rad-half xui-cursor-pointer"
              style={{ padding: '12px', border: '1px solid var(--neutral-200)', transition: 'background-color 0.15s' }}
              onClick={() => {
                modalHide(MODAL_ID);
                onSelectEvent(ev);
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50, #f9fafb)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-mb-half">
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'var(--primary-600)',
                }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.title}
                </span>
              </div>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1" style={{ paddingLeft: '18px' }}>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{formatTime12(ev.start_time)}</span>
                <span style={{ fontSize: '12px', color: 'var(--neutral-400)', textTransform: 'capitalize' }}>{ev.type}</span>
                {ev.location && (
                  <span style={{ fontSize: '12px', color: 'var(--neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.location}
                  </span>
                )}
              </div>
              {(canEdit || canDelete) && (
                <div className="xui-d-flex xui-grid-gap-half" style={{ paddingLeft: '18px', marginTop: '8px' }}>
                  {canEdit && (
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); modalHide(MODAL_ID); router.push(`/dashboard/supporter-portal/events/edit/${ev.unique_id}`); }}
                      className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
                      style={{ padding: '4px 10px', backgroundColor: 'var(--info-light)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: 'var(--info)' }}>
                      <Edit size={12} /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); modalHide(MODAL_ID); onDeleteEvent(ev); }}
                      className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
                      style={{ padding: '4px 10px', backgroundColor: 'var(--error-light)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: 'var(--error)' }}>
                      <TrashCan size={12} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {canAdd && date >= todayKey && (
          <>
            <hr className="xui-my-1" />
            <button type="button" className="xui-btn xui-btn-block xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              onClick={() => { modalHide(MODAL_ID); router.push(`/dashboard/supporter-portal/events/add?date=${date}`); }}>
              <Add size={14} /> Add Event on This Day
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default DayEventsModal;
