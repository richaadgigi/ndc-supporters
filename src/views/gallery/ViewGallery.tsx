'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ErrorState } from '../../components/common';
import { ArrowLeft, UserAvatar, Time } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import galleryService from '../../services/gallery.service';
import type { Gallery } from '../../services/gallery.service';
import { formatDate } from '../../utils/formatters';
import { UserDetailSkeleton } from '../../components/skeletons';

const ViewGallery = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { supportGroupId } = useGeneral();
  const [item, setItem] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    galleryService.publicGetOne(id, { ...(supportGroupId && { support_group_unique_id: supportGroupId }) })
      .then(res => { if (res.success && res.data) setItem(res.data); else setFetchError(res.message || 'Failed to load image'); })
      .catch(() => setFetchError('Failed to load gallery image'))
      .finally(() => setLoading(false));
  }, [id, supportGroupId]);

  return (
    <div>
      <Navbar title="Gallery Image" subtitle="Gallery image details" />
      <div className="xui-py-1">
        <a
          onClick={() => router.push('/dashboard/gallery')}
          className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1-half"
          style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Gallery</span>
        </a>

        {loading ? (
          <UserDetailSkeleton />
        ) : fetchError ? (
          <ErrorState message={fetchError} />
        ) : item ? (
          <div className="xui-row">
            <div className="xui-col-12 xui-lg-col-8">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title || 'Gallery image'}
                    className="xui-w-fluid-100 xui-d-block"
                    style={{ maxHeight: '500px', objectFit: 'contain', backgroundColor: 'var(--neutral-50)' }}
                  />
                ) : (
                  <div className="xui-w-fluid-100 xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ height: '300px', color: 'var(--neutral-400)' }}>
                    <span className="xui-font-sz-90">No Image</span>
                  </div>
                )}
              </div>

              {item.title && (
                <h1 className="xui-font-sz-110 xui-font-w-700 xui-mb-1" style={{ lineHeight: '1.3', color: 'var(--neutral-900)' }}>
                  {item.title}
                </h1>
              )}
            </div>

            <div className="xui-col-12 xui-lg-col-4 xui-pl-1">
              <div style={{ position: 'sticky', top: '20px' }}>
                <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
                  <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Image Info
                  </h4>
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    {item.Creator && (
                      <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                        {item.Creator.profile_image ? (
                          <img src={item.Creator.profile_image} alt="" className="xui-bdr-rad-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--neutral-400)' }}><UserAvatar size={24} /></span>
                        )}
                        <div>
                          <span className="xui-font-sz-80 xui-d-block xui-opacity-5">Uploaded by</span>
                          <span className="xui-font-sz-85 xui-font-w-500">{item.Creator.firstname} {item.Creator.lastname}</span>
                        </div>
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div>
                        <span className="xui-font-sz-80 xui-opacity-5 xui-d-block xui-mb-half">Tags</span>
                        <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="xui-font-sz-70" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '3px 8px', borderRadius: '4px' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                        <Time size={14} /> Added
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
        ) : null}
      </div>
    </div>
  );
};

export default ViewGallery;
