'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import fileStorageService from '../../services/fileStorage.service';
import { Alert, showAlert, FileUpload } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { title: string; }

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

  const { register, handleSubmit } = useForm<FormData>({ defaultValues: { title: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    if (!file) { setError('Please upload a file'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await fileStorageService.portalAdd(
        { file, file_type: fileType, file_public_id: filePublicId, ...(data.title && { title: data.title }) },
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
