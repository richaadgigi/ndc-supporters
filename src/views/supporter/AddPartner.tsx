'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Close } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import partnersService from '../../services/partners.service';
import { Alert, showAlert, PhoneNumberInput } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface ChipInputProps {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

const ChipInput = ({ id, label, placeholder, values, onChange, error }: ChipInputProps) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const parts = draft.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...values];
    parts.forEach(p => { if (!next.includes(p)) next.push(p); });
    onChange(next);
    setDraft('');
  };

  return (
    <div className="xui-form-box" {...(error && { 'xui-error': 'true' })}>
      <label htmlFor={id}>{label}</label>
      <input
        type="text"
        id={id}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
        onBlur={commit}
      />
      {values.length > 0 && (
        <div className="xui-d-flex xui-flex-wrap-wrap xui-grid-gap-half xui-mt-half">
          {values.map((v) => (
            <span key={v} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-80 xui-py-half xui-px-1 xui-bdr-rad-half" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
              {v}
              <span className="xui-cursor-pointer xui-d-inline-flex" onClick={() => onChange(values.filter(x => x !== v))}>
                <Close size={14} />
              </span>
            </span>
          ))}
        </div>
      )}
      {error && <span className="message">{error}</span>}
    </div>
  );
};

interface FormData {
  partner_type: string;
  organisation_name: string;
  year_established: string;
  cac_number: string;
  website: string;
  contact_name: string;
  role: string;
  phone_number: string;
  email: string;
  country: string;
  state: string;
  lga: string;
  where_do_you_operate: string;
  what_does_organisation_do: string;
  what_would_you_want_to_do_together: string;
}

