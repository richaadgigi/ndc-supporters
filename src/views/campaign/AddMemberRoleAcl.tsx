'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter } from 'next/navigation';
import { extractErrorMessage } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import memberRoleAclsService from '../../services/memberRoleAcls.service';
import memberRolesService from '../../services/memberRoles.service';
import modulesService from '../../services/modules.service';
import type { MemberRole } from '../../services/memberRoles.service';
import type { Module, SubModule } from '../../services/modules.service';

const PERMS = ['add', 'edit', 'delete', 'elevated_role'] as const;

const AddMemberRoleAcl = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();

  const accessIds = useMemo(() => getAccessIds('campaign', 'member-role-acls'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);

  const [form, setForm] = useState({
    member_role_unique_id: '',
    module_unique_id: '',
    sub_module_unique_id: '',
    add: false,
    edit: false,
    delete: false,
    elevated_role: false,
  });

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

  const handleModuleChange = (mod_id: string) => {
    const mod = modules.find(m => m.unique_id === mod_id);
    setSubModules(mod?.SubModules || []);
    setForm(f => ({ ...f, module_unique_id: mod_id, sub_module_unique_id: '' }));
  };

  const toggle = (key: typeof PERMS[number]) => setForm(f => ({ ...f, [key]: !f[key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !subModuleId) return;
    if (!form.member_role_unique_id || !form.module_unique_id) {
      setError('Member role and module are required'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await memberRoleAclsService.add(
        {
          member_role_unique_id: form.member_role_unique_id,
          module_unique_id: form.module_unique_id,
          ...(form.sub_module_unique_id ? { sub_module_unique_id: form.sub_module_unique_id } : {}),
          add: form.add, edit: form.edit, delete: form.delete, elevated_role: form.elevated_role,
        },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );
      if (res.success) {
        setSuccess('ACL added successfully');
        showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/campaign/member-role-acls'), 1200);
      } else {
        setError(res.message || 'Failed to add ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add ACL'));
      showAlert('error-alert');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <Navbar title="Add Member Role ACL" subtitle="Grant access permissions to a member role" />

      <div className="xui-py-1-half">
        <div className="xui-bg-white xui-bdr-rad-half xui-max-w-[600px]" style={{ border: '1px solid var(--neutral-200)', padding: '24px' }}>
          <form onSubmit={handleSubmit} className="xui-form">
            <div className="xui-form-box xui-mt-0">
              <label>Member Role <span style={{ color: 'var(--error)' }}>*</span></label>
              <select value={form.member_role_unique_id} onChange={e => setForm(f => ({ ...f, member_role_unique_id: e.target.value }))} required>
                <option value="">Select member role</option>
                {memberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
              </select>
            </div>

            <div className="xui-form-box">
              <label>Module <span style={{ color: 'var(--error)' }}>*</span></label>
              <select value={form.module_unique_id} onChange={e => handleModuleChange(e.target.value)} required>
                <option value="">Select module</option>
                {modules.map(m => <option key={m.unique_id} value={m.unique_id}>{m.name}</option>)}
              </select>
            </div>

            {subModules.length > 0 && (
              <div className="xui-form-box">
                <label>Sub-Module</label>
                <select value={form.sub_module_unique_id} onChange={e => setForm(f => ({ ...f, sub_module_unique_id: e.target.value }))}>
                  <option value="">All sub-modules</option>
                  {subModules.map(s => <option key={s.unique_id} value={s.unique_id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div className="xui-form-box">
              <label>Permissions</label>
              <div className="xui-d-flex xui-flex-wrap xui-grid-gap-1 xui-mt-half">
                {PERMS.map(perm => (
                  <label key={perm} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer" style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                    <input type="checkbox" checked={form[perm]} onChange={() => toggle(perm)} />
                    {perm.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mt-1">
              <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-half xui-font-sz-85" style={{ border: '1px solid var(--neutral-300)', background: 'var(--neutral-50)', color: 'var(--neutral-700)' }} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="xui-btn xui-bdr-rad-half xui-font-sz-85" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add ACL'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={success} />
    </div>
  );
};

export default AddMemberRoleAcl;
