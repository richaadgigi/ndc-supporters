import React, { useState, useEffect } from 'react';
import { Close, Image as ImageIcon, Video as VideoIcon } from '@carbon/icons-react';

export interface QuillMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'image' | 'video';
    onInsertLink: (url: string, type: 'image' | 'video') => void;
    onInsertFile: (file: File, type: 'image' | 'video') => void;
}

const QuillMediaModal = ({ isOpen, onClose, type, onInsertLink, onInsertFile }: QuillMediaModalProps) => {
    const [tab, setTab] = useState<'link' | 'upload'>('link');
    const [link, setLink] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTab('link');
            setLink('');
            setFile(null);
            setPreviewUrl('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLinkSubmit = () => {
        if (link) {
            onInsertLink(link, type);
            onClose();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleUploadSubmit = () => {
        if (file) {
            onInsertFile(file, type);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', width: '400px',
                padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--neutral-900)' }}>Insert {type === 'image' ? 'Image' : 'Video'}</h3>
                    <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Close size={24} style={{ color: 'var(--neutral-600)' }} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setTab('link')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: tab === 'link' ? '600' : '400', color: tab === 'link' ? 'var(--primary-600)' : 'var(--neutral-600)' }}
                    >
                        Via Link
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('upload')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: tab === 'upload' ? '600' : '400', color: tab === 'upload' ? 'var(--primary-600)' : 'var(--neutral-600)' }}
                    >
                        Upload from PC
                    </button>
                </div>

                {tab === 'link' && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--neutral-700)' }}>{type === 'image' ? 'Image' : 'Video'} URL</label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder={type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '14px' }}
                                autoFocus
                            />
                        </div>
                        <button type="button" onClick={handleLinkSubmit} disabled={!link} style={{ width: '100%', padding: '12px', background: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: link ? 1 : 0.6 }}>
                            Insert
                        </button>
                    </div>
                )}

                {tab === 'upload' && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            {!file ? (
                                <div style={{ border: '2px dashed var(--neutral-300)', padding: '40px 20px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--neutral-50)' }}
                                    onClick={() => document.getElementById('media-upload-input')?.click()}>
                                    {type === 'image' ? <ImageIcon size={32} style={{ color: 'var(--neutral-400)' }} /> : <VideoIcon size={32} style={{ color: 'var(--neutral-400)' }} />}
                                    <p style={{ marginTop: '12px', color: 'var(--neutral-600)', fontSize: '14px' }}>Click to select a {type} file</p>
                                    <input
                                        id="media-upload-input"
                                        type="file"
                                        accept={type === 'image' ? 'image/*' : 'video/*'}
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ border: '1px solid var(--neutral-200)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                                    {type === 'image' ? (
                                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
                                    ) : (
                                        <video src={previewUrl} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} controls />
                                    )}
                                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                                        <button type="button" onClick={() => setFile(null)} style={{ padding: '8px 16px', border: '1px solid var(--neutral-300)', background: 'white', color: 'var(--neutral-700)', cursor: 'pointer', borderRadius: '6px', fontSize: '14px' }}>
                                            Change File
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={handleUploadSubmit} disabled={!file} style={{ width: '100%', padding: '12px', background: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: file ? 1 : 0.6 }}>
                            Upload & Insert
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuillMediaModal;
