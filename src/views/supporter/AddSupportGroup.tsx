'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, ArrowLeft } from '@carbon/icons-react';
import { Navbar } from '../../components/layout';
import { Alert, showAlert } from '../../components/common';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage } from '../../utils/formatters';
import supportGroupsService from '../../services/supportGroups.service';
import SupportGroupLeaderTab from './support-group-form/SupportGroupLeaderTab';
import SupportGroupBasicTab from './support-group-form/SupportGroupBasicTab';
import SupportGroupLocationTab from './support-group-form/SupportGroupLocationTab';
import SupportGroupAccountTab from './support-group-form/SupportGroupAccountTab';
import { TABS, type SupportGroupFormData, type Tab } from './support-group-form/types';

const AddSupportGroup = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [activeTab, setActiveTab] = useState<Tab>('leader');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statesCovered, setStatesCovered] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const accessIds = getAccessIds('supporter', 'support-groups');

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<SupportGroupFormData>({
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

  const tabIndex = TABS.findIndex(t => t.key === activeTab);
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null;
  const nextTab = tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null;

  const TAB_REQUIRED_FIELDS: Record<Tab, (keyof SupportGroupFormData)[]> = {
    leader: ['firstname', 'lastname', 'email', 'phone_number', 'gender', 'date_of_birth', 'password', 'confirmPassword'],
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

  const toggleStateCovered = (name: string) => {
    setStatesCovered(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const onSubmit = async (data: SupportGroupFormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const params = { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id };
      const response = await supportGroupsService.add(
        {
          firstname: data.firstname,
          ...(data.middlename && { middlename: data.middlename }),
          lastname: data.lastname,
          email: data.email,
          phone_number: data.phone_number,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          ...(data.country && { country: data.country }),
          password: data.password,
          confirmPassword: data.confirmPassword,
          support_group_type_unique_id: data.support_group_type_unique_id,
          name: data.name,
          scope_option: data.scope_option,
          ...(statesCovered.length > 0 && { states_covered: statesCovered }),
          ...(data.zone && { zone: data.zone }),
          ...(data.state && { state: data.state }),
          ...(data.lga && { lga: data.lga }),
          ...(data.ward && { ward: data.ward }),
          ...(data.constituency && { constituency: data.constituency }),
          ...(data.contact_name && { contact_name: data.contact_name }),
          ...(data.contact_office_address && { contact_office_address: data.contact_office_address }),
          ...(data.contact_phone_number && { contact_phone_number: data.contact_phone_number }),
          ...(data.contact_alt_phone_number && { contact_alt_phone_number: data.contact_alt_phone_number }),
          ...(data.contact_email && { contact_email: data.contact_email }),
          ...(data.account_bank && { account_bank: data.account_bank }),
          ...(data.account_name && { account_name: data.account_name }),
          ...(data.account_number && { account_number: data.account_number }),
          ...(data.account_other && { account_other: data.account_other }),
          ...(image && { image, image_public_id: imagePublicId }),
        },
        params
      );
      if (response.success) {
        const hasAccountDetails = data.account_bank || data.account_name || data.account_number || data.account_other;
        if (hasAccountDetails && response.data?.unique_id) {
          try {
            await supportGroupsService.adminEditAccountInfo(
              {
                unique_id: response.data.unique_id,
                ...(data.account_number && { account_number: data.account_number }),
                ...(data.account_name && { account_name: data.account_name }),
                ...(data.account_bank && { account_bank: data.account_bank }),
                ...(data.account_other && { account_other: data.account_other }),
              },
              params
            );
          } catch (err) { console.error('Failed to save account information:', err); }
        }
        setSuccessMessage('Support group added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/support-groups'), 1500);
      } else { setError(response.message || 'Failed to add support group'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add support group')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add Support Group" subtitle="Register a new support group" />
      <div className="xui-py-1">
        <a onClick={() => router.push('/dashboard/supporter/support-groups')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4 xui-mb-2">Fill in the support group details below. Fields marked with * are required.</p>

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
          <div style={{ display: activeTab === 'leader' ? 'block' : 'none' }}>
            <SupportGroupLeaderTab
              register={register} control={control} errors={errors}
              dobValue={watch('date_of_birth') || ''}
              onDobChange={(val) => setValue('date_of_birth', val, { shouldValidate: true })}
              passwordValue={watch('password') || ''}
            />
          </div>

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
            <SupportGroupLocationTab
              register={register} control={control} errors={errors} setValue={setValue}
            />
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
                {loading ? 'Creating Support Group...' : 'Create Support Group'}
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

export default AddSupportGroup;
