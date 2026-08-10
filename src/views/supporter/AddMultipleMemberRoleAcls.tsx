'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Add, TrashCan } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import memberRoleAclsService from '../../services/memberRoleAcls.service';
import memberRolesService from '../../services/memberRoles.service';
import modulesService from '../../services/modules.service';
import type { MemberRole } from '../../services/memberRoles.service';
import type { Module, SubModule } from '../../services/modules.service';

const PERMS = ['add', 'edit', 'delete', 'elevated_role'] as const;

interface AclEntry {
  module_unique_id: string;
  sub_module_unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
}

const emptyEntry = (): AclEntry => ({ module_unique_id: '', sub_module_unique_id: '', add: false, edit: false, delete: false, elevated_role: false });

const AddMultipleMemberRoleAcls = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();

  const accessIds = useMemo(() => getAccessIds('supporter', 'member-role-acls'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [memberRoleId, setMemberRoleId] = useState('');
  const [entries, setEntries] = useState<AclEntry[]>([emptyEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    memberRolesService.publicGetAll({ size: 100 }).then(res => {
      if (res.success && res.data) {
        const rows = Array.isArray(res.data) ? res.data : res.data.rows;
        setMemberRoles(rows || []);
      }
    }).catch(() => {});

    if (moduleId) {
      modulesService.getAll({ module_unique_id: moduleId, sub_module_unique_id: subModuleId }).then(res => {
        if (res.success && res.data) {
          const rows = Array.isArray(res.data) ? res.data : res.data.rows;
          setModules(rows || []);
        }
      }).catch(() => {});
    }
  }, [moduleId]);

  const getSubModules = (mod_id: string): SubModule[] =>
    modules.find(m => m.unique_id === mod_id)?.SubModules || [];

  const updateEntry = (idx: number, patch: Partial<AclEntry>) =>
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);
  const removeEntry = (idx: number) => setEntries(prev => prev.filter((_, i) => i !== idx));

  const toggleAll = (idx: number, checked: boolean) => {
    updateEntry(idx, { add: checked, edit: checked, delete: checked, elevated_role: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !subModuleId) return;
    if (!memberRoleId) { setError('Please select a member role'); showAlert('error-alert'); return; }
    if (entries.some(en => !en.module_unique_id)) { setError('All entries must have a module selected'); showAlert('error-alert'); return; }

    setSubmitting(true); setError('');
    try {
      const member_role_acls = entries.map(en => ({
        module_unique_id: en.module_unique_id,
        ...(en.sub_module_unique_id ? { sub_module_unique_id: en.sub_module_unique_id } : {}),
        add: en.add, edit: en.edit, delete: en.delete, elevated_role: en.elevated_role,
      }));

      const res = await memberRoleAclsService.addMultiple(
        { member_role_unique_id: memberRoleId, member_role_acls },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );

      if (res.success) {
        setSuccess('ACLs added successfully');
        showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/member-role-acls'), 1200);
      } else {
        setError(res.message || 'Failed to add ACLs');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add ACLs'));
      showAlert('error-alert');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <Navbar title="Add Multiple ACLs" subtitle="Bulk assign permissions to a member role" />

      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Select a member role, then add one or more module access entries with permissions.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit} className="xui-form">
          <div className="xui-form-box xui-mb-1-half" style={{ maxWidth: '500px' }}>
            <label htmlFor="member_role_unique_id">Member Role *</label>
            <select id="member_role_unique_id" value={memberRoleId} onChange={e => setMemberRoleId(e.target.value)}>
              <option value="">Select member role</option>
              {memberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
            </select>
          </div>

          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
            <p className="xui-font-w-600">ACL Entries</p>
            <button type="button" onClick={addEntry} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}>
              <span className="icon-container"><Add size={16} /></span> Add Entry
            </button>
          </div>

          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
            {entries.map((entry, idx) => {
              const subs = getSubModules(entry.module_unique_id);
              const allChecked = entry.add && entry.edit && entry.delete && entry.elevated_role;
              return (
                <div key={idx} className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                    <span className="xui-font-w-600 xui-font-sz-85" style={{ color: 'var(--neutral-600)' }}>Entry {idx + 1}</span>
                    {entries.length > 1 && (
                      <button type="button" onClick={() => removeEntry(idx)} className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer" style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}>
                        <TrashCan size={16} />
                      </button>
                    )}
                  </div>

                  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
                    <div>
                      <div className="xui-form-box">
                        <label>Module *</label>
                        <select value={entry.module_unique_id} onChange={e => updateEntry(idx, { module_unique_id: e.target.value, sub_module_unique_id: '' })}>
                          <option value="">Select module</option>
                          {modules.map(m => <option key={m.unique_id} value={m.unique_id}>{m.name}</option>)}
                        </select>
                      </div>

                      <div className="xui-form-box">
                        <label>Sub Module</label>
                        <select disabled={!entry.module_unique_id || subs.length === 0} value={entry.sub_module_unique_id} onChange={e => updateEntry(idx, { sub_module_unique_id: e.target.value })}>
                          <option value="">{!entry.module_unique_id ? 'Select a module first' : subs.length === 0 ? 'No sub modules' : 'Select sub module (optional)'}</option>
                          {subs.map(s => <option key={s.unique_id} value={s.unique_id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-half">
                        <p className="xui-font-w-500 xui-font-sz-85">Permissions</p>
                        <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80">
                          <input type="checkbox" checked={allChecked} onChange={e => toggleAll(idx, e.target.checked)} />
                          <span className="xui-font-w-500">Check All</span>
                        </label>
                      </div>
                      <div className="xui-p-1 xui-bg-light xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-200)' }}>
                        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ opacity: 0.6 }}>
                              <input type="checkbox" checked disabled />
                              <div>
                                <span className="xui-font-w-500">View</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">View records (default)</span>
                              </div>
                            </label>
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input type="checkbox" checked={entry.add} onChange={e => updateEntry(idx, { add: e.target.checked })} />
                              <div>
                                <span className="xui-font-w-500">Add</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Create new records</span>
                              </div>
                            </label>
                          </div>
                          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input type="checkbox" checked={entry.edit} onChange={e => updateEntry(idx, { edit: e.target.checked })} />
                              <div>
                                <span className="xui-font-w-500">Edit</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Modify records</span>
                              </div>
                            </label>
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input type="checkbox" checked={entry.delete} onChange={e => updateEntry(idx, { delete: e.target.checked })} />
                              <div>
                                <span className="xui-font-w-500">Delete</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Remove records</span>
                              </div>
                            </label>
                          </div>
                          <hr className="xui-my-half" />
                          <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                            <input type="checkbox" checked={entry.elevated_role} onChange={e => updateEntry(idx, { elevated_role: e.target.checked })} />
                            <div>
                              <span className="xui-font-w-500">Elevated Role</span>
                              <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Grant elevated administrative access</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={submitting} className="xui-btn xui-mt-1-half xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {submitting ? 'Adding...' : `Add ${entries.length} ACL${entries.length > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={success} />
    </div>
  );
};

export default AddMultipleMemberRoleAcls;
