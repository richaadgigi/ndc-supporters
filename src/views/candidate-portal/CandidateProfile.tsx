'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { Edit, Renew } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import candidatesService from '../../services/candidates.service';
import type { Candidate } from '../../services/candidates.service';
import { EmptyState } from '../../components/common';
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

const cardStyle = { border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '16px', marginBottom: '12px' };

const CandidateProfile = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessIds, checkAccess } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isPortalUser, setIsPortalUser] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || '');
  const [loadingList, setLoadingList] = useState(false);

  const accessIds = getAccessIds('candidate-portal', 'candidate-profile');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  const fetchPortalProfile = async () => {
    if (!moduleId || !subModuleId) return false;
    try {
      const response = await candidatesService.getProfile({ module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success && response.data) {
        setCandidate(response.data);
        setIsPortalUser(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const fetchCandidateList = async () => {
    if (!moduleId || !subModuleId) return;
    setLoadingList(true);
    try {
      const response = await candidatesService.getAll({ page: 1, size: 200, module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success && response.data) {
        const rows = Array.isArray(response.data) ? response.data : (response.data as any).rows || [];
        setCandidates(rows);
      }
    } catch {}
    finally { setLoadingList(false); }
  };

  const fetchCandidateById = async (id: string) => {
    if (!moduleId || !subModuleId || !id) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await candidatesService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success && response.data) {
        setCandidate(response.data);
      } else {
        setFetchError(response.message || 'Failed to load candidate profile');
      }
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to load candidate profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) { setLoading(false); return; }
    const init = async () => {
      const ok = await fetchPortalProfile();
      if (!ok) {
        await fetchCandidateList();
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) await fetchCandidateById(idFromUrl);
      }
      setLoading(false);
    };
    init();
  }, [moduleId, subModuleId]);

  const hasContact = !!(candidate?.contact_office_address || candidate?.contact_phone_number || candidate?.contact_alt_phone_number || candidate?.contact_email);
  const socialMedia: { platform: string; url: string }[] = Array.isArray((candidate as any)?.social_media) ? (candidate as any).social_media.filter((s: any) => s?.url) : [];
  const keyFacts: { fact: string }[] = Array.isArray((candidate as any)?.key_facts) ? (candidate as any).key_facts.filter((k: any) => k?.fact) : [];
  const education: any[] = Array.isArray((candidate as any)?.education) ? (candidate as any).education.filter((e: any) => e?.institution) : [];
  const careerHistory: any[] = Array.isArray((candidate as any)?.career_history) ? (candidate as any).career_history.filter((c: any) => c?.organization) : [];
  const publicOffices: any[] = Array.isArray((candidate as any)?.previous_public_offices) ? (candidate as any).previous_public_offices.filter((o: any) => o?.office) : [];
  const manifesto: any[] = Array.isArray((candidate as any)?.manifesto) ? (candidate as any).manifesto.filter((m: any) => m?.title) : [];

  if (loading) {
    return (
      <div>
        <Navbar title="Candidate Profile" subtitle="View and manage candidate profile" />
        <div className="xui-py-1"><DetailSkeleton /></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Candidate Profile" subtitle="View and manage candidate profile" />
      <div className="xui-py-1">

        {!isPortalUser && (
          <div className="xui-mb-1-half" style={{ maxWidth: '700px', margin: '0 auto 24px' }}>
            <div className="xui-form" style={{ marginBottom: 0 }}>
              <div className="xui-form-box xui-mb-0">
                <label htmlFor="candidate-select">Select Candidate</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    id="candidate-select"
                    style={{ flex: 1 }}
                    value={selectedId}
                    onChange={(e) => { const id = e.target.value; setSelectedId(id); setCandidate(null); if (id) { router.replace(`?id=${id}`); fetchCandidateById(id); } else { router.replace('?'); } }}
                    disabled={loadingList}
                  >
                    <option value="">{loadingList ? 'Loading candidates...' : 'Select a candidate to view profile'}</option>
                    {candidates.map((c) => (
                      <option key={c.unique_id} value={c.unique_id}>{c.name}{(c as any).Position?.name ? ` (${(c as any).Position.name})` : c.state ? ` - ${c.state}` : ''}</option>
                    ))}
                  </select>
                  {candidates.length > 0 && (
                    <button onClick={fetchCandidateList} disabled={loadingList} className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)', whiteSpace: 'nowrap' }}>
                      <Renew size={16} /> Refresh
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {fetchError && !candidate && (
          <p style={{ color: 'var(--error)', fontSize: '14px' }}>{fetchError}</p>
        )}

        {!isPortalUser && !candidate && !fetchError && (
          <EmptyState title="No candidate selected" message="Select a candidate from the dropdown above to view their profile." />
        )}

        {candidate && (
          <>
          <div className="xui-bg-white xui-bdr-rad-half xui-p-2 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
            <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-2">
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
                {candidate.image ? (
                  <img src={candidate.image} alt={candidate.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neutral-200)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--neutral-500)', flexShrink: 0 }}>
                    {candidate.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{candidate.name}</h2>
                  {candidate.slogan && <p className="xui-font-sz-85 xui-opacity-6" style={{ margin: '4px 0 0' }}>{candidate.slogan}</p>}
                  {candidate.Position?.name && <p className="xui-font-sz-80 xui-opacity-5" style={{ margin: '4px 0 0' }}>{candidate.Position.name}</p>}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => router.push(`/dashboard/campaign/candidates/edit/${candidate.unique_id}`)}
                  className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                >
                  <span className="icon-container"><Edit size={16} /></span>
                  Edit Profile
                </button>
              )}
            </div>

            <hr style={{ borderColor: 'var(--neutral-200)', marginBottom: '20px' }} />
            <SectionTitle>Basic Information</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <Field label="Gender" value={candidate.gender} />
              <Field label="Date of Birth" value={candidate.date_of_birth ? candidate.date_of_birth.split('T')[0] : null} />
              <Field label="Position" value={candidate.Position?.name} />
              <Field label="Member Role" value={(candidate as any).MemberRole?.name} />
              <Field label="Running Mate" value={(candidate as any).RunningMate?.name} />
              <Field label="State" value={candidate.state} />
              <Field label="LGA" value={candidate.lga} />
              <Field label="Ward" value={candidate.ward} />
              <Field label="Constituency" value={candidate.constituency} />
              <Field label="Joined" value={formatDate(candidate.createdAt)} />
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
          </>
        )}
      </div>

    </div>
  );
};

export default CandidateProfile;
