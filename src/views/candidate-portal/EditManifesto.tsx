'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import manifestosService from '../../services/manifestos.service';
import type { Manifesto } from '../../services/manifestos.service';
import { Alert, showAlert, FileUpload } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { title: string; short_description: string; year_published: string; pages: number; }

const EditManifesto = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Manifesto | null>(null);
  const [file, setFile] = useState('');
  const [fileType, setFileType] = useState('');
  const [filePublicId, setFilePublicId] = useState('');

  const accessIds = getAccessIds('candidate-portal', 'manifestos');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', short_description: '', year_published: '', pages: 0 }
  });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const res = await manifestosService.get(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) {
          setItem(res.data);
          reset({ title: res.data.title, short_description: res.data.short_description, year_published: res.data.year_published, pages: res.data.pages });
          setFile(res.data.file);
          setFileType(res.data.file_type);
          setFilePublicId(res.data.file_public_id);
        }
      } catch (err) { console.error('Failed to fetch manifesto:', err); setError('Failed to load manifesto details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id || !item) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
      const promises: Promise<any>[] = [];

      if (data.title !== item.title || data.short_description !== item.short_description || data.year_published !== item.year_published || Number(data.pages) !== item.pages) {
        promises.push(manifestosService.editDetails({ unique_id: id, title: data.title, short_description: data.short_description, year_published: data.year_published, pages: Number(data.pages) }, params));
      }
      if (file !== item.file || filePublicId !== item.file_public_id) {
        promises.push(manifestosService.editFile({ unique_id: id, file, file_type: fileType, file_public_id: filePublicId }, params));
      }

      if (promises.length === 0) { setError('No changes detected'); showAlert('error-alert'); setLoading(false); return; }

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.success);
      if (failed) { setError(failed.message || 'Failed to update manifesto'); showAlert('error-alert'); }
      else { setSuccessMessage('Manifesto updated successfully'); showAlert('success-alert'); setTimeout(() => router.push('/dashboard/candidate-portal/manifestos'), 1500); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update manifesto')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (<div><Navbar title="Edit Manifesto" subtitle="Modify manifesto" /><div className="xui-py-1"><FormSkeleton fields={4} /></div></div>);
  if (!item) return (<div><Navbar title="Edit Manifesto" subtitle="Modify manifesto" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">Manifesto not found or you do not have access.</p></div></div>);

  return (
    <div>
      <Navbar title="Edit Manifesto" subtitle="Modify manifesto" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box" {...(errors.title && { 'xui-error': 'true' })}>
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" placeholder="Enter manifesto title" {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
                {errors.title && <span className="message">{errors.title.message}</span>}
              </div>
              <div className="xui-form-box" {...(errors.short_description && { 'xui-error': 'true' })}>
                <label htmlFor="short_description">Short Description *</label>
                <textarea id="short_description" placeholder="Enter short description" rows={3} {...register('short_description', { required: 'Description is required', maxLength: { value: 150, message: 'Maximum 150 characters' } })} />
                {errors.short_description && <span className="message">{errors.short_description.message}</span>}
              </div>
              <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                <div className="xui-form-box" {...(errors.year_published && { 'xui-error': 'true' })}>
                  <label htmlFor="year_published">Year Published *</label>
                  <input type="text" id="year_published" placeholder="e.g. 2024" maxLength={4} {...register('year_published', { required: 'Year is required', pattern: { value: /^\d{4}$/, message: 'Must be a 4-digit year' } })} />
                  {errors.year_published && <span className="message">{errors.year_published.message}</span>}
                </div>
                <div className="xui-form-box" {...(errors.pages && { 'xui-error': 'true' })}>
                  <label htmlFor="pages">Pages *</label>
                  <input type="number" id="pages" min={0} {...register('pages', { required: 'Pages is required', min: { value: 0, message: 'Must be 0 or more' } })} />
                  {errors.pages && <span className="message">{errors.pages.message}</span>}
                </div>
              </div>
            </div>
            <div>
              <FileUpload
                label="Manifesto File"
                value={file}
                publicId={filePublicId}
                fileType={fileType}
                onChange={(url, pubId, fType) => { setFile(url); setFilePublicId(pubId); setFileType(fType); }}
                onError={(msg) => { setError(msg); showAlert('error-alert'); }}
                folder="ndccampaign/manifestos"
                accept=".pdf,.doc,.docx"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Updating Manifesto...' : 'Update Manifesto'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditManifesto;
