'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, ArrowLeft } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { Alert, showAlert, ErrorState } from '../../components/common';
import { FormSkeleton } from '../../components/skeletons';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage, toE164 } from '../../utils/formatters';
import supportGroupsService from '../../services/supportGroups.service';
import type { SupportGroup } from '../../services/supportGroups.service';
import SupportGroupBasicTab from './support-group-form/SupportGroupBasicTab';
import SupportGroupLocationTab from './support-group-form/SupportGroupLocationTab';
import SupportGroupAccountTab from './support-group-form/SupportGroupAccountTab';
import { type SupportGroupFormData } from './support-group-form/types';

type EditTab = 'basic' | 'location' | 'account';

const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'location', label: 'Location & Contact' },
  { key: 'account', label: 'Account Details' },
];

const EditSupportGroup = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [activeTab, setActiveTab] = useState<EditTab>('basic');
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<SupportGroup | null>(null);
  const [statesCovered, setStatesCovered] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const accessIds = getAccessIds('supporter', 'support-groups');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, control, handleSubmit, watch, setValue, trigger, reset, formState: { errors } } = useForm<SupportGroupFormData>({
    defaultValues: {
      firstname: '', middlename: '', lastname: '', email: '', phone_number: '',
      gender: '', date_of_birth: '', country: '', password: '', confirmPassword: '',
      support_group_type_unique_id: '', name: '', scope_option: '',
      zone: '', state: '', lga: '', ward: '', constituency: '',
      contact_name: '', contact_office_address: '', contact_phone_number: '',
      contact_alt_phone_number: '', contact_email: '',
      account_bank: '', account_name: '', account_number: '', account_other: '',
    },
  });

  const scopeOption = watch('scope_option');

  const tabIndex = EDIT_TABS.findIndex(t => t.key === activeTab);
  const prevTab = tabIndex > 0 ? EDIT_TABS[tabIndex - 1] : null;
  const nextTab = tabIndex < EDIT_TABS.length - 1 ? EDIT_TABS[tabIndex + 1] : null;

  const TAB_REQUIRED_FIELDS: Record<EditTab, (keyof SupportGroupFormData)[]> = {
    basic: ['name', 'support_group_type_unique_id', 'scope_option'],
    location: [],
    account: [],
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

  useEffect(() => {
    if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
    let cancelled = false;
    supportGroupsService.getOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => {
        if (cancelled || !res.success || !res.data) return;
        const d = res.data;
        setItem(d);
        setImage(d.image || '');
        setImagePublicId(d.image_public_id || '');
        setStatesCovered((d.states_covered || []).map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean));
        reset({
          firstname: '', middlename: '', lastname: '', email: '', phone_number: '',
          gender: '', date_of_birth: '', country: '', password: '', confirmPassword: '',
          support_group_type_unique_id: d.support_group_type_unique_id || '',
          name: d.name || '',
          scope_option: d.scope_option || '',
          zone: d.zone || '', state: d.state || '', lga: d.lga || '', ward: d.ward || '',
          constituency: d.constituency || '',
          contact_name: d.contact_name || '',
          contact_office_address: d.contact_office_address || '',
          contact_phone_number: toE164(d.contact_phone_number),
          contact_alt_phone_number: toE164(d.contact_alt_phone_number),
          contact_email: d.contact_email || '',
          account_bank: d.account_bank || '', account_name: d.account_name || '',
          account_number: d.account_number || '', account_other: d.account_other || '',
        });
      })
      .catch(err => { if (!cancelled) setError(extractErrorMessage(err, 'Failed to load support group')); })
      .finally(() => { if (!cancelled) setLoadingItem(false); });
    return () => { cancelled = true; };
  }, [id, moduleId, subModuleId, reset]);

  const toggleStateCovered = (name: string) => {
    setStatesCovered(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const onSubmit = async (data: SupportGroupFormData) => {
    if (!moduleId || !subModuleId || !id || !item) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const params = { module_unique_id: moduleId, sub_module_unique_id: subModuleId };
      const promises: Promise<any>[] = [];

      promises.push(supportGroupsService.adminEditDetails({
        unique_id: id,
        name: data.name,
        scope_option: data.scope_option,
        ...(statesCovered.length > 0 && { states_covered: statesCovered }),
      }, params));

      if (data.support_group_type_unique_id && data.support_group_type_unique_id !== (item.support_group_type_unique_id || '')) {
        promises.push(supportGroupsService.adminEditType({ unique_id: id, support_group_type_unique_id: data.support_group_type_unique_id }, params));
      }

      const demographyChanged = data.zone !== (item.zone || '') || data.state !== (item.state || '')
        || data.lga !== (item.lga || '') || data.ward !== (item.ward || '') || data.constituency !== (item.constituency || '');
      if (demographyChanged) {
        promises.push(supportGroupsService.adminEditDemography({
          unique_id: id,
          ...(data.zone && { zone: data.zone }),
          ...(data.state && { state: data.state }),
          ...(data.lga && { lga: data.lga }),
          ...(data.ward && { ward: data.ward }),
          ...(data.constituency && { constituency: data.constituency }),
        }, params));
      }

      const contactChanged = data.contact_name !== (item.contact_name || '')
        || data.contact_office_address !== (item.contact_office_address || '')
        || data.contact_phone_number !== toE164(item.contact_phone_number)
        || data.contact_alt_phone_number !== toE164(item.contact_alt_phone_number)
        || data.contact_email !== (item.contact_email || '');
      if (contactChanged) {
        promises.push(supportGroupsService.adminEditContactInfo({
          unique_id: id,
          ...(data.contact_name && { contact_name: data.contact_name }),
          ...(data.contact_office_address && { contact_office_address: data.contact_office_address }),
          ...(data.contact_phone_number && { contact_phone_number: data.contact_phone_number }),
          ...(data.contact_alt_phone_number && { contact_alt_phone_number: data.contact_alt_phone_number }),
          ...(data.contact_email && { contact_email: data.contact_email }),
        }, params));
      }

      const accountChanged = data.account_bank !== (item.account_bank || '')
        || data.account_name !== (item.account_name || '')
        || data.account_number !== (item.account_number || '')
        || data.account_other !== (item.account_other || '');
      if (accountChanged) {
        promises.push(supportGroupsService.adminEditAccountInfo({
          unique_id: id,
          ...(data.account_number && { account_number: data.account_number }),
          ...(data.account_name && { account_name: data.account_name }),
          ...(data.account_bank && { account_bank: data.account_bank }),
          ...(data.account_other && { account_other: data.account_other }),
        }, params));
      }

      if (image && (image !== (item.image || '') || imagePublicId !== (item.image_public_id || ''))) {
        promises.push(supportGroupsService.adminEditImage({ unique_id: id, image, image_public_id: imagePublicId }, params));
      }

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.success);
      if (failed) { setError(failed.message || 'Failed to update support group'); showAlert('error-alert'); }
      else {
        setSuccessMessage('Support group updated successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-groups'), 1500);
      }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update support group')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (
    <div>
      <Navbar title="Edit Support Group" subtitle="Update support group details" />
      <div className="xui-py-1"><FormSkeleton fields={6} /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Edit Support Group" subtitle="Update support group details" />
      <div className="xui-py-1">
        <ErrorState title="Support group not found" message={error || 'This support group could not be loaded or you do not have access.'} />
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Edit Support Group" subtitle="Update support group details" />
      <div className="xui-py-1">
        <a onClick={() => router.push('/dashboard/supporter/support-groups')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4 xui-mb-2">Update the support group details below. Only changed sections are saved.</p>

        <div className="xui-d-flex xui-grid-gap-0 xui-mb-2" style={{ borderBottom: '2px solid var(--neutral-200)' }}>
          {EDIT_TABS.map((tab, i) => (
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
            <SupportGroupBasicTab
              register={register} errors={errors} control={control} setValue={setValue} accessIds={accessIds} scopeOption={scopeOption}
              statesCovered={statesCovered} onToggleStateCovered={toggleStateCovered}
              image={image} imagePublicId={imagePublicId}
              onImageChange={(url, pubId) => { setImage(url); setImagePublicId(pubId); }}
              onImageError={(msg) => { setError(msg); showAlert('error-alert'); }}
            />
          </div>

          <div style={{ display: activeTab === 'location' ? 'block' : 'none' }}>
            <SupportGroupLocationTab register={register} control={control} errors={errors} setValue={setValue} />
          </div>

          <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
            <SupportGroupAccountTab register={register} errors={errors} />
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
              <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
                {loading ? 'Updating...' : 'Update Support Group'}
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

export default EditSupportGroup;
