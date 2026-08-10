'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Edit } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import { Alert, EmptyState, ErrorState } from '../../components/common';
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

const SupportGroupProfile = () => {
  const router = useRouter();
  const { getAccessIds, checkAccess } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupportGroup | null>(null);
  const [fetchError, setFetchError] = useState('');
  const accessIds = useMemo(() => getAccessIds('supporter-portal', 'support-group-profile'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  useEffect(() => {
    if (!moduleId || !subModuleId) { setFetchError('You do not have access to this module'); setLoading(false); return; }
    let cancelled = false;
    supportGroupsService.portalGetProfile({ module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (!cancelled && res.success && res.data) setProfile(res.data); })
      .catch(err => { if (!cancelled) setFetchError(extractErrorMessage(err, 'Failed to load profile')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [moduleId, subModuleId]);

  const statesCovered = profile?.states_covered?.length
    ? profile.states_covered.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean).join(', ')
    : null;

  return (
    <div>
      <Navbar title="Support Group Profile" subtitle="View and manage your support group profile" />
      <div className="xui-py-1">
        {loading ? <DetailSkeleton /> : fetchError ? (
          <ErrorState title="Failed to load profile" message={fetchError} />
        ) : !profile ? (
          <EmptyState title="No profile found" message="Your support group profile is not available yet." />
        ) : (
          <>
            <div className={cardClass} style={cardStyle}>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-2">
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neutral-200)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--neutral-500)', flexShrink: 0 }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 className="xui-font-sz-[20px] xui-font-w-600" style={{ margin: 0 }}>{profile.name}</h2>
                  {profile.SupportGroupType && <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{profile.SupportGroupType.title}</p>}
                  <div className="xui-mt-half">
                    <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', ...statusStyle(profile.support_group_status) }}>
                      {profile.support_group_status || 'Pending'}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <button type="button" onClick={() => router.push('/dashboard/supporter-portal/profile/edit')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', border: 'none', whiteSpace: 'nowrap', padding: '6px 10px' }}>
                    <span className="icon-container"><Edit size={14} /></span> Edit Profile
                  </button>
                )}
              </div>

              <hr style={{ borderColor: 'var(--neutral-200)', marginBottom: '20px' }} />

              <SectionTitle>Basic Information</SectionTitle>
              <div style={gridStyle}>
                <Field label="Name" value={profile.name} />
                <Field label="Scope" value={profile.scope_option} />
                <Field label="Type" value={profile.SupportGroupType?.title} />
                <Field label="Views" value={profile.views} />
                <Field label="Created" value={formatDate(profile.createdAt)} />
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Demography</SectionTitle>
              <div style={gridStyle}>
                <Field label="Zone" value={profile.zone} />
                <Field label="State" value={profile.state} />
                <Field label="LGA" value={profile.lga} />
                <Field label="Ward" value={profile.ward} />
                <Field label="Constituency" value={profile.constituency} />
                <Field label="States Covered" value={statesCovered} />
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Contact Information</SectionTitle>
              <div style={gridStyle}>
                <Field label="Contact Name" value={profile.contact_name} />
                <Field label="Email" value={profile.contact_email} />
                <Field label="Phone Number" value={profile.contact_phone_number} />
                <Field label="Alt. Phone" value={profile.contact_alt_phone_number} />
                <Field label="Office Address" value={profile.contact_office_address} />
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Account Information</SectionTitle>
              <div style={gridStyle}>
                <Field label="Bank" value={profile.account_bank} />
                <Field label="Account Name" value={profile.account_name} />
                <Field label="Account Number" value={profile.account_number} />
                <Field label="Other Details" value={profile.account_other} />
              </div>
            </div>
          </>
        )}
      </div>
      <Alert id="error-alert" type="error" title="Error" message={fetchError} />
    </div>
  );
};

export default SupportGroupProfile;
