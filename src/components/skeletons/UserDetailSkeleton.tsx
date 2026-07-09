'use client';
const UserDetailSkeleton = () => {
  return (
    <>
      <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-mb-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
        <div className="xui-p-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1-half">
            <div className="xui--skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0 }} />
            <div>
              <div className="xui--skeleton" style={{ width: '200px', height: '20px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="xui--skeleton" style={{ width: '160px', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="xui--skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
            <div className="xui--skeleton" style={{ width: '160px', height: '16px', borderRadius: '4px' }} />
          </div>
          <div className="xui-p-1">
            <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
              {['40%', '35%', '45%', '30%'].map((labelW, i) => (
                <div key={i}>
                  <div className="xui--skeleton" style={{ width: labelW, height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
                  <div className="xui--skeleton" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
            <div className="xui--skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px' }} />
          </div>
          <div className="xui-p-1">
            <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
              <div>
                <div className="xui--skeleton" style={{ width: '35%', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
                <div className="xui--skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} />
              </div>
              <div>
                <div className="xui--skeleton" style={{ width: '30%', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <div className="xui--skeleton" style={{ width: '160px', height: '36px', borderRadius: '6px' }} />
                  <div className="xui--skeleton" style={{ width: '120px', height: '36px', borderRadius: '6px' }} />
                </div>
              </div>
              <div className="xui-mt-half">
                <div className="xui--skeleton" style={{ width: '40%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
                <div className="xui-d-flex xui-flex-wrap xui-grid-gap-half">
                  <div className="xui--skeleton" style={{ width: '110px', height: '34px', borderRadius: '6px' }} />
                  <div className="xui--skeleton" style={{ width: '130px', height: '34px', borderRadius: '6px' }} />
                  <div className="xui--skeleton" style={{ width: '120px', height: '34px', borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailSkeleton;
