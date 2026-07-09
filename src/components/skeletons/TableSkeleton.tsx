'use client';
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const columnWidths = ['60%', '45%', '70%', '50%', '40%', '55%', '65%', '35%'];

const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => {
  return (
    <div className="xui-table-responsive">
      <table className="xui-table">
        <thead>
          <tr className="xui-text-left">
            {Array.from({ length: columns }).map((_, ci) => (
              <th key={ci} style={{ padding: '12px 16px' }}>
                <div className="xui--skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri}>
              {Array.from({ length: columns }).map((_, ci) => (
                <td key={ci} style={{ padding: '14px 16px' }}>
                  <div
                    className="xui--skeleton"
                    style={{
                      width: columnWidths[(ri + ci) % columnWidths.length],
                      height: '14px',
                      borderRadius: '4px',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
