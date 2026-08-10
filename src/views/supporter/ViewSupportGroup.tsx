'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
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

const ViewSupportGroup = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<SupportGroup | null>(null);
  const [fetchError, setFetchError] = useState('');

  const accessIds = getAccessIds('supporter', 'support-groups');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  useEffect(() => {
    if (!id || !moduleId || !subModuleId) { setLoading(false); return; }
    let cancelled = false;
    supportGroupsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (!cancelled && res.success && res.data) setItem(res.data); })
      .catch(err => { if (!cancelled) setFetchError(extractErrorMessage(err, 'Failed to load support group')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, moduleId, subModuleId]);

  if (loading) return (
    <div>
      <Navbar title="Support Group Details" subtitle="View support group information" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Support Group Details" subtitle="View support group information" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">{fetchError || 'Support group not found or you do not have access.'}</p>
      </div>
    </div>
  );

  const statesCovered = item.states_covered?.length
    ? item.states_covered.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean).join(', ')
    : null;

  const hasContact = item.contact_name || item.contact_email || item.contact_phone_number || item.contact_alt_phone_number || item.contact_office_address;
  const hasAccount = item.account_bank || item.account_name || item.account_number || item.account_other;
  const ownerName = item.User ? [item.User.firstname, item.User.middlename, item.User.lastname].filter(Boolean).join(' ') : null;

  return (
    <div>
      <Navbar title="Support Group Details" subtitle="View support group information" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.push('/dashboard/supporter/support-groups')} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer" style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}>
            <ArrowLeft size={18} />
            <span>Back to Support Groups</span>
          </a>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-2">
            {item.image ? (
              <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neutral-200)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--neutral-500)', flexShrink: 0 }}>
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="xui-font-sz-[20px] xui-font-w-600" style={{ margin: 0 }}>{item.name}</h2>
              {item.SupportGroupType && <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{item.SupportGroupType.title}</p>}
              <div className="xui-mt-half">
                <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', ...statusStyle(item.support_group_status) }}>
                  {item.support_group_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--neutral-200)', marginBottom: '20px' }} />

          <SectionTitle>Basic Information</SectionTitle>
          <div style={{ ...gridStyle, marginBottom: '20px' }}>
            <Field label="Name" value={item.name} />
            <Field label="Scope" value={item.scope_option} />
            <Field label="Type" value={item.SupportGroupType?.title} />
            <Field label="Views" value={item.views} />
            <Field label="Created" value={formatDate(item.createdAt)} />
            <Field label="Approved By" value={item.Approver ? `${item.Approver.firstname} ${item.Approver.lastname}` : null} />
          </div>

          <hr style={{ borderColor: 'var(--neutral-200)', margin: '0 0 20px' }} />

          <SectionTitle>Owner</SectionTitle>
          <div style={gridStyle}>
            <Field label="Name" value={ownerName} />
            <Field label="Email" value={item.User?.email} />
            <Field label="Gender" value={item.User?.gender} />
            <Field label="Member Code" value={item.Member?.code} />
            <Field label="NIN" value={item.Member?.nin} />
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <SectionTitle>Demography</SectionTitle>
          <div style={gridStyle}>
            <Field label="Zone" value={item.zone} />
            <Field label="State" value={item.state} />
            <Field label="LGA" value={item.lga} />
            <Field label="Ward" value={item.ward} />
            <Field label="Constituency" value={item.constituency} />
            <Field label="States Covered" value={statesCovered} />
          </div>
        </div>

        {hasContact && (
          <div className={cardClass} style={cardStyle}>
            <SectionTitle>Contact Information</SectionTitle>
            <div style={gridStyle}>
              <Field label="Contact Name" value={item.contact_name} />
              <Field label="Email" value={item.contact_email} />
              <Field label="Phone Number" value={item.contact_phone_number} />
              <Field label="Alt. Phone" value={item.contact_alt_phone_number} />
              <Field label="Office Address" value={item.contact_office_address} />
            </div>
          </div>
        )}

        {hasAccount && (
          <div className={cardClass} style={cardStyle}>
            <SectionTitle>Account Information</SectionTitle>
            <div style={gridStyle}>
              <Field label="Bank" value={item.account_bank} />
              <Field label="Account Name" value={item.account_name} />
              <Field label="Account Number" value={item.account_number} />
              <Field label="Other Details" value={item.account_other} />
            </div>
          </div>
        )}
      </div>
      <Alert id="error-alert" type="error" title="Error" message={fetchError} />
    </div>
  );
};

export default ViewSupportGroup;
