'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { Renew } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupMembersService from '../../services/supportGroupMembers.service';
import type { SupportGroupMember } from '../../services/supportGroupMembers.service';
import { Alert, EmptyState, ErrorState } from '../../components/common';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { TableSkeleton } from '../../components/skeletons';

const statusStyle = (status: string | null) => {
  if (status === 'Active') return { backgroundColor: 'var(--success-light)', color: 'var(--success)' };
  if (status === 'Suspended') return { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' };
  if (status === 'Revoked') return { backgroundColor: 'var(--error-light)', color: 'var(--error)' };
  return { backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)' };
};

const MySupportGroups = () => {
  const { getAccessIds } = useGeneral();
  const [items, setItems] = useState<SupportGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const accessIds = useMemo(() => getAccessIds('supporter-portal', 'my-support-groups'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchItems = useCallback(async () => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    setLoading(true); setFetchError('');
    try {
      const res = await supportGroupMembersService.portalGetUserGroups({ module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (res.success && res.data) {
        setItems(Array.isArray(res.data) ? res.data : res.data.rows || []);
      } else { setItems([]); }
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch your support groups')); } finally { setLoading(false); }
  }, [moduleId, subModuleId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div>
      <Navbar title="My Support Groups" subtitle="Support groups you belong to" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-flex-end xui-mb-1-half">
          <button onClick={fetchItems} className="xui-btn xui-btn-text xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 10px' }} disabled={loading} title="Refresh">
            <span className="icon-container"><Renew size={14} /></span>
          </button>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? <TableSkeleton /> : fetchError ? (
              <ErrorState title="Failed to load your support groups" message={fetchError} onRetry={fetchItems} />
            ) : items.length === 0 ? (
              <EmptyState title="No support groups" message="You have not joined any support group yet." />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead><tr><th>Support Group</th><th>Type</th><th>State</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      <td className="xui-font-w-500">{item.SupportGroup?.name || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.SupportGroup?.SupportGroupType?.title || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.SupportGroup?.state || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.admin ? 'Group Admin' : 'Member'}</td>
                      <td>
                        <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', ...statusStyle(item.member_status) }}>
                          {item.member_status || 'Pending'}
                        </span>
                      </td>
                      <td className="xui-font-sz-85 xui-opacity-6">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={fetchError} />
    </div>
  );
};

export default MySupportGroups;
