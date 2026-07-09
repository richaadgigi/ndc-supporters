'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Edit } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import { Alert, showAlert, EmptyState } from '../../components/common';
import { extractErrorMessage, formatDate } from '../../utils/formatters';
import { DetailSkeleton } from '../../components/skeletons';

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="xui-font-sz-80 xui-opacity-5" style={{ margin: '0 0 4px' }}>{label}</p>
    <p className="xui-font-sz-90 xui-font-w-500" style={{ margin: 0 }}>{value || <span className="xui-opacity-4">Not set</span>}</p>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="xui-font-sz-85 xui-font-w-bold xui-opacity-6 xui-mb-1">{children}</p>
);

const ViewCandidate = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds, checkAccess } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<Candidate & { MemberRole?: { unique_id: string; name: string } | null } | null>(null);

  const accessIds = getAccessIds('campaign', 'candidates');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !moduleId || !subModuleId) { setLoading(false); return; }
      try {
        const response = await candidatesService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (response.success && response.data) {
          setCandidate(response.data as any);
        } else {
          setError('Candidate not found or you do not have access');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to load candidate'));
        showAlert('error-alert');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, moduleId, subModuleId]);

  if (loading) {
    return (
      <div>
        <Navbar title="View Candidate" subtitle="Candidate details" />
        <div className="xui-py-1"><DetailSkeleton /></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div>
        <Navbar title="View Candidate" subtitle="Candidate details" />
        <div className="xui-py-1">
          <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          <p className="xui-opacity-5">Candidate not found or you do not have access.</p>
        </div>
      </div>
    );
  }

  const hasContact = !!(candidate.contact_office_address || candidate.contact_phone_number || candidate.contact_alt_phone_number || candidate.contact_email);
  const socialMedia: { platform: string; url: string }[] = Array.isArray(candidate.social_media) ? candidate.social_media.filter((s: any) => s?.url) : [];
  const keyFacts: { fact: string }[] = Array.isArray(candidate.key_facts) ? candidate.key_facts.filter((k: any) => k?.fact) : [];
  const education: any[] = Array.isArray(candidate.education) ? candidate.education.filter((e: any) => e?.institution) : [];
  const careerHistory: any[] = Array.isArray(candidate.career_history) ? candidate.career_history.filter((c: any) => c?.organization) : [];
  const publicOffices: any[] = Array.isArray(candidate.previous_public_offices) ? candidate.previous_public_offices.filter((o: any) => o?.office) : [];
  const manifesto: any[] = Array.isArray(candidate.manifesto) ? candidate.manifesto.filter((m: any) => m?.title) : [];

  const cardStyle = { border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '16px', marginBottom: '12px' };

  return (
    <div>
      <Navbar title="View Candidate" subtitle="Candidate details" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
          <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          {canEdit && (
            <button
              onClick={() => router.push(`/dashboard/campaign/candidates/edit/${candidate.unique_id}`)}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
            >
              <span className="icon-container"><Edit size={16} /></span>
              Edit Candidate
            </button>
          )}
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-2">
            {candidate.image ? (
              <img src={candidate.image} alt={candidate.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neutral-200)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--neutral-500)', flexShrink: 0 }}>
                {candidate.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="xui-font-sz-[20px] xui-font-w-600" style={{ margin: 0 }}>{candidate.name}</h2>
              {candidate.slogan && <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{candidate.slogan}</p>}
              <div className="xui-mt-half">
                <span className="xui-font-sz-75 xui-font-w-500" style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: candidate.status === 1 ? 'var(--success-light)' : 'var(--neutral-100)', color: candidate.status === 1 ? 'var(--success)' : 'var(--neutral-500)' }}>
                  {candidate.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--neutral-200)', marginBottom: '20px' }} />

          <SectionTitle>Basic Information</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Field label="Gender" value={candidate.gender} />
            <Field label="Date of Birth" value={candidate.date_of_birth ? candidate.date_of_birth.split('T')[0] : null} />
            <Field label="Position" value={candidate.Position?.name} />
            <Field label="Member Role" value={(candidate as any).MemberRole?.name} />
            <Field label="Running Mate" value={candidate.RunningMate?.name} />
            <Field label="State" value={candidate.state} />
            <Field label="LGA" value={candidate.lga} />
            <Field label="Ward" value={candidate.ward} />
            <Field label="Constituency" value={candidate.constituency} />
            <Field label="Created" value={formatDate(candidate.createdAt)} />
            <Field label="Last Updated" value={formatDate(candidate.updatedAt)} />
          </div>

          {candidate.bio && (
            <>
              <hr style={{ borderColor: 'var(--neutral-200)', margin: '0 0 20px' }} />
              <SectionTitle>Bio</SectionTitle>
              <p className="xui-font-sz-90" style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{candidate.bio}</p>
            </>
          )}
        </div>

        {hasContact && (
          <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
            <SectionTitle>Contact Information</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Field label="Office Address" value={candidate.contact_office_address} />
              <Field label="Phone Number" value={candidate.contact_phone_number} />
              <Field label="Alt. Phone" value={candidate.contact_alt_phone_number} />
              <Field label="Email" value={candidate.contact_email} />
            </div>
          </div>
        )}

        {socialMedia.length > 0 && (
          <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
            <SectionTitle>Social Media</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {socialMedia.map((s: any, i: number) => (
                <div key={i}>
                  <p className="xui-font-sz-80 xui-opacity-5" style={{ margin: '0 0 4px', textTransform: 'capitalize' }}>{s.platform}</p>
                  <a href={s.url} target="_blank" rel="noreferrer" className="xui-font-sz-85" style={{ color: 'var(--primary-600)', wordBreak: 'break-all' }}>{s.url}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <SectionTitle>Key Facts</SectionTitle>
          {keyFacts.length === 0 ? (
            <EmptyState title="No key facts" message="No key facts have been added for this candidate." />
          ) : (
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              {keyFacts.map((k, i) => (
                <li key={i} className="xui-font-sz-90" style={{ marginBottom: '6px', lineHeight: '1.5' }}>{k.fact}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <SectionTitle>Education</SectionTitle>
          {education.length === 0 ? (
            <EmptyState title="No education entries" message="No education history has been added for this candidate." />
          ) : (
            education.map((e: any, i: number) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <Field label="Institution" value={e.institution} />
                  <Field label="Degree / Certificate" value={e.degree} />
                  <Field label="Year Graduated" value={e.year} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <SectionTitle>Career History</SectionTitle>
          {careerHistory.length === 0 ? (
            <EmptyState title="No career entries" message="No career history has been added for this candidate." />
          ) : (
            careerHistory.map((c: any, i: number) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <Field label="Organization" value={c.organization} />
                  <Field label="Role / Title" value={c.role} />
                  <Field label="Start Year" value={c.start_year} />
                  <Field label="End Year" value={c.end_year} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <SectionTitle>Previous Public Offices</SectionTitle>
          {publicOffices.length === 0 ? (
            <EmptyState title="No public offices" message="No previous public offices have been added for this candidate." />
          ) : (
            publicOffices.map((o: any, i: number) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                  <Field label="Office Held" value={o.office} />
                  <Field label="Year" value={o.year} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
          <SectionTitle>Manifesto</SectionTitle>
          {manifesto.length === 0 ? (
            <EmptyState title="No manifesto points" message="No manifesto points have been added for this candidate." />
          ) : (
            manifesto.map((m: any, i: number) => (
              <div key={i} style={cardStyle}>
                <p className="xui-font-sz-90 xui-font-w-bold" style={{ margin: '0 0 6px' }}>{m.title}</p>
                {m.description && <p className="xui-font-sz-85 xui-opacity-7" style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{m.description}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
    </div>
  );
};

export default ViewCandidate;
