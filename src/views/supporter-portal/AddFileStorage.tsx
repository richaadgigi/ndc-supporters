'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import fileStorageService from '../../services/fileStorage.service';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert, FileUpload } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { support_group_unique_id: string; title: string; }

const AddFileStorage = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [file, setFile] = useState('');
  const [fileType, setFileType] = useState('');
  const [filePublicId, setFilePublicId] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'file-storage');



  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);



  useEffect(() => {


    if (!accessIds) return;


    supportGroupsService.getAll({ size: 500, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id })


      .then(res => { if (res.success && res.data) setSupportGroups(Array.isArray(res.data) ? res.data : (res.data as any).rows || []); })


      .catch(() => {});


  }, [accessIds?.module_unique_id]);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { support_group_unique_id: '', title: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!file) { setError('Please upload a file'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await fileStorageService.add(
        { support_group_unique_id: data.support_group_unique_id, file, file_type: fileType, file_public_id: filePublicId, ...(data.title && { title: data.title }) },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id }
      );
      if (response.success) {
        setSuccessMessage('File uploaded successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/file-storage'), 1500);
      } else { setError(response.message || 'Failed to upload file'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to upload file')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Upload File" subtitle="Upload a new file to storage" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Upload a file and optionally give it a title.</p>
        <hr className="xui-my-2" />
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form" style={{ maxWidth: '500px' }}>
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
          <div className="xui-form-box">
            <label htmlFor="title">Title (optional)</label>
            <input type="text" id="title" placeholder="Enter file title" {...register('title')} />
          </div>
          <FileUpload
            label="File"
            required
            value={file}
            publicId={filePublicId}
            fileType={fileType}
            onChange={(url, pubId, fType) => { setFile(url); setFilePublicId(pubId); setFileType(fType); }}
            onError={(msg) => { setError(msg); showAlert('error-alert'); }}
            folder="ndcsupporters/file-storage"
            accept="*"
          />
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddFileStorage;
