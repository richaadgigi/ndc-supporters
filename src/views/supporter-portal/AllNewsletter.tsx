'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, TrashCan, OverflowMenuVertical, Email } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import newsletterService from '../../services/newsletter.service';
import type { Newsletter } from '../../services/newsletter.service';
import type { NewsletterStats } from '../../services/newsletter.service';
import { MetricCard } from '../../components/overview';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllNewsletter = () => {
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [items, setItems] = useState<Newsletter[]>([]);
  const [statsData, setStatsData] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedItem, setSelectedItem] = useState<Newsletter | null>(null);

  const accessIds = getAccessIds('supporter-portal', 'newsletter');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
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
      const response = await newsletterService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to fetch newsletter subscribers')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterItems = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      const response = await newsletterService.filter({ start_date: range.start_date, end_date: range.end_date, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      handleResponse(response);
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to filter newsletter subscribers')); } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleDeleteItem = async () => {
    if (!moduleId || !subModuleId || !selectedItem) return { success: false, message: 'Unable to delete subscriber' };
    return newsletterService.remove(selectedItem.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setCurrentPage(1); };
  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues); setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterItems({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchItems();
  };
  const handleClearFilters = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchItems(); };
  const handleRefresh = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchItems(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    newsletterService.getStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (res.success && res.data) setStatsData(res.data); })
      .catch(err => console.error('Failed to load stats:', err));

  }, [moduleId, subModuleId]);


  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters) fetchItems();
  }, [moduleId, subModuleId, currentPage, fetchItems]);

  return (
    <div>
      <Navbar title="Newsletter" subtitle="Manage newsletter subscribers" />
      <div className="xui-py-1-half">
        {statsData && (
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
            <MetricCard title="Total Subscribers" value={statsData.total_newsletters ?? 0} icon={<Email size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
          </div>
        )}
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <FilterModal id="newsletter" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
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
              <ErrorState title="Failed to load newsletter subscribers" message={fetchError} onRetry={handleRefresh} />
            ) : items.length === 0 ? (
              <EmptyState title="No subscribers found" message={hasActiveFilters ? "No subscribers match your filter criteria." : "There are no newsletter subscribers to display."} />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    {canDelete && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.unique_id}>
                      <td className="xui-font-w-500">{item.email}</td>
                      <td>
                        <span className={`xui-badge ${item.subscription ? 'xui-badge-success' : 'xui-badge-danger'} xui-font-sz-70`}>
                          {item.subscription ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="xui-font-sz-85 xui-opacity-6">{new Date(item.createdAt).toLocaleDateString()}</td>
                      {canDelete && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                              <button onClick={() => { setSelectedItem(item); modalShow('delete-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>
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

      <ConfirmModal id="delete-modal" title="Delete Subscriber" message="Are you sure you want to remove this subscriber? This action cannot be undone." itemName={selectedItem?.email || ''} confirmText="Delete" confirmingText="Deleting..." confirmButtonStyle="danger" onConfirm={handleDeleteItem} onSuccess={handleRefresh} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default AllNewsletter;
