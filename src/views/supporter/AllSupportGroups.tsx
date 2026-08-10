'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Add, Download, OverflowMenuVertical, View, Edit, Checkmark, PauseOutline, StopOutline } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllSupportGroups = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<SupportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<SupportGroup | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'activate' | 'suspend' | 'revoke' | 'autoApprove' | 'approveSelected'>('approve');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const accessIds = useMemo(() => getAccessIds('supporter', 'support-groups'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canAutoApprove = canEdit && accessResult.accessTypes.includes('elevated_role');

  const pendingIds = items.filter(i => i.support_group_status === 'Pending').map(i => i.unique_id);
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
      handleResponse(await supportGroupsService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch support groups')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId || !query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try {
      handleResponse(await supportGroupsService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      handleResponse(await supportGroupsService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleConfirmAction = async () => {
    if (!moduleId || !subModuleId) return { success: false, message: 'You do not have access to this module' };
    const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
    if (confirmAction === 'autoApprove') return supportGroupsService.autoApprove(params);
    if (confirmAction === 'approveSelected') return supportGroupsService.approveMultiple({ unique_ids: selectedIds }, params);
    if (!selectedItem) return { success: false, message: 'No item selected' };
    if (confirmAction === 'approve') return supportGroupsService.approve({ unique_id: selectedItem.unique_id }, params);
    if (confirmAction === 'activate') return supportGroupsService.activate({ unique_id: selectedItem.unique_id }, params);
    if (confirmAction === 'suspend') return supportGroupsService.suspend({ unique_id: selectedItem.unique_id }, params);
    return supportGroupsService.revoke({ unique_id: selectedItem.unique_id }, params);
  };

  const actionLabels = { approve: 'Approve', activate: 'Activate', suspend: 'Suspend', revoke: 'Revoke', autoApprove: 'Auto Approve', approveSelected: 'Approve Selected' };
  const actionStyles = { approve: 'success', activate: 'success', suspend: 'warning', revoke: 'danger', autoApprove: 'success', approveSelected: 'success' } as const;
  const actionMessages: Record<typeof confirmAction, string> = {
    approve: 'Are you sure you want to approve this support group?',
    activate: 'Are you sure you want to activate this support group?',
    suspend: 'Are you sure you want to suspend this support group?',
    revoke: 'Are you sure you want to revoke this support group?',
    autoApprove: 'Approve every pending support group?',
    approveSelected: `Approve the ${selectedIds.length} selected pending ${selectedIds.length === 1 ? 'group' : 'groups'}?`,
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
      <Navbar title="Support Groups" subtitle="Manage all support groups" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half" style={{ gap: '8px' }}>
          <div className="xui-d-flex xui-flex-ai-center" style={{ gap: '6px', flexShrink: 1, minWidth: 0 }}>
            <SearchInput placeholder="Search groups..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="200px" />
            <FilterModal id="support-groups" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center" style={{ gap: '6px', flexShrink: 0 }}>
            {canEdit && selectedIds.length > 0 && <button onClick={() => { setSelectedItem(null); setConfirmAction('approveSelected'); modalShow('action-modal'); }} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: 'none', whiteSpace: 'nowrap', padding: '6px 10px' }} disabled={loading}><span className="icon-container"><Checkmark size={14} /></span> Approve ({selectedIds.length})</button>}
            {canAutoApprove && <button onClick={() => { setSelectedItem(null); setConfirmAction('autoApprove'); modalShow('action-modal'); }} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none', whiteSpace: 'nowrap', padding: '6px 10px' }} disabled={loading || pendingIds.length === 0}><span className="icon-container"><Checkmark size={14} /></span> Auto-Approve</button>}
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 10px' }} disabled={loading || items.length === 0} title="Export current page"><span className="icon-container"><Download size={14} /></span></button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', padding: '6px 10px' }} disabled={loading} title="Refresh"><span className="icon-container"><Renew size={14} /></span></button>
            {canAdd && <button onClick={() => router.push('/dashboard/supporter/support-groups/add')} className="xui-btn xui-font-sz-75 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', whiteSpace: 'nowrap', padding: '6px 10px' }}><span className="icon-container"><Add size={14} /></span> Add</button>}
          </div>
        </div>
        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? <TableSkeleton /> : fetchError ? <ErrorState title="Failed to load support groups" message={fetchError} onRetry={handleRefresh} /> : items.length === 0 ? <EmptyState title="No support groups found" message={searchQuery ? "No groups match your search." : hasActiveFilters ? "No groups match your filters." : "No support groups yet."} /> : (
              <table className="xui-table" xui-style="2">
                <thead><tr>{canEdit && <th style={{ width: '36px' }}><input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAllPending} disabled={pendingIds.length === 0} title="Select all pending" /></th>}<th>Name</th><th>Type</th><th>Email</th><th>State</th><th>Status</th><th>Created</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      {canEdit && <td>{item.support_group_status === 'Pending' && <input type="checkbox" checked={selectedIds.includes(item.unique_id)} onChange={() => toggleSelected(item.unique_id)} />}</td>}
                      <td className="xui-font-w-500">{item.name}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.SupportGroupType?.title || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.contact_email || "-"}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.state || '-'}</td>
                      <td>{getStatusBadge(item.support_group_status)}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{new Date(item.createdAt).toLocaleDateString()}</td>
                      {canEdit && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                              <button onClick={() => router.push(`/dashboard/supporter/support-groups/view/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--neutral-100)', border: 'none', color: 'var(--neutral-700)' }}><View size={16} /> View</button>
                              <button onClick={() => router.push(`/dashboard/supporter/support-groups/edit/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
                              {item.support_group_status === 'Pending' && <button onClick={() => { setSelectedItem(item); setConfirmAction('approve'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Approve</button>}
                              {item.support_group_status === 'Active' && <button onClick={() => { setSelectedItem(item); setConfirmAction('suspend'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--warning-light)', border: 'none', color: 'var(--warning)' }}><PauseOutline size={16} /> Suspend</button>}
                              {(item.support_group_status === 'Suspended' || item.support_group_status === 'Inactive') && <button onClick={() => { setSelectedItem(item); setConfirmAction('activate'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Activate</button>}
                              {item.support_group_status !== 'Revoked' && <button onClick={() => { setSelectedItem(item); setConfirmAction('revoke'); modalShow('action-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><StopOutline size={16} /> Revoke</button>}
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
      <ConfirmModal id="action-modal" title={`${actionLabels[confirmAction]}${confirmAction === 'autoApprove' || confirmAction === 'approveSelected' ? '' : ' Support Group'}`} message={actionMessages[confirmAction]} itemName={selectedItem?.name || ''} confirmText={actionLabels[confirmAction]} confirmingText={`${actionLabels[confirmAction]}ing...`} confirmButtonStyle={actionStyles[confirmAction]} onConfirm={handleConfirmAction} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Support Groups" fileName="support-groups" columns={[{ key: 'name', header: 'Name' }, { key: 'email', header: 'Email' }, { key: 'state', header: 'State' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllSupportGroups;
