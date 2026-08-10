'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Download, OverflowMenuVertical, View, Checkmark, PauseOutline, StopOutline, UserAdmin, Add } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupMembersService from '../../services/supportGroupMembers.service';
import type { SupportGroupMember } from '../../services/supportGroupMembers.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllSupportGroupMembers = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<SupportGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<SupportGroupMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'activate' | 'suspend' | 'revoke' | 'toggleAdmin' | 'autoApprove' | 'approveSelected'>('approve');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const accessIds = useMemo(() => getAccessIds('supporter', 'support-group-members'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');
  const canAdd = accessResult.accessTypes.includes('add');
  const canAutoApprove = canEdit && accessResult.accessTypes.includes('elevated_role');
  const pendingCount = items.filter(i => i.member_status === 'Pending').length;
  const pendingIds = items.filter(i => i.member_status === 'Pending').map(i => i.unique_id);
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.includes(id));

  const toggleSelected = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAllPending = () => setSelectedIds(allPendingSelected ? [] : pendingIds);

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) { setItems(response.data); setTotalPages(1); }
      else { setItems(response.data.rows || []); setTotalPages(response.data.pages || 1); }
    } else { setItems([]); }
  };

  const fetchItems = useCallback(async () => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    setLoading(true); setFetchError('');
    try {
      handleResponse(await supportGroupMembersService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch members')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId || !query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try {
      handleResponse(await supportGroupMembersService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      handleResponse(await supportGroupMembersService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleConfirmAction = async () => {
    if (!moduleId || !subModuleId) return { success: false, message: 'You do not have access to this module' };
    const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
    if (confirmAction === 'autoApprove') return supportGroupMembersService.autoApprove(params);
    if (confirmAction === 'approveSelected') return supportGroupMembersService.approveMultiple({ unique_ids: selectedIds }, params);
    if (!selectedItem) return { success: false, message: 'No item selected' };
    if (confirmAction === 'approve') return supportGroupMembersService.approve({ unique_id: selectedItem.unique_id }, params);
    if (confirmAction === 'activate') return supportGroupMembersService.activate({ unique_id: selectedItem.unique_id }, params);
    if (confirmAction === 'suspend') return supportGroupMembersService.suspend({ unique_id: selectedItem.unique_id }, params);
    if (confirmAction === 'toggleAdmin') return supportGroupMembersService.toggleAdmin({ unique_id: selectedItem.unique_id }, params);
    return supportGroupMembersService.revoke({ unique_id: selectedItem.unique_id }, params);
  };

  const actionLabels = { approve: 'Approve', activate: 'Activate', suspend: 'Suspend', revoke: 'Revoke', toggleAdmin: 'Toggle Admin', autoApprove: 'Auto Approve', approveSelected: 'Approve Selected' };
  const actionStyles = { approve: 'success', activate: 'success', suspend: 'warning', revoke: 'danger', toggleAdmin: 'success', autoApprove: 'success', approveSelected: 'success' } as const;
  const actionMessages: Record<typeof confirmAction, string> = {
    approve: 'Are you sure you want to approve this member?',
    activate: 'Are you sure you want to activate this member?',
    suspend: 'Are you sure you want to suspend this member?',
    revoke: 'Are you sure you want to revoke this member?',
    toggleAdmin: selectedItem?.admin ? 'Remove group admin rights from this member?' : 'Grant group admin rights to this member?',
    autoApprove: 'Approve every pending support group member?',
    approveSelected: `Approve the ${selectedIds.length} selected pending ${selectedIds.length === 1 ? 'member' : 'members'}?`,
  };

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handleRefresh = () => { setSearchQuery(''); setFilterValues({ start_date: '', end_date: '' }); setSelectedIds([]); setCurrentPage(1); fetchItems(); };
  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); if (value) setFilterValues({ start_date: '', end_date: '' }); };
  const handleSearch = (value: string) => { if (value.trim()) searchItems(value); else fetchItems(); };
  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues); setSearchQuery(''); setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterItems({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchItems();
  };
  const handleClearFilters = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchItems(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !hasActiveFilters) fetchItems();
  }, [moduleId, subModuleId, currentPage, fetchItems, searchQuery]);

  const getStatusBadge = (status: string | null) => {
    if (status === 'Active') return <span className="xui-badge xui-badge-success xui-font-sz-70">Active</span>;
    if (status === 'Suspended') return <span className="xui-badge xui-badge-warning xui-font-sz-70">Suspended</span>;
    if (status === 'Revoked') return <span className="xui-badge xui-badge-danger xui-font-sz-70">Revoked</span>;
    if (status === 'Inactive') return <span className="xui-badge xui-badge-neutral xui-font-sz-70">Inactive</span>;
    return <span className="xui-badge xui-badge-neutral xui-font-sz-70">Pending</span>;
  };

  return (
    <div>
      <Navbar title="Support Group Members" subtitle="Manage all support group members" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half" style={{ gap: '8px' }}>
          <div className="xui-d-flex xui-flex-ai-center" style={{ gap: '6px', flexShrink: 1, minWidth: 0 }}>
            <SearchInput placeholder="Search members..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="200px" />
            <FilterModal id="sgm" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center" style={{ gap: '6px', flexShrink: 0 }}>
            {canEdit && selectedIds.length > 0 && <button onClick={() => { setSelectedItem(null); setConfirmAction('approveSelected'); modalShow('action-modal'); }} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: 'none', whiteSpace: 'nowrap', padding: '6px 10px' }} disabled={loading}><span className="icon-container"><Checkmark size={14} /></span> Approve ({selectedIds.length})</button>}
            {canAutoApprove && <button onClick={() => { setSelectedItem(null); setConfirmAction('autoApprove'); modalShow('action-modal'); }} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none', whiteSpace: 'nowrap', padding: '6px 10px' }} disabled={loading || pendingCount === 0}><span className="icon-container"><Checkmark size={14} /></span> Auto-Approve</button>}
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 10px' }} disabled={loading || items.length === 0} title="Export current page"><span className="icon-container"><Download size={14} /></span></button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 10px' }} disabled={loading} title="Refresh"><span className="icon-container"><Renew size={14} /></span></button>
            {canAdd && <button onClick={() => router.push('/dashboard/supporter/support-group-members/add')} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', whiteSpace: 'nowrap', padding: '6px 10px' }}><span className="icon-container"><Add size={14} /></span> Add</button>}
          </div>
        </div>
        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? <TableSkeleton /> : fetchError ? <ErrorState title="Failed to load members" message={fetchError} onRetry={handleRefresh} /> : items.length === 0 ? <EmptyState title="No members found" message={searchQuery ? "No members match your search." : "No support group members yet."} /> : (
              <table className="xui-table" xui-style="2">
                <thead><tr>{canEdit && <th style={{ width: '36px' }}><input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAllPending} disabled={pendingIds.length === 0} title="Select all pending" /></th>}<th>Name</th><th>Email</th><th>Support Group</th><th>Admin</th><th>Status</th><th>Joined</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      {canEdit && <td>{item.member_status === 'Pending' && <input type="checkbox" checked={selectedIds.includes(item.unique_id)} onChange={() => toggleSelected(item.unique_id)} />}</td>}
                      <td className="xui-font-w-500">{item.User ? `${item.User.firstname} ${item.User.lastname}` : '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.User?.email || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.SupportGroup?.name || '-'}</td>
                      <td><span className={`xui-badge ${item.admin ? 'xui-badge-info' : 'xui-badge-neutral'} xui-font-sz-70`}>{item.admin ? 'Yes' : 'No'}</span></td>
                      <td>{getStatusBadge(item.member_status)}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{new Date(item.createdAt).toLocaleDateString()}</td>
                      {canEdit && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                              <button onClick={() => router.push(`/dashboard/supporter/support-group-members/view/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--neutral-100)', border: 'none', color: 'var(--neutral-700)' }}><View size={16} /> View</button>
                              {item.member_status === 'Pending' && <button onClick={() => { setSelectedItem(item); setConfirmAction('approve'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Approve</button>}
                              {item.member_status === 'Active' && <button onClick={() => { setSelectedItem(item); setConfirmAction('suspend'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--warning-light)', border: 'none', color: 'var(--warning)' }}><PauseOutline size={16} /> Suspend</button>}
                              {(item.member_status === 'Suspended' || item.member_status === 'Inactive') && <button onClick={() => { setSelectedItem(item); setConfirmAction('activate'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Activate</button>}
                              <button onClick={() => { setSelectedItem(item); setConfirmAction('toggleAdmin'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><UserAdmin size={16} /> {item.admin ? 'Remove Admin' : 'Make Admin'}</button>
                              {item.member_status !== 'Revoked' && <button onClick={() => { setSelectedItem(item); setConfirmAction('revoke'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><StopOutline size={16} /> Revoke</button>}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        </div>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="action-modal" title={`${actionLabels[confirmAction]}${confirmAction === 'autoApprove' || confirmAction === 'approveSelected' ? '' : ' Member'}`} message={actionMessages[confirmAction]} itemName={selectedItem?.User ? `${selectedItem.User.firstname} ${selectedItem.User.lastname}` : ''} confirmText={actionLabels[confirmAction]} confirmingText={`${actionLabels[confirmAction]}ing...`} confirmButtonStyle={actionStyles[confirmAction]} onConfirm={handleConfirmAction} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Members" fileName="support-group-members" columns={[{ key: 'User.firstname', header: 'First Name' }, { key: 'User.lastname', header: 'Last Name' }, { key: 'User.email', header: 'Email' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllSupportGroupMembers;
