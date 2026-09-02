'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Edit, UserAvatar, Calendar, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import postsService from '../../services/posts.service';
import type { Post } from '../../services/posts.service';
import { formatDate } from '../../utils/formatters';
import { DetailSkeleton } from '../../components/skeletons';

const ViewPost = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds, checkAccess } = useGeneral();
  const [item, setItem] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const accessIds = getAccessIds('supporter-portal', 'posts');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoading(false); return; }
      try {
        const res = await postsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) setItem(res.data);
      } catch (err) { console.error('Failed to load post:', err); } finally { setLoading(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId]);

  if (loading) return (
    <div>
      <Navbar title="Post" subtitle="View post details" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Post" subtitle="View post details" />
      <div className="xui-py-2">
        <a onClick={() => router.push('/dashboard/supporter-portal/posts')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">Post not found or you do not have access.</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Post" subtitle="View post details" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <a
            onClick={() => router.push('/dashboard/supporter-portal/posts')}
            className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
            style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
          >
            <ArrowLeft size={18} />
            <span>Back to Posts</span>
          </a>
          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/supporter-portal/posts/edit/${item.unique_id}`)}
              className="xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', border: 'none' }}
            >
              <span className="icon-container"><Edit size={16} /></span>
              Edit Post
            </button>
          )}
        </div>

        <div className="xui-row">
          <div className="xui-col-12 xui-lg-col-8 xui-overflow-hidden">
            <h1 className="xui-font-sz-120 xui-font-w-700 xui-mb-1" style={{ lineHeight: '1.3', color: 'var(--neutral-900)' }}>
              {item.title}
            </h1>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1 xui-flex-wrap">
              {item.Creator && (
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <div className="xui-w-32 xui-h-32 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ backgroundColor: 'var(--neutral-200)', color: 'var(--neutral-500)' }}>
                    <UserAvatar size={18} />
                  </div>
                  <span className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                    {item.Creator.firstname} {item.Creator.lastname}
                  </span>
                </div>
              )}
              {item.Category && (
                <span className="xui-font-sz-70 xui-font-w-600" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', padding: '4px 12px', borderRadius: '4px' }}>
                  {item.Category.name}
                </span>
              )}
              <span className="xui-font-sz-80 xui-opacity-5">{formatDate(item.createdAt, 'MMMM D, YYYY')}</span>
            </div>

            {item.image && (
              <div className="xui-mb-1-half xui-bdr-rad-half xui-overflow-hidden">
                <img src={item.image} alt={item.alt_text || item.title} className="xui-w-fluid-100 xui-d-block" style={{ maxHeight: '440px', objectFit: 'cover' }} />
              </div>
            )}

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
                  Post Info
                </h4>

                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5">Status</span>
                    <span className="xui-font-sz-70 xui-font-w-500" style={{
                      backgroundColor: item.approved_by ? 'var(--success)' : 'var(--warning, #f59e0b)',
                      color: '#fff', padding: '3px 10px', borderRadius: '4px',
                    }}>
                      {item.approved_by ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {item.SupportGroup && (
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-80 xui-opacity-5">Support Group</span>
                      <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>{item.SupportGroup.name}</span>
                    </div>
                  )}

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <View size={14} /> Views
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>{item.views ?? 0}</span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5">Minutes Read</span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>{item.minutes_read ?? 0}</span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> Created
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                      {formatDate(item.createdAt, 'MMM D, YYYY')}
                    </span>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <>
                    <hr className="xui-my-1" />
                    <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Tags</p>
                    <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '4px 10px', borderRadius: '4px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPost;
