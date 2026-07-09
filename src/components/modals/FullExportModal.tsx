'use client';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import type { MemberRole } from '../../services/memberRoles.service';

export interface FullExportFilters {
  member_role_unique_id: string;
  candidate_unique_id: string;
}

interface FullExportModalProps {
  id: string;
  filters: FullExportFilters;
  onFilterChange: (filters: FullExportFilters) => void;
  memberRoles: MemberRole[];
  isExporting: boolean;
  error: string;
  onExport: () => void;
}

const FullExportModal = ({
  id,
  filters,
  onFilterChange,
  memberRoles,
  isExporting,
  error,
  onExport,
}: FullExportModalProps) => {
  const set = (patch: Partial<FullExportFilters>) => onFilterChange({ ...filters, ...patch });
  const safeMemberRoles = memberRoles || [];

  if (!filters) return null;

  return (
    <section className="xui-modal" xui-modal={id}>
      <div className="xui-modal-content xui-max-w-[500px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">Export Members</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={() => modalHide(id)}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-[13px] xui-mb-1" style={{ color: 'var(--neutral-600)' }}>
          Use the filters below to narrow your results, or leave them blank to export all members.
        </p>
        <div className="xui-form">
          <div className="xui-form-box">
            <label>Member Role</label>
            <select
              value={filters.member_role_unique_id}
              onChange={e => set({ member_role_unique_id: e.target.value })}
            >
              <option value="">All Roles</option>
              {safeMemberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <p className="xui-font-sz-[13px] xui-mt-1" style={{ color: 'var(--error)' }}>{error}</p>
        )}
        <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-1-half">
          <button
            type="button"
            className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
            onClick={() => modalHide(id)}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExport}
            className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Download Excel'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default FullExportModal;
