'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ChevronLeft, ChevronRight, ArrowLeft } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { Alert, showAlert } from '../../components/common';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage } from '../../utils/formatters';
import { cloudinaryUpload } from '../../utils/cloudinary';
import candidatesService from '../../services/candidates.service';
import positionsService from '../../services/positions.service';
import memberRolesService from '../../services/memberRoles.service';
import statesService from '../../services/states.service';
import lgasService from '../../services/lgas.service';
import wardsService from '../../services/wards.service';
import type { Candidate } from '../../services/candidates.service';
import type { Position } from '../../services/positions.service';
import type { MemberRole } from '../../services/memberRoles.service';
import type { State } from '../../services/states.service';
import type { Lga } from '../../services/lgas.service';
import type { Ward } from '../../services/wards.service';
import CandidateBasicTab from './candidate-form/CandidateBasicTab';
import CandidateLocationTab from './candidate-form/CandidateLocationTab';
import CandidateContentTab from './candidate-form/CandidateContentTab';
import { TABS, type CandidateFormData, type Tab, type ContentSection } from './candidate-form/types';

const AddCandidate = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [activeSection, setActiveSection] = useState<ContentSection>('key_facts');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedLgaId, setSelectedLgaId] = useState('');
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const accessIds = getAccessIds('campaign', 'candidates');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, watch, setValue, control, trigger, formState: { errors } } = useForm<CandidateFormData>({
    defaultValues: {
      name: '', gender: '', dob: '', state: '', lga: '', ward: '', constituency: '',
      slogan: '', bio: '', position_unique_id: '', member_role_unique_id: '', running_mate_unique_id: '',
      contact_office_address: '', contact_phone_number: '', contact_alt_phone_number: '', contact_email: '',
      social_media_facebook: '', social_media_twitter: '', social_media_instagram: '', social_media_youtube: '', social_media_linkedin: '',
      key_facts: [], education: [], career_history: [], previous_public_offices: [], manifesto: [],
    },
  });

  const { fields: keyFactFields, append: appendKeyFact, remove: removeKeyFact } = useFieldArray({ control, name: 'key_facts' });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control, name: 'education' });
  const { fields: careerFields, append: appendCareer, remove: removeCareer } = useFieldArray({ control, name: 'career_history' });
  const { fields: officeFields, append: appendOffice, remove: removeOffice } = useFieldArray({ control, name: 'previous_public_offices' });
  const { fields: manifestoFields, append: appendManifesto, remove: removeManifesto } = useFieldArray({ control, name: 'manifesto' });

  const filteredLgas = selectedStateId ? lgas.filter(l => l.state_unique_id === selectedStateId) : [];
  const filteredWards = selectedLgaId ? wards.filter(w => w.lga_unique_id === selectedLgaId) : [];
  const tabIndex = TABS.findIndex(t => t.key === activeTab);
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null;
  const nextTab = tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null;

  const TAB_REQUIRED_FIELDS: Record<Tab, (keyof CandidateFormData)[]> = {
    basic: ['name', 'gender', 'position_unique_id'],
    location: ['state'],
    content: [],
  };

  const handleNext = async () => {
    if (!nextTab) return;
    const fields = TAB_REQUIRED_FIELDS[activeTab];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setActiveTab(nextTab.key);
  };
  const sectionCounts = {
    key_facts: keyFactFields.length, education: educationFields.length,
    career_history: careerFields.length, previous_public_offices: officeFields.length, manifesto: manifestoFields.length,
  };

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const [sRes, lRes, wRes] = await Promise.all([
          statesService.publicGetAll({ size: 1000 }),
          lgasService.publicGetAll({ size: 1000 }),
          wardsService.publicGetAll({ size: 1000 }),
        ]);
        const sort = (arr: any[]) => arr.sort((a, b) => a.name.localeCompare(b.name));
        if (sRes.success && sRes.data) setStates(sort(Array.isArray(sRes.data) ? sRes.data : sRes.data.rows || []));
        if (lRes.success && lRes.data) setLgas(sort(Array.isArray(lRes.data) ? lRes.data : lRes.data.rows || []));
        if (wRes.success && wRes.data) setWards(sort(Array.isArray(wRes.data) ? wRes.data : wRes.data.rows || []));
      } catch {}
    };
    loadGeo();
  }, []);

  useEffect(() => {
    const loadDropdowns = async () => {
      if (!moduleId || !subModuleId) return;
      try {
        const params = { size: 500, module_unique_id: moduleId, sub_module_unique_id: subModuleId };
        const [pRes, rRes, cRes] = await Promise.all([
          positionsService.getAll({ ...params, size: 100 }),
          memberRolesService.getAll({ ...params, size: 100 }),
          candidatesService.getAll(params),
        ]);
        if (pRes.success && pRes.data) setPositions(Array.isArray(pRes.data) ? pRes.data : pRes.data.rows || []);
        if (rRes.success && rRes.data) setMemberRoles(Array.isArray(rRes.data) ? rRes.data : rRes.data.rows || []);
        if (cRes.success && cRes.data) setAllCandidates(Array.isArray(cRes.data) ? cRes.data : cRes.data.rows || []);
      } catch {}
    };
    loadDropdowns();
  }, [moduleId, subModuleId]);

  const onSubmit = async (data: CandidateFormData) => {
    if (!moduleId || !subModuleId) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    let finalImage = image, finalImagePublicId = imagePublicId;
    if (pendingImageFile) {
      setUploadingImage(true);
      try {
        const r = await cloudinaryUpload(pendingImageFile, 'ndccampaign/candidates');
        finalImage = r.secure_url; finalImagePublicId = r.public_id;
      } catch { setError('Failed to upload image'); showAlert('error-alert'); setUploadingImage(false); setLoading(false); return; }
      setUploadingImage(false);
    }
    try {
      const payload: Record<string, any> = { name: data.name, gender: data.gender };
      const optional = ['dob:date_of_birth', 'state', 'lga', 'ward', 'constituency', 'slogan', 'bio', 'position_unique_id', 'member_role_unique_id', 'running_mate_unique_id', 'contact_office_address', 'contact_phone_number', 'contact_alt_phone_number', 'contact_email'];
      optional.forEach(k => { const [f, p] = k.split(':'); if ((data as any)[f]) payload[p || f] = (data as any)[f]; });
      if (finalImage) { payload.image = finalImage; payload.image_public_id = finalImagePublicId; }
      const sm = [
        { platform: 'facebook', url: data.social_media_facebook },
        { platform: 'twitter', url: data.social_media_twitter },
        { platform: 'instagram', url: data.social_media_instagram },
        { platform: 'youtube', url: data.social_media_youtube },
        { platform: 'linkedin', url: data.social_media_linkedin },
      ].filter(s => s.url);
      if (sm.length) payload.social_media = sm;
      const kf = data.key_facts.filter(x => x.fact); if (kf.length) payload.key_facts = kf;
      const ed = data.education.filter(x => x.institution); if (ed.length) payload.education = ed;
      const ch = data.career_history.filter(x => x.organization); if (ch.length) payload.career_history = ch;
      const po = data.previous_public_offices.filter(x => x.office); if (po.length) payload.previous_public_offices = po;
      const ma = data.manifesto.filter(x => x.title); if (ma.length) payload.manifesto = ma;
      const res = await candidatesService.add(payload, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (res.success) {
        setSuccessMessage('Candidate created successfully'); showAlert('success-alert');
        reset(); setImage(''); setImagePublicId(''); setPendingImageFile(null);
        setSelectedStateId(''); setSelectedLgaId(''); setActiveTab('basic');
        setTimeout(() => router.push('/dashboard/campaign/candidates'), 1500);
      } else { setError(res.message || 'Failed to create candidate'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to create candidate')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Candidate" subtitle="Create a new candidate" />
      <div className="xui-py-1">
        <a onClick={() => router.push('/dashboard/campaign/candidates')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4 xui-mb-2">Fill in the candidate details below. Fields marked with * are required.</p>
        <div className="xui-d-flex xui-grid-gap-0 xui-mb-2" style={{ borderBottom: '2px solid var(--neutral-200)' }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} type="button" className="xui-btn xui-font-sz-85"
              style={{ borderRadius: 0, backgroundColor: 'transparent', marginBottom: '-2px',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--primary-600)' : 'inherit',
                fontWeight: activeTab === tab.key ? 600 : 400 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px', fontSize: '11px',
                backgroundColor: activeTab === tab.key ? 'var(--primary-600)' : 'var(--neutral-300)',
                color: activeTab === tab.key ? 'var(--secondary-700)' : 'var(--neutral-600)' }}>{i + 1}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <form className="xui-form">
          <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <CandidateBasicTab
              register={register} errors={errors}
              dobValue={watch('dob') || ''} onDobChange={val => setValue('dob', val)}
              positions={positions} memberRoles={memberRoles} allCandidates={allCandidates}
              image={image} imagePublicId={imagePublicId}
              onImageFileSelect={(file, preview) => { setPendingImageFile(file); setImage(preview); setImagePublicId(''); }}
              onImageChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); setPendingImageFile(null); }}
              onImageError={msg => { setError(msg); showAlert('error-alert'); }}
              genderRequired positionRequired
            />
          </div>
          <div style={{ display: activeTab === 'location' ? 'block' : 'none' }}>
            <CandidateLocationTab
              register={register} control={control} errors={errors} setValue={setValue}
              states={states} filteredLgas={filteredLgas} filteredWards={filteredWards}
              onStateChange={(_, id) => { setSelectedStateId(id); setSelectedLgaId(''); }}
              onLgaChange={(_, id) => setSelectedLgaId(id)}
              stateRequired
            />
          </div>
          <div style={{ display: activeTab === 'content' ? 'block' : 'none' }}>
            <CandidateContentTab
              register={register} activeSection={activeSection} setActiveSection={setActiveSection} sectionCounts={sectionCounts}
              keyFactFields={keyFactFields as any} appendKeyFact={appendKeyFact} removeKeyFact={removeKeyFact}
              educationFields={educationFields as any} appendEducation={appendEducation} removeEducation={removeEducation}
              careerFields={careerFields as any} appendCareer={appendCareer} removeCareer={removeCareer}
              officeFields={officeFields as any} appendOffice={appendOffice} removeOffice={removeOffice}
              manifestoFields={manifestoFields as any} appendManifesto={appendManifesto} removeManifesto={removeManifesto}
            />
          </div>
          <hr className="xui-my-2" />
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            {prevTab ? (
              <button type="button" onClick={() => setActiveTab(prevTab.key)} className="xui-btn xui-bdr-rad-[4px] xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--neutral-100)', border: '1px solid var(--neutral-300)', color: 'inherit' }}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'transparent', border: '1px solid var(--neutral-300)', color: 'inherit' }}>
                Cancel
              </button>
            )}
            {nextTab ? (
              <button type="button" onClick={handleNext} className="xui-btn xui-bdr-rad-[4px] xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading || uploadingImage} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                {uploadingImage ? 'Uploading image...' : loading ? 'Creating Candidate...' : 'Create Candidate'}
              </button>
            )}
          </div>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddCandidate;
