'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import { extractErrorMessage } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import { Add, TrashCan } from '@carbon/icons-react';
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

  const accessIds = useMemo(() => getAccessIds('campaign', 'member-role-acls'), []);
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
    memberRolesService.publicGetAll({ size: 100 })
      .then(res => {
        if (res.success && res.data) {
          const rows = Array.isArray(res.data) ? res.data : res.data.rows;
          setMemberRoles(rows || []);
        }
      }).catch(() => {});

    if (moduleId) {
      modulesService.getAll({ module_unique_id: moduleId, sub_module_unique_id: subModuleId })
        .then(res => {
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

  const togglePerm = (idx: number, perm: typeof PERMS[number]) =>
    updateEntry(idx, { [perm]: !entries[idx][perm] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !subModuleId) return;
    if (!memberRoleId) { setError('Please select a member role'); return; }
    if (entries.some(en => !en.module_unique_id)) { setError('All entries must have a module selected'); return; }

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
        setTimeout(() => router.push('/dashboard/campaign/member-role-acls'), 1200);
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

      <div className="xui-py-1-half">
        <form onSubmit={handleSubmit}>
          <div className="xui-bg-white xui-bdr-rad-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)', padding: '20px' }}>
            <div className="xui-form-box xui-mt-0">
              <label>Member Role <span style={{ color: 'var(--error)' }}>*</span></label>
              <select value={memberRoleId} onChange={e => setMemberRoleId(e.target.value)} required>
                <option value="">Select member role</option>
                {memberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1 xui-mb-1">
            {entries.map((entry, idx) => {
              const subs = getSubModules(entry.module_unique_id);
              return (
                <div key={idx} className="xui-bg-white xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-200)', padding: '20px' }}>
                  <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                    <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--neutral-700)' }}>ACL #{idx + 1}</span>
                    {entries.length > 1 && (
                      <button type="button" onClick={() => removeEntry(idx)} className="xui-btn xui-btn-small xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ background: 'var(--error-light)', border: 'none', color: 'var(--error)', fontSize: '12px' }}>
                        <TrashCan size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
                    <div className="xui-form-box xui-mt-0">
                      <label>Module <span style={{ color: 'var(--error)' }}>*</span></label>
                      <select value={entry.module_unique_id} onChange={e => updateEntry(idx, { module_unique_id: e.target.value, sub_module_unique_id: '' })} required>
                        <option value="">Select module</option>
                        {modules.map(m => <option key={m.unique_id} value={m.unique_id}>{m.name}</option>)}
                      </select>
                    </div>

                    {subs.length > 0 && (
                      <div className="xui-form-box xui-mt-0">
                        <label>Sub-Module</label>
                        <select value={entry.sub_module_unique_id} onChange={e => updateEntry(idx, { sub_module_unique_id: e.target.value })}>
                          <option value="">All sub-modules</option>
                          {subs.map(s => <option key={s.unique_id} value={s.unique_id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="xui-form-box">
                    <label>Permissions</label>
                    <div className="xui-d-flex xui-flex-wrap xui-grid-gap-1 xui-mt-half">
                      {PERMS.map(perm => (
                        <label key={perm} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer" style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                          <input type="checkbox" checked={entry[perm]} onChange={() => togglePerm(idx, perm)} />
                          {perm.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addEntry} className="xui-btn xui-btn-text xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-85 xui-mb-1-half" style={{ color: 'var(--primary-600)', border: '1px dashed var(--primary-300)', borderRadius: '8px', padding: '10px 16px', width: '100%', justifyContent: 'center' }}>
            <Add size={16} /> Add Another Module
          </button>

          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-half xui-font-sz-85" style={{ border: '1px solid var(--neutral-300)', background: 'var(--neutral-50)', color: 'var(--neutral-700)' }} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="xui-btn xui-bdr-rad-half xui-font-sz-85" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }} disabled={submitting}>
              {submitting ? 'Adding...' : `Add ${entries.length} ACL${entries.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={success} />
    </div>
  );
};

export default AddMultipleMemberRoleAcls;
