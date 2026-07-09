'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download, OverflowMenuVertical } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import roleAclsService from '../../services/roleAcls.service';
import type { RoleAcl, RoleOption } from '../../services/roleAcls.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const RoleAcls = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '', role: '' });
  const [roleAcls, setRoleAcls] = useState<RoleAcl[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRoleAcl, setSelectedRoleAcl] = useState<RoleAcl | null>(null);

  const accessIds = getAccessIds('roles', 'role-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setRoleAcls(response.data);
        setTotalPages(1);
      } else {
        setRoleAcls(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setRoleAcls([]);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleAclsService.getRoles();
        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setRoles(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const fetchRoleAcls = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.getRoleAcls({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const fetchByRole = useCallback(async (roleUniqueId: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.getRoleAclsSpecifically({
        role_unique_id: roleUniqueId,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterRoleAcls = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.filterRoleAcls({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (roleAcl: RoleAcl) => {
    setSelectedRoleAcl(roleAcl);
    modalShow('delete-role-acl-modal');
  };

  const handleDeleteRoleAcl = async () => {
    if (!moduleId || !subModuleId || !selectedRoleAcl) {
      return { success: false, message: 'Unable to delete role ACL' };
    }
    return roleAclsService.deleteRoleAcl(selectedRoleAcl.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: roles.map((r) => ({ value: r.unique_id, label: r.name })),
    },
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues);
    setCurrentPage(1);
    if (newValues.role) {
      fetchByRole(newValues.role);
    } else if (newValues.start_date && newValues.end_date) {
      filterRoleAcls({ start_date: newValues.start_date, end_date: newValues.end_date });
    } else {
      fetchRoleAcls();
    }
  };

  const handleClearFilters = () => {
    setFilterValues({ start_date: '', end_date: '', role: '' });
    setCurrentPage(1);
    fetchRoleAcls();
  };

  const handleRefresh = () => {
    setFilterValues({ start_date: '', end_date: '', role: '' });
    setCurrentPage(1);
    fetchRoleAcls();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters) {
      fetchRoleAcls();
    }
  }, [moduleId, subModuleId, currentPage, fetchRoleAcls]);

  const getPermissionBadges = (acl: RoleAcl) => {
    const permissions = [];
    if (acl.view) permissions.push(<span key="view" className="xui-badge xui-badge-info xui-font-sz-70">View</span>);
    if (acl.add) permissions.push(<span key="add" className="xui-badge xui-badge-success xui-font-sz-70">Add</span>);
    if (acl.edit) permissions.push(<span key="edit" className="xui-badge xui-badge-warning xui-font-sz-70">Edit</span>);
    if (acl.delete) permissions.push(<span key="delete" className="xui-badge xui-badge-danger xui-font-sz-70">Delete</span>);
    if (acl.elevated_role) permissions.push(<span key="elevated" className="xui-badge xui-badge-default xui-font-sz-70">Elevated</span>);
    return <div className="xui-d-flex xui-flex-wrap xui-grid-gap-half">{permissions}</div>;
  };

  return (
    <div>
      <Navbar title="Role ACLs" subtitle="Manage role access control lists" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <FilterModal
              id="role-acls"
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-role-acls-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || roleAcls.length === 0}
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
              <>
                <button
                  onClick={() => router.push('/dashboard/roles/acls/add-multiple')}
                  className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add Multiple
                </button>
                <button
                  onClick={() => router.push('/dashboard/roles/acls/add')}
                  className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add Role ACL
                </button>
              </>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState
                title="Failed to load role ACLs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : roleAcls.length === 0 ? (
              <EmptyState
                title="No role ACLs found"
                message={hasActiveFilters ? "No role ACLs match your filter criteria." : "There are no role ACLs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Module</th>
                    <th>Sub Module</th>
                    <th>Permissions</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roleAcls.map((acl) => (
                    <tr key={acl.unique_id}>
                      <td>
                        <span className="xui-font-w-500">{acl.Role?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85">{acl.Module?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-6">{acl.SubModule?.name || '—'}</span>
                      </td>
                      <td>
                        {getPermissionBadges(acl)}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(acl.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex' }}>
                              {canEdit && (
                                <button onClick={() => router.push(`/dashboard/roles/acls/edit/${acl.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
                              )}
                              {canDelete && (
                                <button onClick={() => openDeleteModal(acl)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>
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
        id="delete-role-acl-modal"
        title="Delete Role ACL"
        message="Are you sure you want to delete this role ACL? This action cannot be undone."
        itemName={selectedRoleAcl ? `${selectedRoleAcl.Role?.name || ''} — ${selectedRoleAcl.Module?.name || ''}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteRoleAcl}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-role-acls-modal"
        title="Export Role ACLs"
        fileName="role-acls"
        columns={[
          { key: 'Role.name', header: 'Role' },
          { key: 'Module.name', header: 'Module' },
          { key: 'SubModule.name', header: 'Sub Module' },
          { key: 'view', header: 'View' },
          { key: 'add', header: 'Add' },
          { key: 'edit', header: 'Edit' },
          { key: 'delete', header: 'Delete' },
          { key: 'elevated_role', header: 'Elevated Role' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={roleAcls}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default RoleAcls;
