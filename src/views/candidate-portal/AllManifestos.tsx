'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Renew, Edit, TrashCan, Add, Download, Document, Launch, Calendar, PageFirst } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import manifestosService from '../../services/manifestos.service';
import type { Manifesto } from '../../services/manifestos.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { CardGridSkeleton } from '../../components/skeletons';

const AllManifestos = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Manifesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedItem, setSelectedItem] = useState<Manifesto | null>(null);

  const accessIds = getAccessIds('candidate-portal', 'manifestos');
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
    try { handleResponse(await manifestosService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch manifestos')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchItems = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    if (!query.trim()) { fetchItems(); return; }
    setLoading(true); setFetchError('');
    try { handleResponse(await manifestosService.search({ search: query, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to search manifestos')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchItems]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try { handleResponse(await manifestosService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId })); }
    catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter manifestos')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete' };
    return manifestosService.delete(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
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
      <Navbar title="Manifestos" subtitle="Manage party manifestos" />
      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half xui-flex-wrap xui-grid-gap-1">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput placeholder="Search manifestos..." value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} width="300px" />
            <FilterModal id="manifestos" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button onClick={() => modalShow('export-modal')} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading || items.length === 0}>
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button onClick={handleRefresh} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }} disabled={loading}>
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <button onClick={() => router.push('/dashboard/candidate-portal/manifestos/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                <span className="icon-container"><Add size={16} /></span> Add Manifesto
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton />
        ) : fetchError ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <ErrorState title="Failed to load manifestos" message={fetchError} onRetry={handleRefresh} />
          </div>
        ) : items.length === 0 ? (
          <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
            <EmptyState title="No manifestos found" message={searchQuery ? "No manifestos match your search query." : hasActiveFilters ? "No manifestos match your filter criteria." : "There are no manifestos to display."} />
          </div>
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
              {items.map((item) => (
                  <div key={item.unique_id} className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                    <div className="xui-overflow-hidden xui-pos-relative" style={{ height: '250px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-100)' }}>
                      {item.file ? (
                        item.file_type?.toLowerCase() === 'pdf' ? (
                          <iframe
                            src={`${item.file}#toolbar=0&navpanes=0&scrollbar=0`}
                            title={item.title}
                            style={{ border: 'none', pointerEvents: 'none', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)' }}
                          />
                        ) : (
                          <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.file)}`}
                            title={item.title}
                            style={{ border: 'none', pointerEvents: 'none', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)' }}
                          />
                        )
                      ) : (
                        <div className="xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-flex-jc-center xui-h-fluid-100 xui-grid-gap-half">
                          <Document size={48} style={{ color: 'var(--neutral-400)' }} />
                          <span className="xui-font-sz-70 xui-font-w-600 xui-opacity-5" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {item.file_type || 'PDF'}
                          </span>
                        </div>
                      )}
                      <span className="xui-font-sz-70 xui-font-w-500" style={{
                        position: 'absolute', top: '10px', right: '10px',
                        backgroundColor: item.status === 1 ? 'var(--success)' : 'var(--error)',
                        color: '#fff', padding: '3px 10px', borderRadius: '4px', zIndex: 1,
                      }}>
                        {item.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="xui-p-1">
                      <h4 className="xui-font-w-600 xui-font-sz-90 xui-mb-half" style={{ color: 'var(--neutral-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </h4>
                      {item.short_description && (
                        <p className="xui-font-sz-80 xui-opacity-5 xui-mb-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.short_description}
                        </p>
                      )}

                      <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1 xui-flex-wrap">
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-70 xui-opacity-5">
                          <Calendar size={14} />
                          <span>{item.year_published}</span>
                        </div>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-70 xui-opacity-5">
                          <PageFirst size={14} />
                          <span>{item.pages} {item.pages === 1 ? 'page' : 'pages'}</span>
                        </div>
                        <span className="xui-font-sz-70 xui-font-w-500 xui-opacity-5 xui-bdr-rad-half" style={{ backgroundColor: 'var(--neutral-100)', padding: '2px 8px', textTransform: 'uppercase' }}>
                          {item.file_type}
                        </span>
                      </div>

                      <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                        {item.file && (
                          <button
                            type="button"
                            onClick={() => window.open(item.file, '_blank')}
                            className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                            style={{ backgroundColor: 'var(--neutral-100)', border: '1px solid var(--neutral-200)', color: 'var(--neutral-700)' }}
                          >
                            <Launch size={14} /> View
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/candidate-portal/manifestos/edit/${item.unique_id}`)}
                            className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => { setSelectedItem(item); modalShow('delete-modal'); }}
                            className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                          >
                            <TrashCan size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="xui-mt-1 xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            </div>
          </>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="delete-modal" title="Delete Manifesto" message="Are you sure you want to delete this manifesto?" itemName={selectedItem?.title || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
      <ExportModal id="export-modal" title="Export Manifestos" fileName="manifestos" columns={[{ key: 'title', header: 'Title' }, { key: 'year_published', header: 'Year' }, { key: 'pages', header: 'Pages' }, { key: 'file_type', header: 'File Type' }, { key: 'status', header: 'Status' }]} data={items} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllManifestos;
