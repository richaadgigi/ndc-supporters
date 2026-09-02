'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Edit, TrashCan, Add, Download, OverflowMenuVertical, View } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import partnersService from '../../services/partners.service';
import type { Partner } from '../../services/partners.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllPartners = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<Partner | null>(null);

  const accessIds = useMemo(() => getAccessIds('supporter', 'partners'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

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
      handleResponse(await partnersService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch partners')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId || !query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try {
      handleResponse(await partnersService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete' };
    return partnersService.remove(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleRefresh = () => { setSearchQuery(''); setCurrentPage(1); fetchItems(); };
  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); };
  const handleSearch = (value: string) => { if (value.trim()) searchItems(value); else fetchItems(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery) fetchItems();
  }, [moduleId, subModuleId, currentPage, fetchItems, searchQuery]);

  return (
    <div>
      <Navbar title="Partners" subtitle="Manage partnership applications" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <SearchInput placeholder="Search partners..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}><span className="icon-container"><Download size={16} /></span> Export</button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}><span className="icon-container"><Renew size={16} /></span> Refresh</button>
            {canAdd && <button onClick={() => router.push('/dashboard/supporter/partners/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}><span className="icon-container"><Add size={16} /></span> Add Partner</button>}
          </div>
        </div>
        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? <TableSkeleton /> : fetchError ? <ErrorState title="Failed to load partners" message={fetchError} onRetry={handleRefresh} /> : items.length === 0 ? <EmptyState title="No partners found" message="No partnership applications have been submitted yet." /> : (
              <table className="xui-table" xui-style="2">
                <thead><tr><th>Organisation</th><th>Type</th><th>Contact</th><th>Email</th><th>Location</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      <td className="xui-font-w-500">{item.organisation_name || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.partner_type}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.contact_name}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.email}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{[item.state, item.country].filter(Boolean).join(', ') || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="xui-tooltip" xui-set="left">
                          <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                          <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                            <button onClick={() => router.push(`/dashboard/supporter/partners/view/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--primary-100)', border: 'none', color: 'var(--primary-700)' }}><View size={16} /> View</button>
                            {canEdit && <button onClick={() => router.push(`/dashboard/supporter/partners/edit/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>}
                            {canDelete && <button onClick={() => { setSelectedItem(item); modalShow('delete-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>}
                          </div>
                        </div>
                      </td>
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
      <ConfirmModal id="delete-modal" title="Delete Partner" message="Are you sure you want to delete this partner? This action cannot be undone." itemName={selectedItem?.organisation_name || selectedItem?.contact_name || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Partners" fileName="partners" columns={[{ key: 'organisation_name', header: 'Organisation' }, { key: 'partner_type', header: 'Type' }, { key: 'contact_name', header: 'Contact' }, { key: 'role', header: 'Role' }, { key: 'email', header: 'Email' }, { key: 'phone_number', header: 'Phone' }, { key: 'country', header: 'Country' }, { key: 'state', header: 'State' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllPartners;
