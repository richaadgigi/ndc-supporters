'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Edit, TrashCan, Add, Download, OverflowMenuVertical, Checkmark } from '@carbon/icons-react';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import postsService from '../../services/posts.service';
import type { Post } from '../../services/posts.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllPosts = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<Post | null>(null);

  const accessIds = getAccessIds('candidate-portal', 'posts');
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
      const response = await postsService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch posts')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try {
      const response = await postsService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search posts')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      const response = await postsService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter posts')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleApproveItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to approve post' };
    return postsService.approve({ unique_id: selectedItem.unique_id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete post' };
    return postsService.remove(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
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
      <Navbar title="Posts" subtitle="Manage candidate posts" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search posts..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="posts" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <button onClick={() => router.push('/dashboard/candidate-portal/posts/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                <span className="icon-container"><Add size={16} /></span> Add Post
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState title="Failed to load posts" message={fetchError} onRetry={handleRefresh} />
            ) : items.length === 0 ? (
              <EmptyState title="No posts found" message={searchQuery ? "No posts match your search query." : hasActiveFilters ? "No posts match your filter criteria." : "There are no posts to display."} />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Candidate</th>
                    <th>Category</th>
                    <th>Views</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      <td>
                        {item.image ? (
                          <img src={item.image} alt={item.alt_text || item.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-font-sz-75 xui-font-w-600" style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: 'var(--neutral-200)', color: 'var(--neutral-600)' }}>
                            {item.title.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="xui-font-w-500">{item.title}</td>
                      <td className="xui-font-sz-85">{item.Candidate?.name || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.Category?.name || 'None'}</td>
                      <td className="xui-font-sz-85">{item.views}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{formatDate(item.createdAt)}</td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '400px' }}>
                              {canEdit && item.approved_by === null && (
                                <button onClick={() => { setSelectedItem(item); modalShow('approve-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}><Checkmark size={16} /> Approve</button>
                              )}
                              {canEdit && item.approved_by === null && (
                                <button onClick={() => router.push(`/dashboard/candidate-portal/posts/edit/${item.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
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

      <ConfirmModal id="approve-modal" title="Approve Post" message="Are you sure you want to approve the post" itemName={selectedItem?.title || ''} confirmText="Approve" confirmingText="Approving..." confirmButtonStyle="success" onConfirm={handleApproveItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ConfirmModal id="delete-modal" title="Delete Post" message="Are you sure you want to delete this post? This action cannot be undone." itemName={selectedItem?.title || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />

      <ExportModal id="export-modal" title="Export Posts" fileName="posts" columns={[{ key: 'title', header: 'Title' }, { key: 'views', header: 'Views' }, { key: 'createdAt', header: 'Created' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllPosts;
