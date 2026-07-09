'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download, OverflowMenuVertical } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import memberRoleAclsService from '../../services/memberRoleAcls.service';
import type { MemberRoleAcl } from '../../services/memberRoleAcls.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const ACCESS_LABELS = ['view', 'add', 'edit', 'delete', 'elevated_role'] as const;

const AllMemberRoleAcls = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [acls, setAcls] = useState<MemberRoleAcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<MemberRoleAcl | null>(null);

  const accessIds = getAccessIds('campaign', 'member-role-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) { setAcls(response.data); setTotalPages(1); }
      else { setAcls(response.data.rows || []); setTotalPages(response.data.pages || 1); }
    } else { setAcls([]); }
  };

  const fetchAcls = useCallback(async () => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    setLoading(true); setFetchError('');
    try {
      handleResponse(await memberRoleAclsService.getAll({ page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch ACLs'));
    } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterAcls = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true); setFetchError('');
    try {
      handleResponse(await memberRoleAclsService.filter({ ...range, page: currentPage, size: pageSize, module_unique_id: moduleId, sub_module_unique_id: subModuleId }));
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter ACLs'));
    } finally { setLoading(false); }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues); setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterAcls({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchAcls();
  };

  const handleClearFilters = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchAcls(); };
  const handleRefresh = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchAcls(); };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters) fetchAcls();
  }, [moduleId, subModuleId, currentPage, fetchAcls]);

  const aclBadge = (granted: boolean, label: string) => granted ? (
    <span key={label} className="xui-badge xui-badge-blue xui-font-sz-75" style={{ marginRight: '4px', textTransform: 'capitalize' }}>{label.replace('_', ' ')}</span>
  ) : null;

  return (
    <div>
      <Navbar title="Member Role ACLs" subtitle="Manage access control for member roles" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <FilterModal id="member-role-acls" fields={filterFields} values={filterValues} onApply={handleApplyFilters} onClear={handleClearFilters} />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-acls-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || acls.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span> Export
            </button>
            <button
              onClick={handleRefresh}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading}
            >
              <span className="icon-container"><Renew size={16} /></span> Refresh
            </button>
            {canAdd && (
              <>
                <button
                  onClick={() => router.push('/dashboard/campaign/member-role-acls/add-multiple')}
                  className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ border: '1px solid var(--primary-600)', color: 'var(--primary-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span> Add Multiple
                </button>
                <button
                  onClick={() => router.push('/dashboard/campaign/member-role-acls/add')}
                  className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span> Add ACL
                </button>
              </>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? <TableSkeleton />
              : fetchError ? <ErrorState title="Failed to load ACLs" message={fetchError} onRetry={handleRefresh} />
              : acls.length === 0 ? <EmptyState title="No ACLs found" message={hasActiveFilters ? 'No ACLs match your filter criteria.' : 'No ACLs have been set up yet.'} />
              : (
                <table className="xui-table" xui-style="2">
                  <thead>
                    <tr>
                      <th>Member Role</th>
                      <th>Module</th>
                      <th>Sub-Module</th>
                      <th>Permissions</th>
                      <th>Created</th>
                      {(canEdit || canDelete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {acls.map((acl) => (
                      <tr key={acl.unique_id}>
                        <td className="xui-font-w-500">{acl.MemberRole?.name || '-'}</td>
                        <td className="xui-font-sz-85">{acl.Module?.name || '-'}</td>
                        <td className="xui-font-sz-85 xui-opacity-7">{acl.SubModule?.name || <span className="xui-opacity-4">All</span>}</td>
                        <td>
                          {aclBadge(acl.view, 'view')}
                          {aclBadge(acl.add, 'add')}
                          {aclBadge(acl.edit, 'edit')}
                          {aclBadge(acl.delete, 'delete')}
                          {aclBadge(acl.elevated_role, 'elevated role')}
                        </td>
                        <td className="xui-opacity-7 xui-font-sz-80">{formatDate(acl.createdAt)}</td>
                        {(canEdit || canDelete) && (
                          <td>
                            <div className="xui-tooltip" xui-set="left">
                              <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                              <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex' }}>
                                {canEdit && (
                                  <button onClick={() => router.push(`/dashboard/campaign/member-role-acls/edit/${acl.unique_id}`)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><Edit size={16} /> Edit</button>
                                )}
                                {canDelete && (
                                  <button onClick={() => { setSelected(acl); modalShow('delete-acl-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Delete</button>
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="delete-acl-modal"
        title="Delete ACL"
        message="Are you sure you want to delete this ACL entry? This will remove the access permissions."
        itemName={selected ? `${selected.MemberRole?.name} - ${selected.Module?.name}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={async () => {
          if (!moduleId || !subModuleId || !selected) return { success: false, message: 'Unable to delete' };
          return memberRoleAclsService.remove(selected.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        }}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-acls-modal"
        title="Export ACLs"
        fileName="member-role-acls"
        columns={[
          { key: 'MemberRole.name', header: 'Member Role' },
          { key: 'Module.name', header: 'Module' },
          { key: 'SubModule.name', header: 'Sub-Module' },
          { key: 'view', header: 'View' },
          { key: 'add', header: 'Add' },
          { key: 'edit', header: 'Edit' },
          { key: 'delete', header: 'Delete' },
          { key: 'elevated_role', header: 'Elevated Role' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={acls}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllMemberRoleAcls;
