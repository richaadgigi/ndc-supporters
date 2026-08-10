'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, UserAvatar, Calendar, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import announcementsService from '../../services/announcements.service';
import type { Announcement } from '../../services/announcements.service';
import { formatDate } from '../../utils/formatters';
import { DetailSkeleton } from '../../components/skeletons';

const ViewAnnouncement = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { supportGroupId } = useGeneral();
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    announcementsService.publicGetOne(id, { ...(supportGroupId && { support_group_unique_id: supportGroupId }) })
      .then(res => { if (res.success && res.data) setItem(res.data); else setFetchError(res.message || 'Announcement not found'); })
      .catch(() => setFetchError('Failed to load announcement'))
      .finally(() => setLoading(false));
  }, [id, supportGroupId]);

  if (loading) return (
    <div>
      <Navbar title="Announcement" subtitle="Announcement details" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Announcement" subtitle="Announcement details" />
      <div className="xui-py-2">
        <a onClick={() => router.push('/dashboard/announcements')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">{fetchError || 'Announcement not found.'}</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Announcement" subtitle="Announcement details" />
      <div className="xui-py-1">
        <a
          onClick={() => router.push('/dashboard/announcements')}
          className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1-half"
          style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Announcements</span>
        </a>

        <div className="xui-row">
          <div className="xui-col-12 xui-lg-col-8 xui-overflow-hidden">
            <h1 className="xui-font-sz-120 xui-font-w-700 xui-mb-1" style={{ lineHeight: '1.3', color: 'var(--neutral-900)' }}>
              {item.title}
            </h1>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1-half xui-flex-wrap">
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
              <span className="xui-font-sz-80 xui-opacity-5">
                {formatDate(item.createdAt, 'MMMM D, YYYY')}
              </span>
            </div>

            {item.description && (
              <div
                className="xui-font-sz-90"
                style={{ lineHeight: '1.8', color: 'var(--neutral-700)', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            )}
          </div>

          <div className="xui-col-12 xui-lg-col-4 xui-pl-1">
            <div style={{ position: 'sticky', top: '20px' }}>
              <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
                <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Details
                </h4>

                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                  {item.SupportGroup && (
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-80 xui-opacity-5">Support Group</span>
                      <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>{item.SupportGroup.name}</span>
                    </div>
                  )}

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> Start Date
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                      {item.start_date ? formatDate(item.start_date, 'MMM D, YYYY') : '-'}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> End Date
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                      {item.end_date ? formatDate(item.end_date, 'MMM D, YYYY') : '-'}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <View size={14} /> Views
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>{item.views ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAnnouncement;
