'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Edit, View, UserAvatar, Calendar, Time, Location, Link as LinkIcon, Checkmark } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import eventsService from '../../services/events.service';
import type { Event } from '../../services/events.service';
import { formatDate } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { DetailSkeleton } from '../../components/skeletons';

const ViewEvent = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds, checkAccess, supportGroupId } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Event | null>(null);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'events');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) { setLoading(false); return; }
      try {
        const res = await eventsService.publicGetOne(id, { ...(supportGroupId && { support_group_unique_id: supportGroupId }) });
        if (res.success && res.data) setItem(res.data);
      } catch (err) { } finally { setLoading(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, supportGroupId]);

  const handleApproveItem = async () => {
    if (!moduleId || !subModuleId || !item) return { success: false, message: 'Unable to approve' };
    return eventsService.portalApprove({ unique_id: item.unique_id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleApproveSuccess = () => {
    setItem(prev => prev ? { ...prev, status: 1 } : prev);
  };

  if (loading) return (
    <div>
      <Navbar title="Event" subtitle="View event details" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Event" subtitle="View event details" />
      <div className="xui-py-2">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">Event not found or you do not have access.</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Event" subtitle="View event details" />
      <div className="xui-py-1">
        <a
          onClick={() => router.push('/dashboard/supporter-portal/events')}
          className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1-half"
          style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Events</span>
        </a>

        <div className="xui-row">

          <div className="xui-col-12 xui-lg-col-8 xui-overflow-hidden">
            <h1 className="xui-font-sz-120 xui-font-w-700 xui-mb-1" style={{ lineHeight: '1.3', color: 'var(--neutral-900)' }}>
              {item.title}
            </h1>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1 xui-flex-wrap">
              {item.Creator && (
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  {item.Creator.profile_image ? (
                    <img src={item.Creator.profile_image} alt="" className="xui-w-32 xui-h-32 xui-bdr-rad-circle" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="xui-w-32 xui-h-32 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ backgroundColor: 'var(--neutral-200)', color: 'var(--neutral-500)' }}>
                      <UserAvatar size={18} />
                    </div>
                  )}
                  <span className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                    {item.Creator.firstname} {item.Creator.lastname}
                  </span>
                </div>
              )}
              <span className="xui-font-sz-70 xui-font-w-600" style={{
                backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)',
                padding: '4px 12px', borderRadius: '4px', textTransform: 'capitalize',
              }}>
                {item.type}
              </span>
              <span className="xui-font-sz-80 xui-opacity-5">
                {formatDate(item.createdAt, 'MMMM D, YYYY')}
              </span>
            </div>

            {item.image && (
              <div className="xui-mb-1-half xui-bdr-rad-half xui-overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt_text || item.title}
                  className="xui-w-fluid-100 xui-d-block" style={{ maxHeight: '440px', objectFit: 'cover' }}
                />
              </div>
            )}

            <div
              className="xui-font-sz-90"
              style={{ lineHeight: '1.8', color: 'var(--neutral-700)', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>

          <div className="xui-col-12 xui-lg-col-4 xui-pl-1">
          <div style={{ position: 'sticky', top: '20px' }}>
            <div className="xui-bg-white xui-bdr-rad-half xui-p-1 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
              <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Event Info
              </h4>

              <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5">Status</span>
                  <span className="xui-font-sz-70 xui-font-w-500" style={{
                    backgroundColor: item.status === 1 ? 'var(--success)' : item.status === 2 ? 'var(--warning, #f59e0b)' : 'var(--error)',
                    color: '#fff', padding: '3px 10px', borderRadius: '4px',
                  }}>
                    {item.status === 1 ? 'Published' : item.status === 2 ? 'Pending' : 'Draft'}
                  </span>
                </div>

                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5">Type</span>
                  <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)', textTransform: 'capitalize' }}>
                    {item.type}
                  </span>
                </div>

                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                    <View size={14} /> Views
                  </span>
                  <span className="xui-font-sz-80 xui-font-w-600" style={{ color: 'var(--neutral-700)' }}>
                    {item.views?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                    <Calendar size={14} /> Starts
                  </span>
                  <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                    {item.start_date} {item.start_time}
                  </span>
                </div>

                {(item.end_date || item.end_time) && (
                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Time size={14} /> Ends
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                      {item.end_date || ''} {item.end_time || ''}
                    </span>
                  </div>
                )}

                {item.location && (
                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Location size={14} /> Location
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)', textAlign: 'right', maxWidth: '180px' }}>
                      {item.location}
                    </span>
                  </div>
                )}

                {item.link && (
                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <LinkIcon size={14} /> Link
                    </span>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="xui-font-sz-80 xui-d-block xui-overflow-hidden" style={{ color: 'var(--primary-600)', textDecoration: 'underline', maxWidth: '180px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.link}
                    </a>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-block xui-mb-half">Tags</span>
                    <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="xui-font-sz-70" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '2px 8px', borderRadius: '4px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                    <Calendar size={14} /> Created
                  </span>
                  <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                    {formatDate(item.createdAt, 'MMM D, YYYY')}
                  </span>
                </div>

                <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                  <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                    <Calendar size={14} /> Updated
                  </span>
                  <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                    {formatDate(item.updatedAt, 'MMM D, YYYY')}
                  </span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
                <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Actions
                </h4>
                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                  {item.status !== 1 && (
                    <button
                      onClick={() => modalShow('approve-modal')}
                      className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half xui-cursor-pointer xui-w-fluid-100 xui-font-sz-85 xui-font-w-500"
                      style={{
                        backgroundColor: 'var(--success)', color: '#fff',
                        border: 'none', padding: '10px 16px', borderRadius: '6px',
                      }}
                    >
                      <Checkmark size={16} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/supporter-portal/events/edit/${item.unique_id}`)}
                    className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half xui-cursor-pointer xui-w-fluid-100 xui-font-sz-85 xui-font-w-500"
                    style={{
                      backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)',
                      border: 'none', padding: '10px 16px', borderRadius: '6px',
                    }}
                  >
                    <Edit size={16} /> Edit Event
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="approve-modal" title="Approve Event" message="Are you sure you want to approve this event? It will be published." itemName={item.title} confirmText="Approve" confirmingText="Approving..." confirmButtonStyle="success" onConfirm={handleApproveItem} onSuccess={handleApproveSuccess} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default ViewEvent;
