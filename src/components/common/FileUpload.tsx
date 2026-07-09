'use client';
import { useState, useRef } from 'react';
import { Upload, TrashCan, Document } from '@carbon/icons-react';
import { cloudinaryUpload } from '../../utils/cloudinary';

interface FileUploadProps {
  value?: string;
  publicId?: string;
  fileType?: string;
  fileName?: string;
  onChange: (url: string, publicId: string, fileType: string, fileName: string) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
}

const FileUpload = ({
  value,
  onChange,
  onError,
  label = 'File',
  required = false,
  folder,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx',
  maxSizeMB = 10,
  fileName: existingFileName,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [displayName, setDisplayName] = useState(existingFileName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const result = await cloudinaryUpload(file, folder);
      const detectedType = file.type.split('/')[1] || file.name.split('.').pop() || 'file';
      setDisplayName(file.name);
      onChange(result.secure_url, result.public_id, detectedType, file.name);
    } catch (err: any) {
      onError?.(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange('', '', '', '');
    setDisplayName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="xui-form-box">
      <label>
        {label} {required && '*'}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {value ? (
        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
          <div
            className="xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center"
            style={{
              width: '80px',
              height: '80px',
              border: '1px solid var(--neutral-200)',
              backgroundColor: 'var(--neutral-50)',
            }}
          >
            <Document size={32} style={{ color: 'var(--neutral-500)' }} />
          </div>
          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
            {displayName && (
              <p className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
            )}
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="xui-btn xui-btn-sm xui-bdr-rad-half"
              style={{
                backgroundColor: 'var(--neutral-100)',
                color: 'var(--neutral-700)',
                border: '1px solid var(--neutral-300)',
              }}
            >
              <Upload size={16} className="xui-mr-half" />
              {uploading ? 'Uploading...' : 'Change'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="xui-btn xui-btn-sm xui-bdr-rad-half"
              style={{
                backgroundColor: 'var(--error-light, #fee2e2)',
                color: 'var(--error)',
                border: '1px solid var(--error)',
              }}
            >
              <TrashCan size={16} className="xui-mr-half" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-flex-jc-center xui-bdr-rad-half xui-cursor-pointer xui-p-1"
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary-600)' : 'var(--neutral-300)'}`,
            backgroundColor: dragOver ? 'var(--primary-50, #f0f9ff)' : 'var(--neutral-50)',
            minHeight: '120px',
            transition: 'all 0.2s ease',
          }}
        >
          {uploading ? (
            <>
              <div
                className="xui-mb-half"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--primary-600)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p className="xui-font-sz-80" style={{ color: 'var(--neutral-600)' }}>
                Uploading...
              </p>
            </>
          ) : (
            <>
              <Document size={32} style={{ color: 'var(--neutral-400)' }} />
              <p className="xui-font-sz-85 xui-mt-half" style={{ color: 'var(--neutral-600)' }}>
                Click or drag file to upload
              </p>
              <p className="xui-font-sz-75" style={{ color: 'var(--neutral-400)' }}>
                Max size: {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FileUpload;
