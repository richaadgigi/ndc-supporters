'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Renew } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import membersService from '../../services/members.service';
import type { Member } from '../../services/members.service';
import { Alert, showAlert, ErrorState } from '../../components/common';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { UserDetailSkeleton } from '../../components/skeletons';

const EditMember = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError] = useState('');
  const [successMessage] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'members');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchMember = useCallback(async () => {
    if (!id || !moduleId) return;
    setLoading(true); setFetchError('');
    try {
      const response = await membersService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success && response.data) setMember(response.data);
      else setFetchError(response.message || 'Failed to load member');
    } catch (err: any) { setFetchError(extractErrorMessage(err, 'Failed to load member')); } finally { setLoading(false); }
  }, [id, moduleId, subModuleId]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>{label}</span>
      <span className="xui-font-sz-85">{value || '-'}</span>
    </div>
  );

  return (
    <div>
      <Navbar title="View Member" subtitle="Member details" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {loading ? (
          <UserDetailSkeleton />
        ) : fetchError ? (
          <ErrorState message={fetchError} onRetry={fetchMember} />
        ) : member ? (
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Personal Info</h3>
              </div>
              <div className="xui-p-1 xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                <Field label="First Name" value={member.User?.firstname} />
                <Field label="Last Name" value={member.User?.lastname} />
                <Field label="Email" value={member.User?.email} />
                <Field label="Code" value={member.code} />
                <Field label="NIN" value={member.nin} />
              </div>
            </div>

            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Membership Info</h3>
              </div>
              <div className="xui-p-1 xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                <Field label="Support Group" value={member.SupportGroup?.name} />
                <Field label="Role" value={member.MemberRole?.name} />
                <div>
                  <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Status</span>
                  <span className={`xui-badge ${member.status === 1 ? 'xui-badge-success' : 'xui-badge-danger'} xui-font-sz-70`}>
                    {member.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Field label="Joined" value={formatDate(member.createdAt, 'MMM D, YYYY h:mm A')} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditMember;
