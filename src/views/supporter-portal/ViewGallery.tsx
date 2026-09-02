'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Renew, Edit, TrashCan, Close } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import galleryService from '../../services/gallery.service';
import type { Gallery } from '../../services/gallery.service';
import { Alert, showAlert, ImageUpload, ErrorState } from '../../components/common';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { UserDetailSkeleton } from '../../components/skeletons';

const ViewGallery = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds, checkAccess } = useGeneral();
  const [item, setItem] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImage, setEditImage] = useState('');
  const [editImagePublicId, setEditImagePublicId] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'gallery');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const detailsForm = useForm<{ title: string }>({ defaultValues: { title: '' } });

  const fetchItem = useCallback(async () => {
    if (!id || !moduleId) return;
    setLoading(true); setFetchError('');
    try {
      const response = await galleryService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success && response.data) {
        setItem(response.data);
      } else {
        setFetchError(response.message || 'Failed to load gallery image');
      }
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to load gallery image'));
    } finally {
      setLoading(false);
    }
  }, [id, moduleId, subModuleId]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const handleSaveDetails = async (data: { title: string }) => {
    if (!moduleId || !subModuleId || !item) return;
    setSaving(true);
    try {
      const response = await galleryService.editDetails({ unique_id: item.unique_id, title: data.title }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) { setSuccessMessage('Details updated successfully'); showAlert('success-alert'); setEditingDetails(false); fetchItem(); }
      else { setActionError(response.message || 'Failed to update details'); showAlert('error-alert'); }
    } catch (err: any) { setActionError(extractErrorMessage(err, 'Failed to update details')); showAlert('error-alert'); } finally { setSaving(false); }
  };

  const handleSaveTags = async () => {
    if (!moduleId || !subModuleId || !item) return;
    setSaving(true);
    try {
      const response = await galleryService.editTags({ unique_id: item.unique_id, tags: editTags }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) { setSuccessMessage('Tags updated successfully'); showAlert('success-alert'); setEditingTags(false); fetchItem(); }
      else { setActionError(response.message || 'Failed to update tags'); showAlert('error-alert'); }
    } catch (err: any) { setActionError(extractErrorMessage(err, 'Failed to update tags')); showAlert('error-alert'); } finally { setSaving(false); }
  };

  const handleSaveImage = async () => {
    if (!moduleId || !subModuleId || !item || !editImage) return;
    setSaving(true);
    try {
      const response = await galleryService.editFile({ unique_id: item.unique_id, image: editImage, image_public_id: editImagePublicId }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) { setSuccessMessage('Image updated successfully'); showAlert('success-alert'); setEditingImage(false); fetchItem(); }
      else { setActionError(response.message || 'Failed to update image'); showAlert('error-alert'); }
    } catch (err: any) { setActionError(extractErrorMessage(err, 'Failed to update image')); showAlert('error-alert'); } finally { setSaving(false); }
  };

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !item) return { success: false, message: 'Unable to delete' };
    return galleryService.remove(item.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  return (
    <div>
      <Navbar title="View Gallery Image" subtitle="Gallery image details" />

      <div className="xui-py-1">
        <a
          onClick={() => router.back()}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {loading ? (
          <UserDetailSkeleton />
        ) : fetchError ? (
          <ErrorState message={fetchError} onRetry={fetchItem} />
        ) : item ? (
          <>
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-mb-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
              {editingImage ? (
                <div className="xui-p-1-half">
                  <h3 className="xui-font-sz-90 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-900)' }}>Replace Image</h3>
                  <ImageUpload
                    label="New Image"
                    value={editImage}
                    publicId={editImagePublicId}
                    onChange={(url, pubId) => { setEditImage(url); setEditImagePublicId(pubId); }}
                    onError={(msg) => { setActionError(msg); showAlert('error-alert'); }}
                    folder="ndcsupporters/gallery"
                  />
                  <div className="xui-d-flex xui-grid-gap-half xui-mt-1">
                    <button onClick={handleSaveImage} disabled={saving || !editImage} className="xui-btn xui-font-sz-80 xui-bdr-rad-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                      {saving ? 'Saving...' : 'Save Image'}
                    </button>
                    <button onClick={() => setEditingImage(false)} disabled={saving} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="xui-pos-relative">
                  <img src={item.image} alt={item.title || 'Gallery image'} className="xui-w-fluid-100 xui-d-block" style={{ maxHeight: '500px', objectFit: 'contain', backgroundColor: 'var(--neutral-100)' }} />
                  {canEdit && (
                    <button
                      onClick={() => { setEditImage(''); setEditImagePublicId(''); setEditingImage(true); }}
                      className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-70 xui-font-w-500"
                      style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px' }}
                    >
                      <Edit size={14} /> Replace
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Details</h3>
                  {canEdit && !editingDetails && (
                    <button onClick={() => { detailsForm.reset({ title: item.title || '' }); setEditingDetails(true); }} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)', padding: '6px 12px', borderRadius: '4px' }}>
                      <Edit size={14} /> Edit
                    </button>
                  )}
                </div>
                <div className="xui-p-1">
                  {editingDetails ? (
                    <form onSubmit={detailsForm.handleSubmit(handleSaveDetails)} className="xui-form">
                      <div className="xui-form-box" {...(detailsForm.formState.errors.title && { 'xui-error': 'true' })}>
                        <label>Title</label>
                        <input type="text" placeholder="Enter title" {...detailsForm.register('title', { maxLength: { value: 500, message: 'Maximum 500 characters' } })} />
                        {detailsForm.formState.errors.title && <span className="message">{detailsForm.formState.errors.title.message}</span>}
                      </div>
                      <div className="xui-d-flex xui-grid-gap-half">
                        <button type="submit" disabled={saving} className="xui-btn xui-font-sz-80 xui-bdr-rad-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>{saving ? 'Saving...' : 'Save'}</button>
                        <button type="button" onClick={() => setEditingDetails(false)} disabled={saving} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                      <div>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Title</span>
                        <span className="xui-font-sz-85">{item.title || '-'}</span>
                      </div>
                      <div>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Status</span>
                        <span className={`xui-badge ${item.status === 1 ? 'xui-badge-success' : 'xui-badge-danger'} xui-font-sz-70`}>
                          {item.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created By</span>
                        <span className="xui-font-sz-85">{item.Creator ? `${item.Creator.firstname} ${item.Creator.lastname}` : '-'}</span>
                      </div>
                      <div>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created</span>
                        <span className="xui-font-sz-85">{formatDate(item.createdAt, 'MMM D, YYYY h:mm A')}</span>
                      </div>
                      <div>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Updated</span>
                        <span className="xui-font-sz-85">{formatDate(item.updatedAt, 'MMM D, YYYY h:mm A')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Tags</h3>
                    {canEdit && !editingTags && (
                      <button onClick={() => { setEditTags(item.tags || []); setTagInput(''); setEditingTags(true); }} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)', padding: '6px 12px', borderRadius: '4px' }}>
                        <Edit size={14} /> Edit
                      </button>
                    )}
                  </div>
                  <div className="xui-p-1">
                    {editingTags ? (
                      <div>
                        <div className="xui-form">
                          <div className="xui-form-box">
                            <input
                              type="text"
                              placeholder="Type a tag and press Enter"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = tagInput.trim();
                                  if (val && !editTags.includes(val)) setEditTags([...editTags, val]);
                                  setTagInput('');
                                }
                              }}
                            />
                          </div>
                        </div>
                        {editTags.length > 0 && (
                          <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap xui-mb-1">
                            {editTags.map((tag, i) => (
                              <span key={i} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '4px 10px', borderRadius: '4px' }}>
                                {tag}
                                <Close size={12} className="xui-cursor-pointer" onClick={() => setEditTags(editTags.filter((_, idx) => idx !== i))} />
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="xui-d-flex xui-grid-gap-half">
                          <button onClick={handleSaveTags} disabled={saving} className="xui-btn xui-font-sz-80 xui-bdr-rad-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>{saving ? 'Saving...' : 'Save Tags'}</button>
                          <button onClick={() => setEditingTags(false)} disabled={saving} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {item.tags && item.tags.length > 0 ? (
                          <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap">
                            {item.tags.map((tag, i) => (
                              <span key={i} className="xui-d-inline-flex xui-flex-ai-center xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '4px 10px', borderRadius: '4px' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="xui-font-sz-85 xui-opacity-5">No tags</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {canDelete && (
                  <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                    <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                      <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Actions</h3>
                    </div>
                    <div className="xui-p-1">
                      <button
                        onClick={() => modalShow('delete-modal')}
                        className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                        style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: 'none' }}
                      >
                        <TrashCan size={16} /> Delete Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="delete-modal" title="Delete Image" message="Are you sure you want to delete this gallery image?" itemName={item?.title || 'this image'} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={() => router.push('/dashboard/supporter-portal/gallery')} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default ViewGallery;
