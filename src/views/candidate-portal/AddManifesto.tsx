'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import manifestosService from '../../services/manifestos.service';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import { Alert, showAlert, FileUpload } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { title: string; short_description: string; year_published: string; pages: number; candidate_unique_id: string; }

const AddManifesto = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [file, setFile] = useState('');
  const [fileType, setFileType] = useState('');
  const [filePublicId, setFilePublicId] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const accessIds = getAccessIds('candidate-portal', 'manifestos');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', short_description: '', year_published: '', pages: 0, candidate_unique_id: '' }
  });

  useEffect(() => {
    candidatesService.publicGetAll({ size: 200 }).then(res => {
      if (res.success && res.data) setCandidates(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!file) { setError('Please upload a file'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await manifestosService.add(
        { title: data.title, short_description: data.short_description, year_published: data.year_published, pages: Number(data.pages), file, file_type: fileType, file_public_id: filePublicId, candidate_unique_id: data.candidate_unique_id },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('Manifesto added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/candidate-portal/manifestos'), 1500);
      } else { setError(response.message || 'Failed to add manifesto'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add manifesto')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Manifesto" subtitle="Upload a new manifesto" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the manifesto details and upload the file.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-form-box" {...(errors.candidate_unique_id && { 'xui-error': 'true' })}>
            <label htmlFor="candidate_unique_id">Candidate *</label>
            <select id="candidate_unique_id" {...register('candidate_unique_id', { required: 'Candidate is required' })}>
              <option value="">Select a candidate</option>
              {candidates.map(c => <option key={c.unique_id} value={c.unique_id}>{c.name}{(c as any).Position?.name ? ` (${(c as any).Position.name})` : c.state ? ` - ${c.state}` : ''}</option>)}
            </select>
            {errors.candidate_unique_id && <span className="message">{errors.candidate_unique_id.message}</span>}
          </div>
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
                  <label htmlFor="pages">Number of Pages *</label>
                  <input type="number" id="pages" min={0} {...register('pages', { required: 'Pages is required', min: { value: 0, message: 'Must be 0 or more' } })} />
                  {errors.pages && <span className="message">{errors.pages.message}</span>}
                </div>
              </div>
            </div>
            <div>
              <FileUpload
                label="Manifesto File"
                required
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
            {loading ? 'Adding Manifesto...' : 'Add Manifesto'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddManifesto;
