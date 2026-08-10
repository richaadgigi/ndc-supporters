'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, /* TrashCan, */ Download, View, OverflowMenuVertical } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import logsService from '../../services/logs.service';
import type { Log } from '../../services/logs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal, SearchInput } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { /* ConfirmModal, */ ExportModal } from '../../components/modals';
import { TableSkeleton } from '../../components/skeletons';
import { modalShow } from '@richaadgigi/stylexui';

const AllLogs = () => {
  const { getAccessIds /* , checkAccess */ } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewingLog, setViewingLog] = useState<Log | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  const accessIds = getAccessIds('logs', 'all-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setLogs(response.data);
        setTotalPages(1);
      } else {
        setLogs(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setLogs([]);
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.getLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
      if (response.success && response.data) {
        const rows = Array.isArray(response.data) ? response.data : (response.data.rows || []);
        const types = Array.from(new Set(rows.map((l: Log) => l.type).filter(Boolean))).sort() as string[];
        setAvailableTypes(prev => prev.length === 0 || types.length > prev.length ? types : prev);
      }
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.searchLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const fetchByType = useCallback(async (type: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.getLogsSpecifically({
        type,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterLogs = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.filterLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    ...(availableTypes.length > 0 ? [{
      key: 'type',
      label: 'Type',
      type: 'select' as const,
      options: availableTypes.map((t) => ({ value: t, label: t })),
    }] : []),
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues);
    setSearchQuery('');
    setCurrentPage(1);
    if (newValues.type) {
      fetchByType(newValues.type);
    } else if (newValues.start_date && newValues.end_date) {
      filterLogs({ start_date: newValues.start_date, end_date: newValues.end_date });
    } else {
      fetchLogs();
    }
  };

  const handleClearFilters = () => {
    setFilterValues({ start_date: '', end_date: '', type: '' });
    setCurrentPage(1);
    fetchLogs();
  };

  const handleRefresh = () => {
    setFilterValues({ start_date: '', end_date: '', type: '' });
    setSearchQuery('');
    setCurrentPage(1);
    fetchLogs();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value) {
      setFilterValues({ start_date: '', end_date: '', type: '' });
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setFilterValues({ start_date: '', end_date: '', type: '' });
      searchLogs(value);
    } else {
      fetchLogs();
    }
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters && !searchQuery) {
      fetchLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs, searchQuery]);

  const openViewModal = (log: Log) => {
    setViewingLog(log);
    modalShow('view-log-modal');
  };

  const getTypeBadgeClass = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('error') || lower.includes('delete')) return 'xui-badge-danger';
    if (lower.includes('create') || lower.includes('add') || lower.includes('success')) return 'xui-badge-success';
    if (lower.includes('update') || lower.includes('edit')) return 'xui-badge-info';
    if (lower.includes('login') || lower.includes('auth')) return 'xui-badge-primary';
    if (lower.includes('warning') || lower.includes('logout')) return 'xui-badge-warning';
    return 'xui-badge-default';
  };

  return (
    <div>
      <Navbar title="All Logs" subtitle="System activity logs" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <FilterModal
              id="logs"
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={handleRefresh}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Refresh
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState
                title="Failed to load logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No logs found"
                message={searchQuery ? "No logs match your search query." : hasActiveFilters ? "No logs match your filter criteria." : "There are no logs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Created By</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td>
                        <span className={`xui-badge ${getTypeBadgeClass(log.type)} xui-font-sz-70`}>
                          {log.type}
                        </span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-7" style={{ maxWidth: '400px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.description || '—'}
                        </span>
                      </td>
                      <td className="xui-font-sz-85">
                        {log.User ? (
                          <div>
                            <span className="xui-font-w-500">{log.User.firstname} {log.User.lastname}</span>
                            {log.User.Role && (
                              <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{log.User.Role.name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="xui-opacity-5">System</span>
                        )}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div className="xui-tooltip" xui-set="left">
                          <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                          <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                            <button
                              onClick={() => openViewModal(log)}
                              className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                            >
                              <View size={16} /> View
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ExportModal
        id="export-logs-modal"
        title="Export Logs"
        fileName="logs"
        columns={[
          { key: 'type', header: 'Type' },
          { key: 'description', header: 'Description' },
          { key: 'User.firstname', header: 'Created By' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={logs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <div className="xui-modal" xui-modal="view-log-modal">
        <div className="xui-modal-content xui-lg-w-fluid-40 xui-w-fluid-90" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <div className="xui-modal-close" xui-modal-close="view-log-modal">&times;</div>
          <h3 className="xui-font-sz-110 xui-font-w-600 xui-mb-1">Log Details</h3>
          {viewingLog && (
            <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Type</span>
                <span className={`xui-badge ${getTypeBadgeClass(viewingLog.type)} xui-font-sz-75`}>
                  {viewingLog.type}
                </span>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Description</span>
                <p className="xui-font-sz-85">{viewingLog.description || '—'}</p>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created By</span>
                <p className="xui-font-sz-85">
                  {viewingLog.User ? (
                    <>
                      {viewingLog.User.firstname} {viewingLog.User.lastname}
                      {viewingLog.User.Role && <span className="xui-opacity-6"> ({viewingLog.User.Role.name})</span>}
                    </>
                  ) : (
                    <span className="xui-opacity-5">System</span>
                  )}
                </p>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created</span>
                <p className="xui-font-sz-85">{formatDate(viewingLog.createdAt)}</p>
              </div>
              {viewingLog.content && (
                <div>
                  <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Content</span>
                  <pre
                    className="xui-bg-light xui-p-1 xui-bdr-rad-half xui-font-sz-80"
                    style={{ border: '1px solid var(--neutral-200)', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {JSON.stringify(viewingLog.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllLogs;
