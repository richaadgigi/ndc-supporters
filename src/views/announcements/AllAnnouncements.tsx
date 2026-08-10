'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Download } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import announcementsService from '../../services/announcements.service';
import type { Announcement } from '../../services/announcements.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllAnnouncements = () => {
  const router = useRouter();
  const { supportGroupId } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) { setItems(response.data); setTotalPages(1); }
      else { setItems(response.data.rows || []); setTotalPages(response.data.pages || 1); }
    } else { setItems([]); }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true); setFetchError('');
    try { handleResponse(await announcementsService.publicGetAll({ page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch announcements')); } finally { setLoading(false); }
  }, [currentPage, pageSize, supportGroupId]);

  const searchItems = useCallback(async (query: string) => {
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try { handleResponse(await announcementsService.publicGetAll({ search: query, page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search')); } finally { setLoading(false); }
  }, [currentPage, pageSize, supportGroupId, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    setLoading(true); setFetchError('');
    try { handleResponse(await announcementsService.publicGetAll({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter')); } finally { setLoading(false); }
  }, [currentPage, pageSize, supportGroupId]);

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
    if (!searchQuery && !hasActiveFilters) fetchItems();
  }, [currentPage, fetchItems, searchQuery]);

  return (
    <div>
      <Navbar title="Announcements" subtitle="View support group announcements" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search announcements..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="announcements" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState title="Failed to load announcements" message={fetchError} onRetry={handleRefresh} />
            ) : items.length === 0 ? (
              <EmptyState title="No announcements found" message={searchQuery ? "No announcements match your search." : hasActiveFilters ? "No announcements match your filters." : "There are no announcements to display."} />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Support Group</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id} className="xui-cursor-pointer" onClick={() => router.push(`/dashboard/announcements/view/${item.unique_id}`)}>
                      <td className="xui-font-w-500">{item.title}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.SupportGroup?.name || '-'}</td>
                      <td>
                        <span className={`xui-badge ${item.approved_by ? 'xui-badge-success' : 'xui-badge-warning'} xui-font-sz-70`}>
                          {item.approved_by ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.start_date || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{item.end_date || '-'}</td>
                      <td className="xui-font-sz-85 xui-opacity-6">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
        </div>
      </div>

      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ExportModal id="export-modal" title="Export Announcements" fileName="announcements" columns={[{ key: 'title', header: 'Title' }, { key: 'start_date', header: 'Start Date' }, { key: 'end_date', header: 'End Date' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllAnnouncements;
