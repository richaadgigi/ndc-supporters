'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, TrashCan, Add, Download, Time, UserAvatar } from '@carbon/icons-react';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import galleryService from '../../services/gallery.service';
import type { Gallery } from '../../services/gallery.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { CardGridSkeleton } from '../../components/skeletons';

const AllGallery = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '', tags: '' });
  const [items, setItems] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedItem, setSelectedItem] = useState<Gallery | null>(null);
  const tagRef = useRef('');

  const accessIds = getAccessIds('candidate-portal', 'gallery');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
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
    try { handleResponse(await galleryService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId, ...(tagRef.current && { tags: tagRef.current }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch gallery')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try { handleResponse(await galleryService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId, ...(tagRef.current && { tags: tagRef.current }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search gallery')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try { handleResponse(await galleryService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId, ...(tagRef.current && { tags: tagRef.current }) })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter gallery')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete' };
    return galleryService.delete(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const allTags = Array.from(new Set(items.flatMap(item => item.tags || [])));
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
    { key: 'tags', label: 'Tag', type: 'select' as const, options: allTags.map(t => ({ value: t, label: t })) },
  ];

  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setCurrentPage(1); };
  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); if (value) setFilterValues({ start_date: '', end_date: '', tags: '' }); };
  const handleSearch = (value: string) => { if (value.trim()) searchItems(value); else fetchItems(); };
  const handleApplyFilters = (newValues: FilterValues) => {
    tagRef.current = newValues.tags || '';
    setFilterValues(newValues); setSearchQuery(''); setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterItems({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchItems();
  };
  const handleClearFilters = () => { tagRef.current = ''; setFilterValues({ start_date: '', end_date: '', tags: '' }); setCurrentPage(1); fetchItems(); };
  const handleRefresh = () => { tagRef.current = ''; setSearchQuery(''); setFilterValues({ start_date: '', end_date: '', tags: '' }); setCurrentPage(1); fetchItems(); };
  const handleDeleteSuccess = () => { if (selectedItem) setItems(prev => prev.filter(item => item.unique_id !== selectedItem.unique_id)); handleRefresh(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !hasActiveFilters) fetchItems();
  }, [moduleId, subModuleId, currentPage, fetchItems, searchQuery]);

  return (
    <div>
      <Navbar title="Gallery" subtitle="Manage gallery images" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search gallery..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="gallery" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <button onClick={() => router.push('/dashboard/candidate-portal/gallery/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                <span className="icon-container"><Add size={16} /></span> Add Image
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton />
        ) : fetchError ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <ErrorState title="Failed to load gallery" message={fetchError} onRetry={handleRefresh} />
          </div>
        ) : items.length === 0 ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <EmptyState title="No images found" message={searchQuery ? "No images match your search query." : hasActiveFilters ? "No images match your filter criteria." : "There are no gallery images to display."} />
          </div>
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
              {items.map((item) => (
                <div
                  key={item.unique_id}
                  className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-cursor-pointer"
                  style={{ border: '1px solid var(--neutral-200)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onClick={() => router.push(`/dashboard/candidate-portal/gallery/view/${item.unique_id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div className="xui-w-fluid-100 xui-overflow-hidden xui-pos-relative" style={{ height: '200px', backgroundColor: 'var(--neutral-100)' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title || 'Gallery image'} className="xui-w-fluid-100 xui-h-fluid-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="xui-w-fluid-100 xui-h-fluid-100 xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ color: 'var(--neutral-400)' }}>
                        <span className="xui-font-sz-85">No Image</span>
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {item.tags.map((tag, i) => (
                          <span key={i} className="xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', padding: '3px 8px', borderRadius: '4px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="xui-p-1">
                    {item.title && (
                      <h3 className="xui-font-sz-90 xui-font-w-600 xui-mb-half" style={{
                        lineHeight: '1.4', color: 'var(--neutral-900)',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {item.title}
                      </h3>
                    )}

                    <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1 xui-flex-wrap">
                      {item.Creator && (
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          {item.Creator.profile_image ? (
                            <img src={item.Creator.profile_image} alt="" className="xui-bdr-rad-circle" style={{ width: '22px', height: '22px', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: 'var(--neutral-400)' }}><UserAvatar size={18} /></span>
                          )}
                          <span className="xui-font-sz-70 xui-font-w-500" style={{ color: 'var(--neutral-600)' }}>
                            {item.Creator.firstname} {item.Creator.lastname}
                          </span>
                        </div>
                      )}
                      <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ color: 'var(--neutral-400)' }}>
                        <Time size={14} />
                        <span className="xui-font-sz-70">{formatDate(item.createdAt, 'MMM D, YYYY')}</span>
                      </div>
                    </div>

                    {canDelete && (
                      <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-pt-1" style={{ borderTop: '1px solid var(--neutral-100)' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); modalShow('delete-modal'); }}
                          className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-70 xui-font-w-500"
                          style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)', padding: '6px 12px', borderRadius: '4px' }}
                        >
                          <TrashCan size={14} /> Delete
                        </button>
                      </div>
                    )}
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

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="delete-modal" title="Delete Image" message="Are you sure you want to delete this gallery image?" itemName={selectedItem?.title || 'this image'} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleDeleteSuccess} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Gallery" fileName="gallery" columns={[{ key: 'title', header: 'Title' }, { key: 'image', header: 'Image URL' }, { key: 'createdAt', header: 'Date' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllGallery;
