'use client';
import type { UseFormRegister, FieldErrors, UseFormSetValue, Control } from 'react-hook-form';
import type { CandidateFormData } from './types';
import type { State } from '../../../services/states.service';
import type { Lga } from '../../../services/lgas.service';
import type { Ward } from '../../../services/wards.service';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';

interface Props {
  register: UseFormRegister<CandidateFormData>;
  control: Control<CandidateFormData>;
  errors: FieldErrors<CandidateFormData>;
  setValue: UseFormSetValue<CandidateFormData>;
  states: State[];
  filteredLgas: Lga[];
  filteredWards: Ward[];
  onStateChange: (stateName: string, stateId: string) => void;
  onLgaChange: (lgaName: string, lgaId: string) => void;
  stateRequired?: boolean;
}

const CandidateLocationTab = ({
  register, control, errors, setValue, states, filteredLgas, filteredWards,
  onStateChange, onLgaChange, stateRequired = false,
}: Props) => (
  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Location</p>
      <div className="xui-form-box" {...(errors.state && { 'xui-error': 'true' })}>
        <label htmlFor="state">State{stateRequired && ' *'}</label>
        <select id="state" {...register('state', {
          ...(stateRequired && { required: 'State is required' }),
          onChange: (e) => {
            const stateObj = states.find(s => s.name === e.target.value);
            onStateChange(e.target.value, stateObj?.unique_id || '');
            setValue('lga', '');
            setValue('ward', '');
          },
        })}>
          <option value="">Select state</option>
          {states.map(s => <option key={s.unique_id} value={s.name}>{s.name}</option>)}
        </select>
        {errors.state && <span className="message">{errors.state.message}</span>}
      </div>
      <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
        <div className="xui-form-box">
          <label htmlFor="lga">LGA</label>
          <select id="lga" {...register('lga', {
            onChange: (e) => {
              const lgaObj = filteredLgas.find(l => l.name === e.target.value);
              onLgaChange(e.target.value, lgaObj?.unique_id || '');
              setValue('ward', '');
            },
          })}>
            <option value="">Select LGA</option>
            {filteredLgas.map(l => <option key={l.unique_id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div className="xui-form-box">
          <label htmlFor="ward">Ward</label>
          <select id="ward" {...register('ward')}>
            <option value="">Select ward</option>
            {filteredWards.map(w => <option key={w.unique_id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="xui-form-box">
        <label htmlFor="constituency">Constituency</label>
        <input type="text" id="constituency" placeholder="Enter constituency" {...register('constituency')} />
      </div>
    </div>
    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Contact Information</p>
      <div className="xui-form-box">
        <label htmlFor="contact_office_address">Office Address</label>
        <input type="text" id="contact_office_address" placeholder="Enter office address" {...register('contact_office_address')} />
      </div>
      <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
        <PhoneNumberInput control={control} name="contact_phone_number" label="Phone Number" id="contact_phone_number" />
        <PhoneNumberInput control={control} name="contact_alt_phone_number" label="Alt. Phone" id="contact_alt_phone_number" placeholder="Alternative phone" />
      </div>
      <div className="xui-form-box">
        <label htmlFor="contact_email">Contact Email</label>
        <input type="email" id="contact_email" placeholder="Enter contact email" {...register('contact_email')} />
      </div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mt-2 xui-mb-1 xui-opacity-6">Social Media</p>
      <div className="xui-form-box">
        <label htmlFor="social_media_facebook">Facebook URL</label>
        <input type="url" id="social_media_facebook" placeholder="https://facebook.com/..." {...register('social_media_facebook')} />
      </div>
      <div className="xui-form-box">
        <label htmlFor="social_media_twitter">Twitter / X URL</label>
        <input type="url" id="social_media_twitter" placeholder="https://x.com/..." {...register('social_media_twitter')} />
      </div>
      <div className="xui-form-box">
        <label htmlFor="social_media_instagram">Instagram URL</label>
        <input type="url" id="social_media_instagram" placeholder="https://instagram.com/..." {...register('social_media_instagram')} />
      </div>
      <div className="xui-form-box">
        <label htmlFor="social_media_youtube">YouTube URL</label>
        <input type="url" id="social_media_youtube" placeholder="https://youtube.com/..." {...register('social_media_youtube')} />
      </div>
      <div className="xui-form-box">
        <label htmlFor="social_media_linkedin">LinkedIn URL</label>
        <input type="url" id="social_media_linkedin" placeholder="https://linkedin.com/..." {...register('social_media_linkedin')} />
      </div>
    </div>
  </div>
);

export default CandidateLocationTab;
