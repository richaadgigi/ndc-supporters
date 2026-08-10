'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, UserAvatar } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupMembersService from '../../services/supportGroupMembers.service';
import type { SupportGroupMember } from '../../services/supportGroupMembers.service';
import { Alert } from '../../components/common';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { DetailSkeleton } from '../../components/skeletons';

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="xui-font-sz-80 xui-opacity-5" style={{ margin: '0 0 4px' }}>{label}</p>
    <p className="xui-font-sz-90 xui-font-w-500" style={{ margin: 0 }}>{value !== null && value !== undefined && value !== '' ? value : <span className="xui-opacity-4">Not set</span>}</p>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="xui-font-sz-85 xui-font-w-bold xui-opacity-6 xui-mb-1">{children}</p>
);

const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };
const cardClass = 'xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1';
const cardStyle: React.CSSProperties = { border: '1px solid var(--neutral-200)' };

const statusStyle = (status: string | null) => {
  if (status === 'Active') return { backgroundColor: 'var(--success-light)', color: 'var(--success)' };
  if (status === 'Pending') return { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' };
  return { backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)' };
};

const ViewSupportGroupMember = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<SupportGroupMember | null>(null);
  const [fetchError, setFetchError] = useState('');

  const accessIds = getAccessIds('supporter', 'support-group-members');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  useEffect(() => {
    if (!id || !moduleId || !subModuleId) { setLoading(false); return; }
    let cancelled = false;
    supportGroupMembersService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (!cancelled && res.success && res.data) setItem(res.data); })
      .catch(err => { if (!cancelled) setFetchError(extractErrorMessage(err, 'Failed to load member')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, moduleId, subModuleId]);

  if (loading) return (
    <div>
      <Navbar title="Member Details" subtitle="View support group member information" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Member Details" subtitle="View support group member information" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">{fetchError || 'Member not found or you do not have access.'}</p>
      </div>
    </div>
  );

  const fullName = item.User ? [item.User.firstname, item.User.middlename, item.User.lastname].filter(Boolean).join(' ') : '';

  return (
    <div>
      <Navbar title="Member Details" subtitle="View support group member information" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.push('/dashboard/supporter/support-group-members')} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer" style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}>
            <ArrowLeft size={18} />
            <span>Back to Members</span>
          </a>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-2">
            {item.User?.profile_image ? (
              <img src={item.User.profile_image} alt={fullName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neutral-200)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-500)', flexShrink: 0 }}>
                <UserAvatar size={36} />
              </div>
            )}
            <div>
              <h2 className="xui-font-sz-[20px] xui-font-w-600" style={{ margin: 0 }}>{fullName || 'Unnamed member'}</h2>
              {item.User?.Role && <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{item.User.Role.name}</p>}
              <div className="xui-mt-half xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-flex-wrap">
                <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', ...statusStyle(item.member_status) }}>
                  {item.member_status || 'Pending'}
                </span>
                {item.admin && (
                  <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
                    Group Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--neutral-200)', marginBottom: '20px' }} />

          <SectionTitle>Personal Information</SectionTitle>
          <div style={{ ...gridStyle, marginBottom: '20px' }}>
            <Field label="First Name" value={item.User?.firstname} />
            <Field label="Middle Name" value={item.User?.middlename} />
            <Field label="Last Name" value={item.User?.lastname} />
            <Field label="Gender" value={item.User?.gender} />
            <Field label="Date of Birth" value={item.User?.date_of_birth ? formatDate(item.User.date_of_birth) : null} />
          </div>

          <hr style={{ borderColor: 'var(--neutral-200)', margin: '0 0 20px' }} />

          <SectionTitle>Contact Information</SectionTitle>
          <div style={gridStyle}>
            <Field label="Email" value={item.User?.email} />
            <Field label="Phone Number" value={item.User?.phone_number} />
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <SectionTitle>Membership</SectionTitle>
          <div style={gridStyle}>
            <Field label="Support Group" value={item.SupportGroup?.name} />
            <Field label="Member Code" value={item.Member?.code} />
            <Field label="NIN" value={item.Member?.nin} />
            <Field label="Group Admin" value={item.admin ? 'Yes' : 'No'} />
            <Field label="Joined" value={formatDate(item.createdAt)} />
          </div>
        </div>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={fetchError} />
    </div>
  );
};

export default ViewSupportGroupMember;
