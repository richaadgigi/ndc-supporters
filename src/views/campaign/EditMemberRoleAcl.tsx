'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { useGeneral } from '../../context/GeneralContext';
import { useRouter, useParams } from 'next/navigation';
import { extractErrorMessage } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import memberRoleAclsService from '../../services/memberRoleAcls.service';
import type { MemberRoleAcl } from '../../services/memberRoleAcls.service';

const PERMS = ['add', 'edit', 'delete', 'elevated_role'] as const;

const EditMemberRoleAcl = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { getAccessIds } = useGeneral();

  const accessIds = useMemo(() => getAccessIds('campaign', 'member-role-acls'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const [acl, setAcl] = useState<MemberRoleAcl | null>(null);
  const [form, setForm] = useState({ add: false, edit: false, delete: false, elevated_role: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!moduleId || !subModuleId || !id) { setLoading(false); return; }
    memberRoleAclsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => {
        if (res.success && res.data) {
          setAcl(res.data);
          setForm({ add: res.data.add, edit: res.data.edit, delete: res.data.delete, elevated_role: res.data.elevated_role });
        } else {
          setError('ACL not found');
        }
      })
      .catch(err => setError(extractErrorMessage(err, 'Failed to load ACL')))
      .finally(() => setLoading(false));
  }, [moduleId, subModuleId, id]);

  const toggle = (key: typeof PERMS[number]) => setForm(f => ({ ...f, [key]: !f[key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !subModuleId || !id) return;
    setSubmitting(true); setError('');
    try {
      const res = await memberRoleAclsService.editDetails(
        { unique_id: id, ...form },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );
      if (res.success) {
        setSuccess('ACL updated successfully');
        showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/campaign/member-role-acls'), 1200);
      } else {
        setError(res.message || 'Failed to update ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update ACL'));
      showAlert('error-alert');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <Navbar title="Edit Member Role ACL" subtitle="Update access permissions" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ minHeight: '200px', color: 'var(--neutral-400)', fontSize: '14px' }}>Loading...</div>
        ) : !acl ? (
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ minHeight: '200px', color: 'var(--error)', fontSize: '14px' }}>{error || 'ACL not found'}</div>
        ) : (
          <div className="xui-bg-white xui-bdr-rad-half xui-max-w-[600px]" style={{ border: '1px solid var(--neutral-200)', padding: '24px' }}>
            <div className="xui-mb-1-half" style={{ padding: '12px 16px', background: 'var(--neutral-50)', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-font-sz-85">
                <span><strong>Role:</strong> {acl.MemberRole?.name || '-'}</span>
                <span style={{ color: 'var(--neutral-300)' }}>|</span>
                <span><strong>Module:</strong> {acl.Module?.name || '-'}</span>
                {acl.SubModule && (
                  <>
                    <span style={{ color: 'var(--neutral-300)' }}>|</span>
                    <span><strong>Sub-Module:</strong> {acl.SubModule.name}</span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="xui-form">
              <div className="xui-form-box xui-mt-0">
                <label>Permissions</label>
                <div className="xui-d-flex xui-flex-wrap xui-grid-gap-1 xui-mt-half">
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px' }}>
                    <input type="checkbox" checked disabled />
                    view (always granted)
                  </label>
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
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={success} />
    </div>
  );
};

export default EditMemberRoleAcl;
