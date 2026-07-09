'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ChevronLeft, ChevronRight, ArrowLeft } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { Alert, showAlert } from '../../components/common';
import { FormSkeleton } from '../../components/skeletons';
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
import { TABS, type CandidateFormData, type Tab, type ContentSection, type KeyFact, type EducationItem, type CareerItem, type OfficeItem, type ManifestoItem } from './candidate-form/types';

const EditCandidate = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [activeSection, setActiveSection] = useState<ContentSection>('key_facts');
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);
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

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<CandidateFormData>({
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

  const filteredLgas = selectedStateId ? lgas.filter(l => l.state_unique_id === selectedStateId) : lgas;
  const filteredWards = selectedLgaId ? wards.filter(w => w.lga_unique_id === selectedLgaId) : wards;
  const tabIndex = TABS.findIndex(t => t.key === activeTab);
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null;
  const nextTab = tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null;


  const sectionCounts = {
    key_facts: keyFactFields.length, education: educationFields.length,
    career_history: careerFields.length, previous_public_offices: officeFields.length, manifesto: manifestoFields.length,
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      if (!moduleId || !subModuleId) return;
      try {
        const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
        const [pRes, rRes, aRes] = await Promise.all([
          positionsService.getAll({ size: 100, ...params }),
          memberRolesService.getAll({ size: 100, ...params }),
          candidatesService.publicGetAll({ size: 500, module_unique_id: moduleId }),
        ]);
        if (pRes.success && pRes.data) setPositions(Array.isArray(pRes.data) ? pRes.data : pRes.data.rows || []);
        if (rRes.success && rRes.data) setMemberRoles(Array.isArray(rRes.data) ? rRes.data : rRes.data.rows || []);
        if (aRes.success && aRes.data) setAllCandidates(Array.isArray(aRes.data) ? aRes.data : (aRes.data as any).rows || []);
      } catch {}
    };
    loadDropdowns();
  }, [moduleId, subModuleId]);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
        const cRes = await candidatesService.getOne(id, params);
        if (cRes.success && cRes.data) {
          const c = cRes.data;
          setCandidate(c);
          setImage(c.image || '');
          setImagePublicId(c.image_public_id || '');
          const sm = (c.social_media || []) as Array<{ platform: string; url: string }>;
          const getSm = (p: string) => sm.find(s => s.platform === p)?.url || '';
          reset({
            name: c.name || '', gender: c.gender || '',
            dob: c.date_of_birth ? c.date_of_birth.split('T')[0] : '',
            state: '', lga: '', ward: '',
            constituency: c.constituency || '', slogan: c.slogan || '', bio: c.bio || '',
            position_unique_id: '', member_role_unique_id: '', running_mate_unique_id: '',
            contact_office_address: c.contact_office_address || '',
            contact_phone_number: c.contact_phone_number || '',
            contact_alt_phone_number: c.contact_alt_phone_number || '',
            contact_email: c.contact_email || '',
            social_media_facebook: getSm('facebook'), social_media_twitter: getSm('twitter'),
            social_media_instagram: getSm('instagram'), social_media_youtube: getSm('youtube'),
            social_media_linkedin: getSm('linkedin'),
            key_facts: (c.key_facts as KeyFact[] | null) || [],
            education: (c.education as EducationItem[] | null) || [],
            career_history: (c.career_history as CareerItem[] | null) || [],
            previous_public_offices: (c.previous_public_offices as OfficeItem[] | null) || [],
            manifesto: (c.manifesto as ManifestoItem[] | null) || [],
          });
        } else { setError('Candidate not found'); showAlert('error-alert'); }
      } catch (err: any) { setError(extractErrorMessage(err, 'Failed to load candidate')); showAlert('error-alert'); }
      finally { setLoadingItem(false); }
    };
    fetchCandidate();
  }, [id, moduleId, subModuleId, reset]);

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
    if (!candidate) return;
    if (positions.length > 0) setValue('position_unique_id', candidate.position_unique_id || '');
    if (memberRoles.length > 0) setValue('member_role_unique_id', (candidate as any).member_role_unique_id || '');
    if (allCandidates.length > 0) setValue('running_mate_unique_id', candidate.running_mate_unique_id || '');
    if (states.length > 0 && lgas.length > 0) {
      setValue('state', candidate.state || '');
      setValue('lga', candidate.lga || '');
      setValue('ward', candidate.ward || '');
      const stateObj = states.find(s => s.name === candidate.state);
      if (stateObj) {
        setSelectedStateId(stateObj.unique_id);
        const lgaObj = lgas.find(l => l.name === candidate.lga && l.state_unique_id === stateObj.unique_id);
        if (lgaObj) setSelectedLgaId(lgaObj.unique_id);
      }
    }
  }, [candidate, states, lgas, positions, memberRoles, allCandidates, setValue]);

  const onSubmit = async (data: CandidateFormData) => {
    if (!moduleId || !subModuleId || !id || !candidate) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    let finalImage = image, finalImagePublicId = imagePublicId;
    if (pendingImageFile) {
      setUploadingImage(true);
      try {
        const r = await cloudinaryUpload(pendingImageFile, 'ndccampaign/candidates');
        finalImage = r.secure_url; finalImagePublicId = r.public_id;
        setImage(r.secure_url); setImagePublicId(r.public_id); setPendingImageFile(null);
      } catch { setError('Failed to upload image'); showAlert('error-alert'); setUploadingImage(false); setLoading(false); return; }
      setUploadingImage(false);
    }
    try {
      const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
      const promises: Promise<any>[] = [];
      promises.push(candidatesService.editDetails({
        unique_id: id, name: data.name,
        ...(data.gender && { gender: data.gender }),
        ...(data.dob && { date_of_birth: data.dob }),
        ...(data.slogan && { slogan: data.slogan }),
      }, params));
      promises.push(candidatesService.editBio({ unique_id: id, ...(data.bio && { bio: data.bio }) }, params));
      if (data.state) {
        promises.push(candidatesService.editLocation({
          unique_id: id, state: data.state,
          ...(data.lga && { lga: data.lga }),
          ...(data.ward && { ward: data.ward }),
          ...(data.constituency && { constituency: data.constituency }),
        }, params));
      }
      if (data.contact_office_address || data.contact_phone_number || data.contact_alt_phone_number || data.contact_email) {
        promises.push(candidatesService.editContactInformation({
          unique_id: id,
          ...(data.contact_office_address && { contact_office_address: data.contact_office_address }),
          ...(data.contact_phone_number && { contact_phone_number: data.contact_phone_number }),
          ...(data.contact_alt_phone_number && { contact_alt_phone_number: data.contact_alt_phone_number }),
          ...(data.contact_email && { contact_email: data.contact_email }),
        }, params));
      }
      const sm = [
        { platform: 'facebook', url: data.social_media_facebook },
        { platform: 'twitter', url: data.social_media_twitter },
        { platform: 'instagram', url: data.social_media_instagram },
        { platform: 'youtube', url: data.social_media_youtube },
        { platform: 'linkedin', url: data.social_media_linkedin },
      ].filter(s => s.url);
      const contentsPayload: Record<string, any> = { unique_id: id };
      if (sm.length) contentsPayload.social_media = sm;
      const kf = data.key_facts.filter(x => x.fact); if (kf.length) contentsPayload.key_facts = kf;
      const ed = data.education.filter(x => x.institution); if (ed.length) contentsPayload.education = ed;
      const ch = data.career_history.filter(x => x.organization); if (ch.length) contentsPayload.career_history = ch;
      const po = data.previous_public_offices.filter(x => x.office); if (po.length) contentsPayload.previous_public_offices = po;
      const ma = data.manifesto.filter(x => x.title); if (ma.length) contentsPayload.manifesto = ma;
      if (Object.keys(contentsPayload).length > 1) promises.push(candidatesService.editContents(contentsPayload as { unique_id: string }, params));
      if (data.position_unique_id && data.position_unique_id !== (candidate.position_unique_id || '')) {
        promises.push(candidatesService.editPosition({ unique_id: id, position_unique_id: data.position_unique_id }, params));
      }
      if (data.running_mate_unique_id !== (candidate.running_mate_unique_id || '')) {
        promises.push(candidatesService.editRunningMate({ unique_id: id, ...(data.running_mate_unique_id && { running_mate_unique_id: data.running_mate_unique_id }) }, params));
      }
      if (finalImage !== (candidate.image || '') || finalImagePublicId !== (candidate.image_public_id || '')) {
        promises.push(candidatesService.editImage({ unique_id: id, image: finalImage, image_public_id: finalImagePublicId }, params));
      }
      const results = await Promise.all(promises);
      const failed = results.find(r => !r.success);
      if (failed) { setError(failed.message || 'Failed to update candidate'); showAlert('error-alert'); }
      else { setSuccessMessage('Candidate updated successfully'); showAlert('success-alert'); setTimeout(() => router.back(), 1500); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update candidate')); showAlert('error-alert'); }
    finally { setLoading(false); }
  };

  if (loadingItem) return (
    <div>
      <Navbar title="Edit Candidate" subtitle="Update candidate information" />
      <div className="xui-py-1"><FormSkeleton /></div>
    </div>
  );

  return (
    <div>
      <Navbar title="Edit Candidate" subtitle="Update candidate information" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4 xui-mb-2">Update the candidate details below. Fields marked with * are required.</p>
        <div className="xui-d-flex xui-grid-gap-0 xui-mb-2" style={{ borderBottom: '2px solid var(--neutral-200)' }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className="xui-btn xui-font-sz-85"
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
              currentCandidateId={id}
              image={image} imagePublicId={imagePublicId}
              onImageFileSelect={(file, preview) => { setPendingImageFile(file); setImage(preview); setImagePublicId(''); }}
              onImageChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); setPendingImageFile(null); }}
              onImageError={msg => { setError(msg); showAlert('error-alert'); }}
            />
          </div>
          <div style={{ display: activeTab === 'location' ? 'block' : 'none' }}>
            <CandidateLocationTab
              register={register} control={control} errors={errors} setValue={setValue}
              states={states} filteredLgas={filteredLgas} filteredWards={filteredWards}
              onStateChange={(_, stateId) => { setSelectedStateId(stateId); setSelectedLgaId(''); }}
              onLgaChange={(_, lgaId) => setSelectedLgaId(lgaId)}
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
            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
              <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading || uploadingImage} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                {uploadingImage ? 'Uploading image...' : loading ? 'Saving...' : 'Save Changes'}
              </button>
              {nextTab && (
                <button type="button" onClick={() => setActiveTab(nextTab.key)} className="xui-btn xui-bdr-rad-[4px] xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--neutral-100)', border: '1px solid var(--neutral-300)', color: 'inherit' }}>
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditCandidate;
