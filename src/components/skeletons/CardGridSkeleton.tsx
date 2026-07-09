'use client';
interface CardGridSkeletonProps {
  count?: number;
}

const CardGridSkeleton = ({ count = 6 }: CardGridSkeletonProps) => {
  return (
    <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-box-shadow"
          style={{ border: '1px solid var(--neutral-200)' }}
        >
          <div className="xui--skeleton" style={{ width: '100%', height: '160px' }} />
          <div style={{ padding: '16px' }}>
            <div className="xui--skeleton" style={{ width: '70%', height: '16px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="xui--skeleton" style={{ width: '100%', height: '12px', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="xui--skeleton" style={{ width: '85%', height: '12px', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="xui--skeleton xui--skeleton-btn-small" style={{ width: '70px', borderRadius: '4px' }} />
              <div className="xui--skeleton xui--skeleton-btn-small" style={{ width: '60px', borderRadius: '4px' }} />
              <div className="xui--skeleton xui--skeleton-btn-small" style={{ width: '65px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGridSkeleton;
