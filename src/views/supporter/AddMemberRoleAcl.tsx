'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
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

  const accessIds = useMemo(() => getAccessIds('supporter', 'member-role-acls'), []);
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
        setTimeout(() => router.push('/dashboard/supporter/member-role-acls'), 1200);
      } else {
        setError(res.message || 'Failed to add ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add ACL'));
      showAlert('error-alert');
    } finally { setSubmitting(false); }
  };

  const allChecked = PERMS.every(p => form[p]);
  const toggleAll = (checked: boolean) => {
    setForm(f => ({ ...f, add: checked, edit: checked, delete: checked, elevated_role: checked }));
  };

  return (
    <div>
      <Navbar title="Add Member Role ACL" subtitle="Grant access permissions to a member role" />

      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Select a member role and a module, then choose the permissions to grant.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
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

              <div className="xui-form-box">
                <label>Sub Module</label>
                <select value={form.sub_module_unique_id} onChange={e => setForm(f => ({ ...f, sub_module_unique_id: e.target.value }))} disabled={!form.module_unique_id}>
                  <option value="">{form.module_unique_id ? 'All sub-modules' : 'Select a module first'}</option>
                  {subModules.map(s => <option key={s.unique_id} value={s.unique_id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-half">
                <p className="xui-font-w-500 xui-font-sz-85">Permissions</p>
                <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80">
                  <input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
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
                      <input type="checkbox" checked={form.add} onChange={() => toggle('add')} />
                      <div>
                        <span className="xui-font-w-500">Add</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Create new records</span>
                      </div>
                    </label>
                  </div>
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                      <input type="checkbox" checked={form.edit} onChange={() => toggle('edit')} />
                      <div>
                        <span className="xui-font-w-500">Edit</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Modify records</span>
                      </div>
                    </label>
                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                      <input type="checkbox" checked={form.delete} onChange={() => toggle('delete')} />
                      <div>
                        <span className="xui-font-w-500">Delete</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Remove records</span>
                      </div>
                    </label>
                  </div>
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" checked={form.elevated_role} onChange={() => toggle('elevated_role')} />
                    <div>
                      <span className="xui-font-w-500">Elevated Role</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Grant elevated administrative access</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <hr className="xui-my-2" />
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'transparent', border: '1px solid var(--neutral-300)', color: 'inherit' }} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add ACL'}
            </button>
          </div>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={success} />
    </div>
  );
};

export default AddMemberRoleAcl;
