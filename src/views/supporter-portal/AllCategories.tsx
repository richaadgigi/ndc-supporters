'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Edit, TrashCan, Add, Download, OverflowMenuVertical, Checkmark } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import categoriesService from '../../services/categories.service';
import type { Category } from '../../services/categories.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllCategories = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<Category | null>(null);

  const accessIds = getAccessIds('supporter-portal', 'categories');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setItems(response.data);
        setTotalPages(1);
      } else {
        setItems(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setItems([]);
    }
  };

  const fetchItems = useCallback(async () => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    setLoading(true); setFetchError('');
    try {
      const response = await categoriesService.portalGetAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch categories')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try {
      const response = await categoriesService.portalSearch({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search categories')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      const response = await categoriesService.portalFilter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter categories')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete category' };
    return categoriesService.portalRemove(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleApproveItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to approve category' };
    return categoriesService.portalApprove({ unique_id: selectedItem.unique_id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setCurrentPage(1); };
  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); if (value) setFilterValues({ start_date: '', end_date: '' }); };
  const handleSearch = (value: string) => { if (value.trim()) searchItems(value); else fetchItems(); };
  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues); setSearchQuery(''); setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterItems({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchItems();
  };
  const handleClearFilters = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchItems(); };
  const handleRefresh = () => { setSearchQuery(''); setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchItems(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !hasActiveFilters) fetchItems();
  }, [moduleId, subModuleId, currentPage, fetchItems, searchQuery]);

  return (
    <div>
      <Navbar title="Categories" subtitle="Manage media categories" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search categories..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="categories" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <button onClick={() => router.push('/dashboard/supporter-portal/categories/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                <span className="icon-container"><Add size={16} /></span> Add Category
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState title="Failed to load categories" message={fetchError} onRetry={handleRefresh} />
            ) : items.length === 0 ? (
              <EmptyState title="No categories found" message={searchQuery ? "No categories match your search query." : hasActiveFilters ? "No categories match your filter criteria." : "There are no categories to display."} />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Date</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      <td>
                        <p className="xui-font-w-500">{item.name}</p>
                        <p className="xui-font-sz-75 xui-opacity-5">{item.stripped}</p>
                      </td>
                      <td>
                        {item.Creator ? (
                          <div>
                            <p className="xui-font-sz-85">{item.Creator.firstname} {item.Creator.lastname}</p>
                            {item.Creator.Role && <p className="xui-font-sz-75 xui-opacity-5">{item.Creator.Role.name}</p>}
                          </div>
                        ) : <span className="xui-opacity-4 xui-font-sz-80">--</span>}
                      </td>
                      <td>
                        <span className={`xui-badge ${item.status === 1 ? 'xui-badge-success' : item.status === 2 ? 'xui-badge-warning' : 'xui-badge-danger'} xui-font-sz-70`}>
                          {item.status === 1 ? 'Active' : item.status === 2 ? 'Pending' : 'Inactive'}
                        </span>
                      </td>
                      <td className="xui-font-sz-80 xui-opacity-6" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                              {canEdit && item.approved_by === null && (
                                <button onClick={() => { setSelectedItem(item); modalShow('approve-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Approve</button>
                              )}
                              {canEdit && item.approved_by === null && (
                                <button onClick={() => router.push(`/dashboard/supporter-portal/categories/edit/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
                              )}
                              {canDelete && (
                                <button onClick={() => { setSelectedItem(item); modalShow('delete-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>
                              )}
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal id="approve-modal" title="Approve Category" message="Are you sure you want to approve the category" itemName={selectedItem?.name || ''} confirmText="Approve" confirmingText="Approving..." confirmButtonStyle="success" onConfirm={handleApproveItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ConfirmModal id="delete-modal" title="Delete Category" message="Are you sure you want to delete this category? This action cannot be undone." itemName={selectedItem?.name || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />

      <ExportModal id="export-modal" title="Export Categories" fileName="categories" columns={[{ key: 'name', header: 'Name' }, { key: 'stripped', header: 'Stripped' }, { key: 'status', header: 'Status' }, { key: 'createdAt', header: 'Date' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllCategories;