const AddPartner = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [charterAreas, setCharterAreas] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [charterError, setCharterError] = useState('');

  const accessIds = getAccessIds('supporter', 'partners');

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      partner_type: '', organisation_name: '', year_established: '', cac_number: '', website: '',
      contact_name: '', role: '', phone_number: '', email: '', country: 'Nigeria', state: '', lga: '',
      where_do_you_operate: '', what_does_organisation_do: '', what_would_you_want_to_do_together: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (charterAreas.length === 0) { setCharterError('Add at least one charter area'); return; }
    setCharterError('');
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }

    setLoading(true); setError('');
    try {
      const response = await partnersService.add({
        partner_type: data.partner_type.trim(),
        ...(data.organisation_name.trim() && { organisation_name: data.organisation_name.trim() }),
        year_established: Number(data.year_established),
        ...(data.cac_number.trim() && { cac_number: data.cac_number.trim() }),
        ...(data.website.trim() && { website: data.website.trim() }),
        ...(socialLinks.length > 0 && { social_links: socialLinks }),
        contact_name: data.contact_name.trim(),
        role: data.role.trim(),
        phone_number: data.phone_number,
        email: data.email.trim(),
        country: data.country.trim(),
        ...(data.state.trim() && { state: data.state.trim() }),
        ...(data.lga.trim() && { lga: data.lga.trim() }),
        where_do_you_operate: data.where_do_you_operate.trim(),
        what_does_organisation_do: data.what_does_organisation_do.trim(),
        charter_areas: charterAreas,
        what_would_you_want_to_do_together: data.what_would_you_want_to_do_together.trim(),
      }, { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });

      if (response.success) {
        setSuccessMessage('Partner added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter/partners'), 1500);
      } else { setError(response.message || 'Failed to add partner'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add partner')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <Navbar title="Add Partner" subtitle="Register a new partnership" />
      <div className="xui-py-1">
        <a onClick={() => router.push('/dashboard/supporter/partners')} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4 xui-mb-2">Fill in the partnership details below. Fields marked with * are required.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Organisation</p>

              <div className="xui-form-box" {...(errors.partner_type && { 'xui-error': 'true' })}>
                <label htmlFor="partner_type">Partner Type *</label>
                <input type="text" id="partner_type" placeholder="e.g. NGO, Business, Institution"
                  {...register('partner_type', { required: 'Partner type is required', maxLength: { value: 200, message: 'Maximum 200 characters' } })} />
                {errors.partner_type && <span className="message">{errors.partner_type.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="organisation_name">Organisation Name</label>
                <input type="text" id="organisation_name" placeholder="Enter organisation name"
                  {...register('organisation_name', { maxLength: { value: 200, message: 'Maximum 200 characters' } })} />
              </div>

              <div className="xui-form-box" {...(errors.year_established && { 'xui-error': 'true' })}>
                <label htmlFor="year_established">Year Established *</label>
                <input type="number" id="year_established" placeholder={`e.g. ${currentYear - 10}`}
                  {...register('year_established', {
                    required: 'Year established is required',
                    min: { value: 1900, message: 'Must be 1900 or later' },
                    max: { value: currentYear, message: `Cannot be later than ${currentYear}` },
                  })} />
                {errors.year_established && <span className="message">{errors.year_established.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="cac_number">CAC Number</label>
                <input type="text" id="cac_number" placeholder="Enter CAC registration number"
                  {...register('cac_number', { maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
              </div>

              <div className="xui-form-box">
                <label htmlFor="website">Website</label>
                <input type="url" id="website" placeholder="https://example.com"
                  {...register('website', { maxLength: { value: 255, message: 'Maximum 255 characters' } })} />
              </div>

              <ChipInput id="social_links" label="Social Links" placeholder="Paste a link and press Enter" values={socialLinks} onChange={setSocialLinks} />
            </div>

            <div>
              <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Contact Person</p>

              <div className="xui-form-box" {...(errors.contact_name && { 'xui-error': 'true' })}>
                <label htmlFor="contact_name">Contact Name *</label>
                <input type="text" id="contact_name" placeholder="Enter contact person's name"
                  {...register('contact_name', { required: 'Contact name is required', maxLength: { value: 300, message: 'Maximum 300 characters' } })} />
                {errors.contact_name && <span className="message">{errors.contact_name.message}</span>}
              </div>

              <div className="xui-form-box" {...(errors.role && { 'xui-error': 'true' })}>
                <label htmlFor="role">Role *</label>
                <input type="text" id="role" placeholder="e.g. Executive Director"
                  {...register('role', { required: 'Role is required', maxLength: { value: 200, message: 'Maximum 200 characters' } })} />
                {errors.role && <span className="message">{errors.role.message}</span>}
              </div>

              <PhoneNumberInput control={control} name="phone_number" label="Phone Number" id="phone_number" required />

              <div className="xui-form-box" {...(errors.email && { 'xui-error': 'true' })}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" placeholder="Enter email address"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
                {errors.email && <span className="message">{errors.email.message}</span>}
              </div>

              <div className="xui-form-box" {...(errors.country && { 'xui-error': 'true' })}>
                <label htmlFor="country">Country *</label>
                <input type="text" id="country" placeholder="Enter country"
                  {...register('country', { required: 'Country is required', maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
                {errors.country && <span className="message">{errors.country.message}</span>}
              </div>

              <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-1">
                <div className="xui-form-box">
                  <label htmlFor="state">State</label>
                  <input type="text" id="state" placeholder="Enter state"
                    {...register('state', { maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
                </div>

                <div className="xui-form-box">
                  <label htmlFor="lga">LGA</label>
                  <input type="text" id="lga" placeholder="Enter LGA"
                    {...register('lga', { maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
                </div>
              </div>
            </div>
          </div>

          <hr className="xui-my-2" />
          <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Partnership</p>

          <div className="xui-form-box" {...(errors.where_do_you_operate && { 'xui-error': 'true' })}>
            <label htmlFor="where_do_you_operate">Where Do You Operate *</label>
            <input type="text" id="where_do_you_operate" placeholder="e.g. Bayelsa State, National, West Africa"
              {...register('where_do_you_operate', { required: 'This field is required', maxLength: { value: 100, message: 'Maximum 100 characters' } })} />
            {errors.where_do_you_operate && <span className="message">{errors.where_do_you_operate.message}</span>}
          </div>

          <div className="xui-form-box" {...(errors.what_does_organisation_do && { 'xui-error': 'true' })}>
            <label htmlFor="what_does_organisation_do">What Does The Organisation Do *</label>
            <textarea id="what_does_organisation_do" rows={4} placeholder="Describe what the organisation does"
              {...register('what_does_organisation_do', {
                required: 'This field is required',
                minLength: { value: 5, message: 'Minimum 5 characters' },
                maxLength: { value: 1000, message: 'Maximum 1000 characters' },
              })} />
            {errors.what_does_organisation_do && <span className="message">{errors.what_does_organisation_do.message}</span>}
          </div>

          <ChipInput id="charter_areas" label="Charter Areas *" placeholder="Type an area and press Enter" values={charterAreas} onChange={(v) => { setCharterAreas(v); if (v.length > 0) setCharterError(''); }} error={charterError} />

          <div className="xui-form-box" {...(errors.what_would_you_want_to_do_together && { 'xui-error': 'true' })}>
            <label htmlFor="what_would_you_want_to_do_together">What Would You Want To Do Together *</label>
            <textarea id="what_would_you_want_to_do_together" rows={4} placeholder="Describe the proposed collaboration"
              {...register('what_would_you_want_to_do_together', {
                required: 'This field is required',
                minLength: { value: 5, message: 'Minimum 5 characters' },
                maxLength: { value: 1000, message: 'Maximum 1000 characters' },
              })} />
            {errors.what_would_you_want_to_do_together && <span className="message">{errors.what_would_you_want_to_do_together.message}</span>}
          </div>

          <hr className="xui-my-2" />
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <button type="button" onClick={() => router.back()} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'transparent', border: '1px solid var(--neutral-300)', color: 'inherit' }} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="xui-btn xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
              {loading ? 'Adding...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddPartner;
