'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download, OverflowMenuVertical } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import positionsService from '../../services/positions.service';
import type { Position } from '../../services/positions.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal, SearchInput } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllRoles = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedPosition, setselectedPosition] = useState<Position | null>(null);

  const accessIds = getAccessIds('campaign', 'positions');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setRoles(response.data);
        setTotalPages(1);
      } else {
        setRoles(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setRoles([]);
    }
  };

  const fetchRoles = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await positionsService.getAll({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchRolesHandler = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await positionsService.search({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterRoles = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await positionsService.filter({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (role: Position) => {
    setselectedPosition(role);
    modalShow('delete-role-modal');
  };

  const handleDeleteRole = async () => {
    if (!moduleId || !subModuleId || !selectedPosition) {
      return { success: false, message: 'Unable to delete role' };
    }
    return positionsService.remove(selectedPosition.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

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
    if (newValues.start_date && newValues.end_date) filterRoles({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchRoles();
  };

  const handleClearFilters = () => {
    setFilterValues({ start_date: '', end_date: '' });
    setCurrentPage(1);
    fetchRoles();
  };

  const handleRefresh = () => {
    setFilterValues({ start_date: '', end_date: '' });
    setSearchQuery('');
    setCurrentPage(1);
    fetchRoles();
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) { fetchRoles(); return; }
    setFilterValues({ start_date: '', end_date: '' });
    setCurrentPage(1);
    searchRolesHandler(query.trim());
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters && !searchQuery.trim()) {
      fetchRoles();
    }
  }, [moduleId, subModuleId, currentPage, fetchRoles]);

  return (
    <div>
      <Navbar title="All Roles" subtitle="Manage user roles" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search positions..."
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              width="300px"
            />
            <FilterModal
              id="roles"
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-roles-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || roles.length === 0}
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
                onClick={() => router.push('/dashboard/campaign/positions/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Role
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState
                title="Failed to load roles"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : roles.length === 0 ? (
              <EmptyState
                title="No roles found"
                message={searchQuery ? "No roles match your search." : hasActiveFilters ? "No roles match your filter criteria." : "There are no roles to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stripped</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.unique_id}>
                      <td>
                        <span className="xui-font-w-500">{role.name}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-6">{role.stripped}</span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(role.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex' }}>
                              {canEdit && (
                                <button
                                  onClick={() => router.push(`/dashboard/campaign/positions/edit/${role.unique_id}`)}
                                  className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                                  style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                >
                                  <Edit size={16} /> Edit
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => openDeleteModal(role)}
                                  className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80"
                                  style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                                >
                                  <TrashCan size={16} /> Delete
                                </button>
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
        id="delete-role-modal"
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        itemName={selectedPosition?.name || ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteRole}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-roles-modal"
        title="Export Roles"
        fileName="roles"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'stripped', header: 'Stripped' },
          { key: 'description', header: 'Description' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={roles}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllRoles;
