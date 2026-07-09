'use client';
const DetailSkeleton = () => {
  return (
    <div>
      <div className="xui--skeleton xui-mb-1" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />

      <div className="xui-row">
        <div className="xui-col-12 xui-lg-col-8">
          <div className="xui--skeleton xui-mb-1" style={{ width: '80%', height: '28px', borderRadius: '4px' }} />
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1">
            <div className="xui--skeleton xui-w-32 xui-h-32 xui-bdr-rad-circle" style={{ flexShrink: 0 }} />
            <div className="xui--skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
            <div className="xui--skeleton" style={{ width: '80px', height: '22px', borderRadius: '4px' }} />
            <div className="xui--skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
          </div>
          <div className="xui--skeleton xui-mb-1-half xui-bdr-rad-half xui-w-fluid-100" style={{ height: '300px' }} />
          <div className="xui--skeleton xui-mb-half xui-w-fluid-100" style={{ height: '14px', borderRadius: '4px' }} />
          <div className="xui--skeleton xui-mb-half" style={{ width: '95%', height: '14px', borderRadius: '4px' }} />
          <div className="xui--skeleton xui-mb-half" style={{ width: '88%', height: '14px', borderRadius: '4px' }} />
          <div className="xui--skeleton xui-mb-half" style={{ width: '92%', height: '14px', borderRadius: '4px' }} />
          <div className="xui--skeleton" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
        </div>

        <div className="xui-col-12 xui-lg-col-4 xui-pl-1">
          <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
            <div className="xui--skeleton xui-mb-1" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="xui-mb-1">
                <div className="xui--skeleton xui-mb-half" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
                <div className="xui--skeleton" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
              </div>
            ))}
            <div className="xui--skeleton xui--skeleton-btn-small xui-w-fluid-100 xui-mt-half" style={{ borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSkeleton;
