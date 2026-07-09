'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, View, Download, OverflowMenuVertical } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal, SearchInput } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllCandidates = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const accessIds = getAccessIds('campaign', 'candidates');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setCandidates(response.data);
        setTotalPages(1);
      } else {
        setCandidates(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setCandidates([]);
    }
  };

  const fetchCandidates = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      const response = await candidatesService.getAll({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch candidates'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchCandidates = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await candidatesService.search({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search candidates'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterCandidates = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await candidatesService.filter({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter candidates'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
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
    if (newValues.start_date && newValues.end_date) filterCandidates({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchCandidates();
  };

  const handleClearFilters = () => {
    setFilterValues({ start_date: '', end_date: '' });
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleRefresh = () => {
    setFilterValues({ start_date: '', end_date: '' });
    setSearchQuery('');
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) { fetchCandidates(); return; }
    setFilterValues({ start_date: '', end_date: '' });
    setCurrentPage(1);
    searchCandidates(query.trim());
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters && !searchQuery.trim()) fetchCandidates();
  }, [moduleId, subModuleId, currentPage, fetchCandidates]);

  return (
    <div>
      <Navbar title="Candidates" subtitle="Manage campaign candidates" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              width="300px"
            />
            <FilterModal
              id="candidates"
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-candidates-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || candidates.length === 0}
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
            {canAdd && (
              <button
                onClick={() => router.push('/dashboard/campaign/candidates/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Candidate
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState title="Failed to load candidates" message={fetchError} onRetry={handleRefresh} />
            ) : candidates.length === 0 ? (
              <EmptyState
                title="No candidates found"
                message={searchQuery ? 'No candidates match your search.' : hasActiveFilters ? 'No candidates match your filter criteria.' : 'There are no candidates to display.'}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Gender</th>
                    <th>State</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.unique_id}>
                      <td>
                        {candidate.image ? (
                          <img
                            src={candidate.image}
                            alt={candidate.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--neutral-200)' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--neutral-500)' }}>
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="xui-font-w-500">{candidate.name}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85">{candidate.Position?.name || <span className="xui-opacity-4">None</span>}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-7">{candidate.gender || '-'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-7">{candidate.state || '-'}</span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td>
                        <div className="xui-tooltip" xui-set="left">
                          <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                          <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth:'350PX' }}>
                            <button onClick={() => router.push(`/dashboard/campaign/candidates/view/${candidate.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--neutral-100)', border: 'none', color: 'var(--neutral-700)' }}><View size={16} /> View</button>
                            {canEdit && (
                              <button onClick={() => router.push(`/dashboard/campaign/candidates/edit/${candidate.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
                            )}
                            {canDelete && (
                              <button onClick={() => { setSelected(candidate); modalShow('delete-candidate-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>
                            )}
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

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="delete-candidate-modal"
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        itemName={selected?.name || ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={async () => {
          if (!moduleId || !subModuleId || !selected) return { success: false, message: 'Unable to delete candidate' };
          return candidatesService.remove(selected.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        }}
        onSuccess={() => setCandidates(prev => prev.filter(c => c.unique_id !== selected?.unique_id))}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-candidates-modal"
        title="Export Candidates"
        fileName="candidates"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'gender', header: 'Gender' },
          { key: 'state', header: 'State' },
          { key: 'lga', header: 'LGA' },
          { key: 'constituency', header: 'Constituency' },
          { key: 'contact_phone_number', header: 'Phone' },
          { key: 'contact_email', header: 'Email' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={candidates}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllCandidates;
