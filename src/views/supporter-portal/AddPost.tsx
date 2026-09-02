'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import QuillEditor from '@/components/QuillEditor';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Close } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import postsService from '../../services/posts.service';
import categoriesService from '../../services/categories.service';
import type { Category } from '../../services/categories.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';
import { extractErrorMessage, sanitizeHTML } from '../../utils/formatters';

interface FormData { support_group_unique_id: string; title: string; alt_text: string; category_unique_id: string; tags: string[]; }

const AddPost = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'posts');



  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);



  useEffect(() => {


    if (!accessIds) return;


    supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id })


      .then(res => { if (res.success && res.data) setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []); })


      .catch(() => {});


  }, [accessIds?.module_unique_id]);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { support_group_unique_id: '', title: '', alt_text: '', category_unique_id: '', tags: [] } });
  const tags = watch('tags');

  useEffect(() => {
    if (!accessIds) { setCategories([]); return; }
    const fetchCategories = async () => {
      try {
        const res = await categoriesService.getAll({ size: 200, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });
        if (res.success && res.data) setCategories(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
        else setCategories([]);
      } catch { setCategories([]); }
    };
    fetchCategories();
  }, [accessIds?.module_unique_id]);

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!description || description === '<p><br></p>') { setError('Description is required'); showAlert('error-alert'); return; }
    setLoading(true);
    const cleanDescription = sanitizeHTML(description);
    if (cleanDescription.length > 4294967295) { setError(`Description is too long. Maximum allowed is 4,294,967,295 characters.`); showAlert('error-alert'); setLoading(false); return; }
    try {
      const response = await postsService.add(
        { support_group_unique_id: data.support_group_unique_id,
          title: data.title,
          ...(data.alt_text && { alt_text: data.alt_text }),
          description: cleanDescription,
          ...(image && { image, image_public_id: imagePublicId }),
          ...(data.tags.length > 0 && { tags: data.tags }),
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        if (data.category_unique_id && response.data?.unique_id) {
          try {
            await postsService.editCategory(
              { unique_id: response.data.unique_id, category_unique_id: data.category_unique_id },
              { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
            );
          } catch {}
        }
        setSuccessMessage('Post added successfully'); showAlert('success-alert');
        reset(); setDescription(''); setImage(''); setImagePublicId('');
        setTimeout(() => router.push('/dashboard/supporter-portal/posts'), 1500);
      } else { setError(response.message || 'Failed to add post'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add post')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Post" subtitle="Create a new support group post" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the post details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-form-box" {...(errors.support_group_unique_id && { 'xui-error': 'true' })}>
            <label htmlFor="support_group_unique_id">Support Group *</label>
            <select id="support_group_unique_id" {...register('support_group_unique_id', { required: 'Support group is required' })}>
              <option value="">Select a support group</option>
              {supportGroups.map(g => (
                <option key={g.unique_id} value={g.unique_id}>{g.name}{g.state ? ` - ${g.state}` : ''}</option>
              ))}
            </select>
            {errors.support_group_unique_id && <span className="message">{errors.support_group_unique_id.message}</span>}
          </div>
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
                <label htmlFor="category_unique_id" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Category <a href="/dashboard/supporter-portal/categories/add" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 500, backgroundColor: 'var(--primary-100)', padding: '2px 10px', borderRadius: '20px', textDecoration: 'none' }}>+ Add new</a></label>
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
                folder="ndcsupporters/posts"
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
            {loading ? 'Adding Post...' : 'Add Post'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddPost;
