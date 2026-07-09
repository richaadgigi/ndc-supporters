'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Close, Checkmark } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import postsService from '../../services/posts.service';
import type { Post } from '../../services/posts.service';
import categoriesService from '../../services/categories.service';
import type { Category } from '../../services/categories.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { title: string; alt_text: string; caption: string; category_unique_id: string; tags: string[]; }

const EditPost = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  const accessIds = getAccessIds('candidate-portal', 'posts');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({ defaultValues: { title: '', alt_text: '', caption: '', category_unique_id: '', tags: [] } });
  const tags = watch('tags');

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      const populate = (data: any) => {
        setItem(data);
        reset({ title: data.title, alt_text: data.alt_text || '', caption: data.caption || '', category_unique_id: data.category_unique_id || '', tags: data.tags || [] });
        setDescription(data.description || '');
        setImage(data.image || '');
        setImagePublicId(data.image_public_id || '');
        if (data.candidate_unique_id) {
          categoriesService.getCategories({ size: 200, module_unique_id: moduleId, sub_module_unique_id: subModuleId, candidate_unique_id: data.candidate_unique_id }).then(res => {
            if (res.success && res.data) setCategories(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
          }).catch(() => {});
        }
      };
      try {
        const itemRes = await postsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (itemRes.success && itemRes.data) populate(itemRes.data);
      } catch (err: any) { setError(extractErrorMessage(err, 'Failed to load post')); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchData();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id || !item) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!description || description === '<p><br></p>') { setError('Description is required'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    const cleanDescription = sanitizeHTML(description);
    if (cleanDescription.length > 4294967295) { setError(`Description is too long. Maximum allowed is 4,294,967,295 characters.`); showAlert('error-alert'); setLoading(false); return; }
    try {
      const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
      const promises: Promise<any>[] = [];

      promises.push(postsService.editDetails({ unique_id: id, title: data.title, alt_text: data.alt_text || null, caption: data.caption || null, description: cleanDescription, category_unique_id: data.category_unique_id || null, tags: data.tags.length > 0 ? data.tags : null }, params));

      if (image !== (item.image || '') || imagePublicId !== (item.image_public_id || '')) {
        promises.push(postsService.editImage({ unique_id: id, image, image_public_id: imagePublicId }, params));
      }

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.success);
      if (failed) { setError(failed.message || 'Failed to update post'); showAlert('error-alert'); }
      else { setSuccessMessage('Post updated successfully'); showAlert('success-alert'); setTimeout(() => router.push('/dashboard/candidate-portal/posts'), 1500); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update post')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  const handleApproveConfirm = async (): Promise<{ success: boolean; message: string }> => {
    if (!moduleId || !subModuleId || !id) return { success: false, message: 'Missing access information' };
    const response = await postsService.approve({ unique_id: id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
    if (response.success) setItem(prev => prev ? { ...prev, approved_by: 'approved', status: 1 } : prev);
    return response;
  };

  if (loadingItem) return (<div><Navbar title="Edit Post" subtitle="Modify post details" /><div className="xui-py-1"><FormSkeleton fields={5} /></div></div>);
  if (!item) return (<div><Navbar title="Edit Post" subtitle="Modify post details" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Post not found or you do not have access.</p></div></div>);

  const isPending = item.approved_by === null;

  return (
    <div>
      <Navbar title="Edit Post" subtitle="Modify post details" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          {isPending && (
            <button type="button" onClick={() => modalShow('approve-post-modal')} className="xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none' }}>
              <span className="icon-container"><Checkmark size={16} /></span>
              Approve Post
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" placeholder="Enter post title" {...register('title', { required: 'Title is required', maxLength: { value: 300, message: 'Maximum 300 characters' } })} />
                {errors.title && <span className="message">{errors.title.message}</span>}
              </div>
              <div className="xui-form-box">
                <label htmlFor="alt_text">Alt Text (SEO)</label>
                <input type="text" id="alt_text" placeholder="Enter alt text for SEO" {...register('alt_text')} />
              </div>
              <div className="xui-form-box">
                <label htmlFor="caption">Caption</label>
                <input type="text" id="caption" placeholder="Enter image caption" {...register('caption')} />
              </div>
              <div className="xui-form-box">
                <label htmlFor="category_unique_id" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Category <a href="/dashboard/candidate-portal/categories/add" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 500, backgroundColor: 'var(--primary-100)', padding: '2px 10px', borderRadius: '20px', textDecoration: 'none' }}>+ Add new</a></label>
                <select id="category_unique_id" {...register('category_unique_id')}>
                  <option value="">--Select category (optional)--</option>
                  {categories.map(c => <option key={c.unique_id} value={c.unique_id}>{c.name}</option>)}
                </select>
              </div>
              <div className="xui-form-box">
                <label>Tags</label>
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <input
                    type="text"
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = tagInput.trim();
                        if (val && !tags.includes(val)) setValue('tags', [...tags, val]);
                        setTagInput('');
                      }
                    }}
                  />
                </div>
                {tags.length > 0 && (
                  <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap xui-mt-half">
                    {tags.map((tag, i) => (
                      <span key={i} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '4px 10px', borderRadius: '4px' }}>
                        {tag}
                        <Close size={12} className="xui-cursor-pointer" onClick={() => setValue('tags', tags.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ImageUpload
                label="Cover Image"
                value={image}
                publicId={imagePublicId}
                onChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); }}
                onError={(msg) => { setError(msg); showAlert('error-alert'); }}
                folder="ndccampaign/posts"
              />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="xui-form-box">
                <label>Description *</label>
                <QuillEditor value={description} onChange={setDescription} />
                <p style={{ fontSize: '12px', marginTop: '6px', color: description.length > 4294967295 ? 'var(--error)' : 'var(--neutral-400)' }}>
                  {description.length.toLocaleString()} / 4,294,967,295 characters
                </p>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Updating Post...' : 'Update Post'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal
        id="approve-post-modal"
        title="Approve Post"
        message="Are you sure you want to approve the post"
        itemName={item.title}
        confirmText="Approve"
        confirmingText="Approving..."
        confirmButtonStyle="success"
        onConfirm={handleApproveConfirm}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default EditPost;
