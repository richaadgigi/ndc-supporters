'use client';
import Link from 'next/link';
import { ArrowLeft } from '@carbon/icons-react';

const NotFound = () => {
  return (
    <div className="xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-flex-jc-center xui-h-fluid-100 xui-min-h-[100vh] xui-p-2">
      <h1 className="xui-font-sz-[120px] xui-font-w-bold xui-opacity-2">404</h1>
      <h2 className="xui-font-sz-[24px] xui-mt-1">Page Not Found</h2>
      <p className="xui-font-sz-[14px] xui-opacity-6 xui-mt-half xui-text-center">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="xui-btn xui-bdr-rad-[8px] xui-mt-2 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
        style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
