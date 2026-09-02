'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, UserAvatar, Calendar, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import postsService from '../../services/posts.service';
import type { Post } from '../../services/posts.service';
import { formatDate } from '../../utils/formatters';
import { DetailSkeleton } from '../../components/skeletons';

const ViewPost = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { supportGroupId } = useGeneral();
  const [item, setItem] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    postsService.publicGetOne(id, { ...(supportGroupId && { support_group_unique_id: supportGroupId }) })
      .then(res => { if (res.success && res.data) setItem(res.data); else setFetchError(res.message || 'Post not found'); })
      .catch(() => setFetchError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [id, supportGroupId]);

  if (loading) return (
    <div>
      <Navbar title="Post" subtitle="Post details" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Post" subtitle="Post details" />
      <div className="xui-py-2">
        <a onClick={() => router.push('/dashboard/posts')} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1" style={{ color: 'var(--neutral-600)', fontSize: '14px' }}>
          <ArrowLeft size={18} /> Back to Posts
        </a>
        <p className="xui-opacity-5">{fetchError || 'Post not found.'}</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Post" subtitle="Post details" />
      <div className="xui-py-1">
        <a
          onClick={() => router.push('/dashboard/posts')}
          className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1-half"
          style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Posts</span>
        </a>

        <div className="xui-row">
          <div className="xui-col-12 xui-lg-col-8 xui-overflow-hidden">
            <h1 className="xui-font-sz-120 xui-font-w-700 xui-mb-1" style={{ lineHeight: '1.3', color: 'var(--neutral-900)' }}>
              {item.title}
            </h1>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1 xui-flex-wrap">
              {item.Creator && (
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <span style={{ color: 'var(--neutral-400)' }}><UserAvatar size={20} /></span>
                  <span className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                    {item.Creator.firstname} {item.Creator.lastname}
                  </span>
                </div>
              )}
              {item.Category && (
                <span className="xui-font-sz-70 xui-font-w-600" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {item.Category.name}
                </span>
              )}
              <span className="xui-font-sz-80 xui-opacity-5">
                {formatDate(item.createdAt, 'MMMM D, YYYY')}
              </span>
            </div>

            {item.image && (
              <div className="xui-mb-1-half xui-bdr-rad-half xui-overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt_text || item.title}
                  className="xui-w-fluid-100 xui-d-block"
                  style={{ maxHeight: '440px', objectFit: 'cover' }}
                />
              </div>
            )}

            <div
              className="xui-font-sz-90"
              style={{ lineHeight: '1.8', color: 'var(--neutral-700)', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: item.description || '' }}
            />
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
                    <span className="xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: item.approved_by ? 'var(--success)' : '#111827', color: '#fff', padding: '3px 10px', borderRadius: '4px' }}>
                      {item.approved_by ? 'Published' : 'Pending'}
                    </span>
                  </div>

                  {item.SupportGroup && (
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-80 xui-opacity-5">Support Group</span>
                      <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                        {item.SupportGroup.name}
                      </span>
                    </div>
                  )}

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <View size={14} /> Views
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-600" style={{ color: 'var(--neutral-700)' }}>
                      {(item as any).views?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> Published
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                      {formatDate(item.createdAt, 'MMM D, YYYY')}
                    </span>
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

export default ViewPost;
