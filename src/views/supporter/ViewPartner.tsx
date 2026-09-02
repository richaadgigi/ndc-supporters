'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Edit } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import partnersService from '../../services/partners.service';
import type { Partner } from '../../services/partners.service';
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

const ViewPartner = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { getAccessIds, checkAccess } = useGeneral();
  const [item, setItem] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = useMemo(() => getAccessIds('supporter', 'partners'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  useEffect(() => {
    if (!moduleId || !subModuleId || !id) return;
    partnersService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => {
        if (res.success && res.data) setItem(res.data);
        else setError(res.message || 'Failed to load partner');
      })
      .catch(err => setError(extractErrorMessage(err, 'Failed to load partner')))
      .finally(() => setLoading(false));
  }, [moduleId, subModuleId, id]);

  return (
    <div>
      <Navbar title="Partner Details" subtitle="View partnership information" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.push('/dashboard/supporter/partners')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          {canEdit && item && (
            <button onClick={() => router.push(`/dashboard/supporter/partners/edit/${item.unique_id}`)} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
              <span className="icon-container"><Edit size={16} /></span> Edit
            </button>
          )}
        </div>

        {loading ? <DetailSkeleton /> : !item ? (
          <div className={cardClass} style={cardStyle}>
            <p className="xui-font-sz-90 xui-opacity-5" style={{ margin: 0 }}>Partner not found.</p>
          </div>
        ) : (
          <>
            <div className={cardClass} style={cardStyle}>
              <h2 className="xui-font-sz-[20px] xui-font-w-600" style={{ margin: 0 }}>{item.organisation_name || item.contact_name}</h2>
              <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{item.partner_type}</p>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Organisation</SectionTitle>
              <div style={gridStyle}>
                <Field label="Organisation Name" value={item.organisation_name} />
                <Field label="Partner Type" value={item.partner_type} />
                <Field label="Year Established" value={item.year_established} />
                <Field label="CAC Number" value={item.cac_number} />
                <Field label="Website" value={item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)' }}>{item.website}</a> : null} />
                <Field label="Where They Operate" value={item.where_do_you_operate} />
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Contact Person</SectionTitle>
              <div style={gridStyle}>
                <Field label="Contact Name" value={item.contact_name} />
                <Field label="Role" value={item.role} />
                <Field label="Email" value={item.email} />
                <Field label="Phone Number" value={item.phone_number} />
                <Field label="Country" value={item.country} />
                <Field label="State" value={item.state} />
                <Field label="LGA" value={item.lga} />
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Charter Areas</SectionTitle>
              {item.charter_areas && item.charter_areas.length > 0 ? (
                <div className="xui-d-flex xui-flex-wrap-wrap xui-grid-gap-half">
                  {item.charter_areas.map((area, i) => (
                    <span key={i} className="xui-font-sz-80 xui-py-half xui-px-1 xui-bdr-rad-half" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>{area}</span>
                  ))}
                </div>
              ) : <p className="xui-font-sz-90 xui-opacity-4" style={{ margin: 0 }}>Not set</p>}
            </div>

            {item.social_links && item.social_links.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <SectionTitle>Social Links</SectionTitle>
                <div className="xui-d-flex xui-flex-wrap-wrap xui-grid-gap-1">
                  {item.social_links.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="xui-font-sz-85" style={{ color: 'var(--primary-600)' }}>{link}</a>
                  ))}
                </div>
              </div>
            )}

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>What The Organisation Does</SectionTitle>
              <p className="xui-font-sz-90" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.what_does_organisation_do}</p>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Proposed Collaboration</SectionTitle>
              <p className="xui-font-sz-90" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.what_would_you_want_to_do_together}</p>
            </div>

            <div className={cardClass} style={cardStyle}>
              <SectionTitle>Record</SectionTitle>
              <div style={gridStyle}>
                <Field label="Submitted" value={formatDate(item.createdAt)} />
                <Field label="Last Updated" value={formatDate(item.updatedAt)} />
              </div>
            </div>
          </>
        )}
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
    </div>
  );
};

export default ViewPartner;
