'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Download, Calendar, Location } from '@carbon/icons-react';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import eventsService from '../../services/events.service';
import type { Event } from '../../services/events.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { CardGridSkeleton } from '../../components/skeletons';

const AllEvents = () => {
  const router = useRouter();
  const { supportGroupId } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) { setItems(response.data); setTotalPages(1); }
      else { setItems(response.data.rows || []); setTotalPages(response.data.pages || 1); }
    } else { setItems([]); }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true); setFetchError('');
    try { handleResponse(await eventsService.publicGetAll({ page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch events')); } finally { setLoading(false); }
  }, [currentPage, pageSize, supportGroupId]);

  const searchItems = useCallback(async (query: string) => {
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try { handleResponse(await eventsService.publicGetAll({ search: query, page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search events')); } finally { setLoading(false); }
  }, [currentPage, pageSize, supportGroupId, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    setLoading(true); setFetchError('');
    try { handleResponse(await eventsService.publicGetAll({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, ...(supportGroupId && { support_group_unique_id: supportGroupId }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter events')); } finally { setLoading(false); }
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
      <Navbar title="Events" subtitle="Browse support group events" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search events..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="events" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
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

        {loading ? (
          <CardGridSkeleton />
        ) : fetchError ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <ErrorState title="Failed to load events" message={fetchError} onRetry={handleRefresh} />
          </div>
        ) : items.length === 0 ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <EmptyState title="No events found" message={searchQuery ? "No events match your search." : hasActiveFilters ? "No events match your filters." : "There are no events to display."} />
          </div>
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
              {items.map((item) => (
                <div
                  key={item.unique_id}
                  className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-cursor-pointer"
                  style={{ border: '1px solid var(--neutral-200)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onClick={() => router.push(`/dashboard/events/view/${item.unique_id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div className="xui-w-fluid-100 xui-overflow-hidden xui-pos-relative" style={{ height: '180px', backgroundColor: 'var(--neutral-100)' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.alt_text || item.title} className="xui-w-fluid-100 xui-h-fluid-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="xui-w-fluid-100 xui-h-fluid-100 xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ color: 'var(--neutral-400)' }}>
                        <Calendar size={32} />
                      </div>
                    )}
                    <span className="xui-font-sz-70 xui-font-w-600" style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', padding: '4px 10px', borderRadius: '4px', textTransform: 'capitalize' }}>
                      {item.type}
                    </span>
                  </div>

                  <div className="xui-p-1">
                    <h3 className="xui-font-sz-90 xui-font-w-600 xui-mb-half" style={{ lineHeight: '1.4', color: 'var(--neutral-900)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </h3>
                    <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                      {item.start_date && (
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ color: 'var(--neutral-500)' }}>
                          <Calendar size={14} />
                          <span className="xui-font-sz-75">{formatDate(item.start_date, 'MMM D, YYYY')}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ color: 'var(--neutral-500)' }}>
                          <Location size={14} />
                          <span className="xui-font-sz-75" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="xui-mt-1-half">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            </div>
          </>
        )}
      </div>

      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ExportModal id="export-modal" title="Export Events" fileName="events" columns={[{ key: 'title', header: 'Title' }, { key: 'start_date', header: 'Start Date' }, { key: 'location', header: 'Location' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllEvents;
