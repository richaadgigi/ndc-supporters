'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import QuillMediaModal from './common/QuillMediaModal';

const EDITOR_MEDIA_FOLDER = process.env.NEXT_PUBLIC_CLOUDER_UPLOAD_FOLDER
    ? `${process.env.NEXT_PUBLIC_CLOUDER_UPLOAD_FOLDER}/editor_media`
    : 'editor_media';

// Dynamically import react-quill-new to avoid SSR issues with Next.js
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill-new');
        return function ReactQuillWrapper({ forwardedRef, ...props }: any) {
            return <RQ ref={forwardedRef} {...props} />;
        };
    },
    {
        ssr: false,
        loading: () => <p>Loading Editor...</p>,
    }
);

interface QuillEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const QuillEditor = ({ value, onChange, placeholder = 'Enter content...' }: QuillEditorProps) => {
    const reactQuillRef = useRef<any>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean, type: 'image' | 'video' }>({ isOpen: false, type: 'image' });

    const openModalRef = useRef((type: 'image' | 'video') => {
        setModalState({ isOpen: true, type });
    });

    // Ensure ref always holds the latest function
    openModalRef.current = (type: 'image' | 'video') => {
        setModalState({ isOpen: true, type });
    };

    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                [{ size: [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: function () {
                    // Save selection before opening modal so we know where to insert
                    // @ts-ignore
                    const quill = this.quill;
                    quill.getSelection(true);
                    openModalRef.current('image');
                },
                video: function () {
                    // @ts-ignore
                    const quill = this.quill;
                    quill.getSelection(true);
                    openModalRef.current('video');
                }
            }
        }
    }), []);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'list', 'indent',
        'link', 'image', 'video'
    ];

    const handleCloseModal = () => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleInsertLink = (url: string, type: 'image' | 'video') => {
        let finalUrl = url;
        if (type === 'video' && (url.includes('youtube.com/watch') || url.includes('youtu.be/'))) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('.be/')[1]?.split('?')[0];
            if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
        }

        const quill = reactQuillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection(true);
            const position = range ? range.index : quill.getLength();
            quill.insertEmbed(position, type, finalUrl);
            quill.setSelection(position + 1);
        }
    };

    const handleInsertFile = async (file: File, type: 'image' | 'video') => {
        const quill = reactQuillRef.current?.getEditor();
        if (!quill) return;

        const range = quill.getSelection(true);
        const position = range ? range.index : quill.getLength();

        // Convert file to Base64 for optimistic UI
        // Blob URLs get stripped or broken by Quill's internal sanitizer sometimes.
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const base64Data = reader.result as string;

            // Insert Base64 data optimistically
            quill.insertEmbed(position, type, base64Data);
            quill.setSelection(position + 1);

            try {
                // Upload to Cloudinary
                const { cloudinaryUpload } = await import('../utils/cloudinary');
                const result = await cloudinaryUpload(file, EDITOR_MEDIA_FOLDER);

                // Find the base64 string in Quill's Deltas and replace it
                const contents = quill.getContents();
                let foundIndex = -1;
                let currentIndex = 0;

                for (const op of contents.ops) {
                    if (op.insert && typeof op.insert === 'object' && op.insert[type] === base64Data) {
                        foundIndex = currentIndex;
                        break;
                    }
                    currentIndex += typeof op.insert === 'string' ? op.insert.length : 1;
                }

                if (foundIndex !== -1) {
                    // Replace the base64 with the live URL
                    quill.deleteText(foundIndex, 1);
                    quill.insertEmbed(foundIndex, type, result.secure_url);
                    quill.setSelection(foundIndex + 1);
                } else {
                    // Fallback DOM replacement just in case
                    const querySelector = type === 'image' ? `img[src="${base64Data}"]` : `iframe[src="${base64Data}"]`;
                    const elements = quill.root.querySelectorAll(querySelector);
                    elements.forEach((el: HTMLElement) => {
                        if (type === 'image') (el as HTMLImageElement).src = result.secure_url;
                        else (el as HTMLIFrameElement).src = result.secure_url;
                    });
                    onChange(quill.root.innerHTML);
                }
            } catch (err) {
                console.error("Failed to upload media:", err);

                // Revert optimistic insert
                const contents = quill.getContents();
                let foundIndex = -1;
                let currentIndex = 0;

                for (const op of contents.ops) {
                    if (op.insert && typeof op.insert === 'object' && op.insert[type] === base64Data) {
                        foundIndex = currentIndex;
                        break;
                    }
                    currentIndex += typeof op.insert === 'string' ? op.insert.length : 1;
                }

                if (foundIndex !== -1) {
                    quill.deleteText(foundIndex, 1);
                }
            }
        };
    };

    return (
        <div style={{ backgroundColor: 'white', color: 'black' }}>
            <ReactQuill
                forwardedRef={reactQuillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                style={{ height: '300px', marginBottom: '50px' }}
            />

            <QuillMediaModal
                isOpen={modalState.isOpen}
                type={modalState.type}
                onClose={handleCloseModal}
                onInsertLink={handleInsertLink}
                onInsertFile={handleInsertFile}
            />
        </div>
    );
};

export default QuillEditor;
