'use client';
interface FormSkeletonProps {
  fields?: number;
}

const labelWidths = ['40%', '35%', '50%', '30%', '45%', '38%'];

const FormSkeleton = ({ fields = 6 }: FormSkeletonProps) => {
  return (
    <div>
      <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-1">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <div
              className="xui--skeleton"
              style={{
                width: labelWidths[i % labelWidths.length],
                height: '14px',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              className="xui--skeleton"
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="xui--skeleton"
        style={{
          width: '160px',
          height: '40px',
          borderRadius: '4px',
          marginTop: '24px',
        }}
      />
    </div>
  );
};

export default FormSkeleton;
