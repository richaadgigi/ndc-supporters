'use client';
import { useState } from 'react';
import { Copy } from '@carbon/icons-react';

interface CopyFieldButtonProps {
  fieldName: string;
  size?: number;
}

const CopyFieldButton = ({ fieldName, size = 14 }: CopyFieldButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fieldName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fieldName;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
      style={{
        background: 'none',
        border: 'none',
        padding: '2px',
        color: copied ? 'var(--success)' : 'var(--neutral-400)',
        position: 'relative',
      }}
      title={copied ? 'Copied!' : `Copy field name: ${fieldName}`}
    >
      <Copy size={size} />
      {copied && (
        <span
          className="xui-font-sz-70 xui-font-w-500"
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--neutral-900)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          Copied!
        </span>
      )}
    </button>
  );
};

export default CopyFieldButton;
