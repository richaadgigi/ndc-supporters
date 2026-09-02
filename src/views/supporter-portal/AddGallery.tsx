'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Close } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import galleryService from '../../services/gallery.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { support_group_unique_id: string; title: string; tags: string[]; }

const AddGallery = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [tagInput, setTagInput] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'gallery');



  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);



  useEffect(() => {


    if (!accessIds) return;


    supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id })


      .then(res => { if (res.success && res.data) setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []); })


      .catch(() => {});


  }, [accessIds?.module_unique_id]);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({ defaultValues: { support_group_unique_id: '', title: '', tags: [] } });
  const tags = watch('tags');

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!image) { setError('Image is required'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await galleryService.add(
        { support_group_unique_id: data.support_group_unique_id,
          ...(data.title && { title: data.title }),
          ...(data.tags.length > 0 && { tags: data.tags }),
          image,
          image_public_id: imagePublicId,
        },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Gallery image added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/gallery'), 1500);
      } else { setError(response.message || 'Failed to add gallery image'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add gallery image')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Gallery Image" subtitle="Upload a new gallery image" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the gallery image details below. Image is required.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form xui-max-w-[600px]">
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
          <ImageUpload
            label="Image *"
            value={image}
            publicId={imagePublicId}
            onChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); }}
            onError={(msg) => { setError(msg); showAlert('error-alert'); }}
            folder="ndcsupporters/gallery"
          />
          <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
            <label htmlFor="title">Title</label>
            <input type="text" id="title" placeholder="Enter image title (optional)" {...register('title', { maxLength: { value: 500, message: 'Maximum 500 characters' } })} />
            {errors.title && <span className="message">{errors.title.message}</span>}
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
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Adding Image...' : 'Add Image'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddGallery;
