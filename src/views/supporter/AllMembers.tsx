'use client';
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Download, OverflowMenuVertical, UserRole } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import membersService from '../../services/members.service';
import type { Member } from '../../services/members.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, FilterModal, SearchInput } from '../../components/common';
import type { FilterField, FilterValues } from '../../components/common';
import { ConfirmModal, ExportModal, ChangeMemberRoleModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { TableSkeleton } from '../../components/skeletons';

const AllMembers = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [filterValues, setFilterValues] = useState<FilterValues>({ start_date: '', end_date: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<Member | null>(null);

  const accessIds = getAccessIds('supporter', 'members');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canDelete = accessResult.accessTypes.includes('delete');
  const canChangeRole = accessResult.accessTypes.includes('edit') && accessResult.accessTypes.includes('elevated_role');

  const roleAccessIds = getAccessIds('supporter', 'member-roles');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setMembers(response.data);
        setTotalPages(1);
      } else {
        setMembers(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setMembers([]);
    }
  };

  const fetchMembers = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      const response = await membersService.getAll({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch members'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchMembers = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await membersService.search({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search members'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterMembers = useCallback(async (range: { start_date: string; end_date: string }) => {
    if (!moduleId || !subModuleId) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await membersService.filter({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter members'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== '');
  const filterFields: FilterField[] = [
    { key: 'start_date', label: 'Start Date', type: 'date' as const },
    { key: 'end_date', label: 'End Date', type: 'date' as const },
  ];

  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setCurrentPage(1); };

  const handleApplyFilters = (newValues: FilterValues) => {
    setFilterValues(newValues);
    setSearchQuery('');
    setCurrentPage(1);
    if (newValues.start_date && newValues.end_date) filterMembers({ start_date: newValues.start_date, end_date: newValues.end_date });
    else fetchMembers();
  };

  const handleClearFilters = () => { setFilterValues({ start_date: '', end_date: '' }); setCurrentPage(1); fetchMembers(); };

  const handleRefresh = () => { setFilterValues({ start_date: '', end_date: '' }); setSearchQuery(''); setCurrentPage(1); fetchMembers(); };

  const handleSearch = (query: string) => {
    if (!query.trim()) { fetchMembers(); return; }
    setFilterValues({ start_date: '', end_date: '' });
    setCurrentPage(1);
    searchMembers(query.trim());
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!hasActiveFilters && !searchQuery.trim()) fetchMembers();
  }, [moduleId, subModuleId, currentPage, fetchMembers]);

  const memberName = (m: Member) =>
    m.User ? `${m.User.firstname} ${m.User.lastname}`.trim() : m.code || m.unique_id.slice(0, 8);

  return (
    <div>
      <Navbar title="Members" subtitle="Manage campaign members" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search members..."
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              width="300px"
            />
            <FilterModal
              id="members"
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-members-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || members.length === 0}
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
                onClick={() => router.push('/dashboard/supporter/members/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Member
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <TableSkeleton />
            ) : fetchError ? (
              <ErrorState title="Failed to load members" message={fetchError} onRetry={handleRefresh} />
            ) : members.length === 0 ? (
              <EmptyState
                title="No members found"
                message={searchQuery ? 'No members match your search.' : hasActiveFilters ? 'No members match your filter criteria.' : 'There are no members to display.'}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Support Group</th>
                    <th>Role</th>
                    <th>Code</th>
                    <th>Joined</th>
                    {(canDelete || canChangeRole) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.unique_id}>
                      <td className="xui-font-w-500">{memberName(member)}</td>
                      <td className="xui-font-sz-85 xui-opacity-7">{member.User?.email || '-'}</td>
                      <td className="xui-font-sz-85">{member.SupportGroup?.name || <span className="xui-opacity-4">None</span>}</td>
                      <td>
                        {member.MemberRole ? (
                          <span className="xui-badge xui-badge-blue xui-font-sz-80">{member.MemberRole.name}</span>
                        ) : (
                          <span className="xui-opacity-4 xui-font-sz-80">None</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80 xui-opacity-6">{member.code || '-'}</td>
                      <td className="xui-opacity-7 xui-font-sz-80">{formatDate(member.createdAt)}</td>
                      {(canDelete || canChangeRole) && (
                        <td>
                          <div className="xui-tooltip" xui-set="left">
                            <span className="xui-cursor-pointer xui-d-inline-flex"><OverflowMenuVertical size={20} /></span>
                            <div className="xui-tooltip-content xui-flex-ai-center xui-grid-gap-half" style={{ display: 'flex', maxWidth: '500px' }}>
                              {canChangeRole && <button onClick={() => { setSelected(member); modalShow('change-member-role-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}><UserRole size={16} /> Change Role</button>}
                              {canDelete && <button onClick={() => { setSelected(member); modalShow('delete-member-modal'); }} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}><TrashCan size={16} /> Remove</button>}
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
        id="delete-member-modal"
        title="Remove Member"
        message="Are you sure you want to remove this member? This action cannot be undone."
        itemName={selected ? memberName(selected) : ''}
        confirmText="Remove"
        confirmingText="Removing..."
        confirmButtonStyle="danger"
        onConfirm={async () => {
          if (!moduleId || !subModuleId || !selected) return { success: false, message: 'Unable to remove member' };
          return membersService.remove(selected.unique_id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        }}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-members-modal"
        title="Export Members"
        fileName="members"
        columns={[
          { key: 'User.firstname', header: 'First Name' },
          { key: 'User.lastname', header: 'Last Name' },
          { key: 'User.email', header: 'Email' },
          { key: 'SupportGroup.name', header: 'Support Group' },
          { key: 'MemberRole.name', header: 'Role' },
          { key: 'code', header: 'Code' },
          { key: 'nin', header: 'NIN' },
          { key: 'createdAt', header: 'Joined' },
        ]}
        data={members}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
      <ChangeMemberRoleModal
        accessIds={moduleId && subModuleId ? { module_unique_id: moduleId, sub_module_unique_id: subModuleId } : null}
        roleAccessIds={roleAccessIds ? { module_unique_id: roleAccessIds.module_unique_id, sub_module_unique_id: roleAccessIds.sub_module_unique_id } : null}
        member={selected}
        memberName={selected?.User ? `${selected.User.firstname} ${selected.User.lastname}` : (selected?.code || 'This member')}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
      />
    </div>
  );
};

export default AllMembers;
