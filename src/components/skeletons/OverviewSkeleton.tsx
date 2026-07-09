'use client';
const OverviewSkeleton = () => {
  return (
    <div>
      <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '20px',
              border: '1px solid var(--neutral-200)',
              borderRadius: '8px',
            }}
          >
            <div className="xui--skeleton" style={{ width: '50%', height: '12px', borderRadius: '4px', marginBottom: '12px' }} />
            <div className="xui--skeleton" style={{ width: '60%', height: '24px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      <div
        style={{
          border: '1px solid var(--neutral-200)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div className="xui--skeleton" style={{ width: '30%', height: '16px', borderRadius: '4px', marginBottom: '16px' }} />
        <div className="xui--skeleton" style={{ width: '100%', height: '200px', borderRadius: '4px' }} />
      </div>
    </div>
  );
};

export default OverviewSkeleton;
