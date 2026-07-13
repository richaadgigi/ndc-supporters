'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Add, Download, ChevronLeft, ChevronRight, WarningAlt } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import eventsService from '../../services/events.service';
import type { Event } from '../../services/events.service';
import { Alert, showAlert } from '../../components/common';
import { ExportModal, ConfirmModal, AddEventModal, EventDetailModal, DayEventsModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatTime12 = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const toDateOnly = (dateStr: string) => dateStr.split(' ')[0];

const getCalendarDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: { date: Date; current: boolean }[] = [];

  const prevEnd = new Date(year, month, 0).getDate();
  for (let i = first.getDay() - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevEnd - i), current: false });
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), current: true });
  const remainder = days.length % 7;
  if (remainder > 0) for (let d = 1; d <= 7 - remainder; d++) days.push({ date: new Date(year, month + 1, d), current: false });

  return days;
};

const MAX_CHIPS = 3;

const AllEvents = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();

  const [month, setMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState<Event | null>(null);

  const [addEventDate, setAddEventDate] = useState('');
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [dayDate, setDayDate] = useState('');
  const [dayEvents, setDayEvents] = useState<Event[]>([]);

  const accessIds = getAccessIds('candidate-portal', 'events');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;
  const access = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = access.accessTypes.includes('add');
  const canEdit = access.accessTypes.includes('edit');
  const canDelete = access.accessTypes.includes('delete');

  const todayKey = toKey(new Date());
  const calendarDays = useMemo(() => getCalendarDays(month.y, month.m), [month.y, month.m]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    items.forEach(ev => {
      if (!ev.start_date) return;
      const startKey = toDateOnly(ev.start_date);
      const endKey = ev.end_date ? toDateOnly(ev.end_date) : startKey;

      const cur = new Date(startKey + 'T00:00:00');
      const end = new Date(endKey + 'T00:00:00');
      while (cur <= end) {
        const k = toKey(cur);
        if (!map[k]) map[k] = [];
        map[k].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [items]);

  const handleResponse = (res: any) => {
    if (res.success && res.data) setItems(Array.isArray(res.data) ? res.data : res.data.rows || []);
    else setItems([]);
  };

  const fetchItems = useCallback(async () => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    setLoading(true); setFetchError('');
    try { handleResponse(await eventsService.getAll({ page: 1, size: 500, module_unique_id: moduleId, sub_module_unique_id: subModuleId })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch events')); }
    finally { setLoading(false); }
  }, [moduleId, subModuleId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const prevMonth = () => setMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { ...p, m: p.m - 1 });
  const nextMonth = () => setMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { ...p, m: p.m + 1 });
  const goToday = () => { const n = new Date(); setMonth({ y: n.getFullYear(), m: n.getMonth() }); };

  const handleCellClick = (dateStr: string) => {
    const events = eventsByDate[dateStr] || [];

    if (events.length === 1) {
      setDetailEvent(events[0]);
      modalShow('event-detail-modal');
    } else if (events.length > 1) {
      setDayDate(dateStr);
      setDayEvents(events);
      modalShow('day-events-modal');
    } else if (canAdd && dateStr >= todayKey) {
      setAddEventDate(dateStr);
      modalShow('add-event-modal');
    }
  };

  const handleEventClick = (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailEvent(ev);
    modalShow('event-detail-modal');
  };

  const handleDelete = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete' };
    return eventsService.delete(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleApprove = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to approve' };
    return eventsService.approve({ unique_id: selectedItem.unique_id, approved: true }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  return (
    <div>
      <Navbar title="Events" subtitle="Manage events" />
      <div className="xui-py-1-half">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={goToday} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 14px' }}>
              Today
            </button>
            <button onClick={prevMonth} className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', borderRadius: '50%', color: 'var(--neutral-600)' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', borderRadius: '50%', color: 'var(--neutral-600)' }}>
              <ChevronRight size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--neutral-800)' }}>
              {MONTHS[month.m]} {month.y}
            </h2>
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={fetchItems} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <button onClick={() => router.push('/dashboard/candidate-portal/events/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                <span className="icon-container"><Add size={16} /></span> Add Event
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : fetchError ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-py-3 xui-text-center" style={{ border: '1px solid var(--neutral-200)' }}>
            <p style={{ color: 'var(--error)', marginBottom: '12px' }}>{fetchError}</p>
            <button onClick={fetchItems} className="xui-btn xui-font-sz-80 xui-bdr-rad-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>Retry</button>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50, #f9fafb)' }}>
              {DAYS.map(d => (
                <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map((cell, i) => {
                const lastRowStart = calendarDays.length - 7;

                if (!cell.current) {
                  return (
                    <div key={i} style={{
                      height: '110px', padding: '4px 6px',
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--neutral-100)' : undefined,
                      borderBottom: i < lastRowStart ? '1px solid var(--neutral-100)' : undefined,
                      backgroundColor: 'var(--neutral-50, #f9fafb)',
                    }} />
                  );
                }

                const key = toKey(cell.date);
                const isToday = key === todayKey;
                const isPast = key < todayKey;
                const cellEvents = eventsByDate[key] || [];
                const hasEvents = cellEvents.length > 0;
                const isClickable = hasEvents || (canAdd && !isPast);

                return (
                  <div
                    key={i}
                    onClick={() => handleCellClick(key)}
                    style={{
                      height: '110px', padding: '4px 6px', overflow: 'hidden',
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--neutral-100)' : undefined,
                      borderBottom: i < lastRowStart ? '1px solid var(--neutral-100)' : undefined,
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'background-color 0.15s',
                      opacity: isPast && !hasEvents ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.backgroundColor = 'var(--neutral-50, #f9fafb)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <div style={{ marginBottom: '4px', padding: '2px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: isToday ? 'var(--primary-600)' : 'transparent',
                        color: isToday ? 'var(--secondary-700)' : 'var(--neutral-800)',
                        fontSize: '13px', fontWeight: isToday ? 700 : 400,
                      }}>
                        {cell.date.getDate()}
                      </span>
                    </div>

                    {cellEvents.slice(0, MAX_CHIPS).map(ev => {
                      const approved = ev.approved_by !== null && ev.approved_by !== undefined;
                      const evColor = approved ? 'var(--primary-600)' : '#d97706';
                      const isStart = toDateOnly(ev.start_date) === key;
                      const isEnd = !ev.end_date || toDateOnly(ev.end_date) === key;
                      const isMultiDay = ev.end_date && toDateOnly(ev.end_date) !== toDateOnly(ev.start_date);

                      return (
                        <div
                          key={ev.unique_id}
                          onClick={(e) => handleEventClick(ev, e)}
                          title={`${ev.title} - ${formatTime12(ev.start_time)}`}
                          style={{
                            backgroundColor: evColor,
                            color: '#fff',
                            padding: '1px 6px',
                            borderRadius: isMultiDay
                              ? isStart ? '4px 0 0 4px' : isEnd ? '0 4px 4px 0' : '0'
                              : '4px',
                            fontSize: '11px', lineHeight: '20px', marginBottom: '2px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer',
                            marginLeft: isMultiDay && !isStart ? '-6px' : undefined,
                            marginRight: isMultiDay && !isEnd ? '-6px' : undefined,
                            opacity: isStart ? 1 : 0.75,
                          }}
                        >
                          {isStart ? <span style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden' }}>{!approved && <WarningAlt size={10} style={{ flexShrink: 0 }} />}{ev.start_time && <>{formatTime12(ev.start_time)} </>}{ev.title}</span> : '\u00A0'}
                        </div>
                      );
                    })}
                    {cellEvents.length > MAX_CHIPS && (
                      <div
                        onClick={(e) => { e.stopPropagation(); setDayDate(key); setDayEvents(cellEvents); modalShow('day-events-modal'); }}
                        style={{ fontSize: '11px', color: 'var(--primary-600)', padding: '1px 6px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        +{cellEvents.length - MAX_CHIPS} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddEventModal
        date={addEventDate}
        accessIds={accessIds}
        onSuccess={fetchItems}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
      />
      <EventDetailModal
        event={detailEvent}
        canEdit={canEdit}
        canDelete={canDelete}
        onApprove={(ev) => { setSelectedItem(ev); setTimeout(() => modalShow('approve-modal'), 200); }}
        onDelete={(ev) => { setSelectedItem(ev); setTimeout(() => modalShow('delete-modal'), 200); }}
      />
      <DayEventsModal
        date={dayDate}
        events={dayEvents}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
        todayKey={todayKey}
        onSelectEvent={(ev) => { setDetailEvent(ev); setTimeout(() => modalShow('event-detail-modal'), 200); }}
        onDeleteEvent={(ev) => { setSelectedItem(ev); setTimeout(() => modalShow('delete-modal'), 200); }}
      />
      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="approve-modal" title="Approve Event" message="Are you sure you want to approve this event? It will be published." itemName={selectedItem?.title || ''} confirmText="Approve" confirmingText="Approving..." confirmButtonStyle="success" onConfirm={handleApprove} onSuccess={fetchItems} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ConfirmModal id="delete-modal" title="Delete Event" message="Are you sure you want to delete this event?" itemName={selectedItem?.title || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDelete} onSuccess={fetchItems} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Events" fileName="events" columns={[{ key: 'title', header: 'Title' }, { key: 'type', header: 'Type' }, { key: 'start_date', header: 'Start Date' }, { key: 'location', header: 'Location' }, { key: 'status', header: 'Status' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllEvents;
