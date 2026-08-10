'use client';
import { useState, useEffect } from 'react';
import { useWatch, type UseFormRegister, type FieldErrors, type UseFormSetValue, type Control } from 'react-hook-form';
import type { SupportGroupFormData } from './types';
import zonesService from '../../../services/zones.service';
import statesService from '../../../services/states.service';
import lgasService from '../../../services/lgas.service';
import wardsService from '../../../services/wards.service';
import type { Zone } from '../../../services/zones.service';
import type { State } from '../../../services/states.service';
import type { Lga } from '../../../services/lgas.service';
import type { Ward } from '../../../services/wards.service';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import { sortAlphabetically } from '../../../utils/formatters';

const unwrap = (res: any): any[] => (res?.success && res.data ? (Array.isArray(res.data) ? res.data : res.data.rows || []) : []);

interface Props {
  register: UseFormRegister<SupportGroupFormData>;
  control: Control<SupportGroupFormData>;
  errors: FieldErrors<SupportGroupFormData>;
  setValue: UseFormSetValue<SupportGroupFormData>;
}

const SupportGroupLocationTab = ({ register, control, errors, setValue }: Props) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [stateId, setStateId] = useState('');
  const [lgaId, setLgaId] = useState('');

  const zoneValue = useWatch({ control, name: 'zone' });
  const stateValue = useWatch({ control, name: 'state' });
  const lgaValue = useWatch({ control, name: 'lga' });
  const wardValue = useWatch({ control, name: 'ward' });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await zonesService.publicGetAll({ size: 100 });
        setZones(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to load zones:', err); }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await statesService.publicGetAll({ size: 1000, ...(zoneId && { zone_unique_id: zoneId }) });
        setStates(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to load states:', err); }
    };
    fetchStates();
  }, [zoneId]);

  useEffect(() => {
    if (!stateId) { setLgas([]); return; }
    const fetchLgas = async () => {
      try {
        const res = await lgasService.publicGetAll({ size: 1000, state_unique_id: stateId });
        setLgas(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to fetch LGAs:', err); }
    };
    fetchLgas();
  }, [stateId]);

  useEffect(() => {
    if (!lgaId) { setWards([]); return; }
    const fetchWards = async () => {
      try {
        const res = await wardsService.publicGetAll({ size: 1000, lga_unique_id: lgaId });
        setWards(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to fetch wards:', err); }
    };
    fetchWards();
  }, [lgaId]);

  useEffect(() => {
    if (!zoneValue || zones.length === 0) return;
    const match = zones.find(z => z.name === zoneValue);
    if (match && match.unique_id !== zoneId) setZoneId(match.unique_id);
    setValue('zone', zoneValue);
  }, [zoneValue, zones]);

  useEffect(() => {
    if (!stateValue || states.length === 0) return;
    const match = states.find(s => s.name === stateValue);
    if (match && match.unique_id !== stateId) setStateId(match.unique_id);
    setValue('state', stateValue);
  }, [stateValue, states]);

  useEffect(() => {
    if (!lgaValue || lgas.length === 0) return;
    const match = lgas.find(l => l.name === lgaValue);
    if (match && match.unique_id !== lgaId) setLgaId(match.unique_id);
    setValue('lga', lgaValue);
  }, [lgaValue, lgas]);

  useEffect(() => {
    if (!wardValue || wards.length === 0) return;
    setValue('ward', wardValue);
  }, [wardValue, wards]);

  return (
    <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
      <div>
        <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Location</p>

        <div className="xui-form-box">
          <label htmlFor="zone">Zone</label>
          <select id="zone" {...register('zone', {
            onChange: (e) => {
              setZoneId(zones.find(z => z.name === e.target.value)?.unique_id || '');
              setStateId(''); setLgaId('');
              setValue('state', ''); setValue('lga', ''); setValue('ward', '');
            },
          })}>
            <option value="">Select zone</option>
            {zones.map(z => <option key={z.unique_id} value={z.name}>{z.name}</option>)}
          </select>
        </div>

        <div className="xui-form-box" {...(errors.state && { 'xui-error': 'true' })}>
          <label htmlFor="state">State</label>
          <select id="state" {...register('state', {
            onChange: (e) => {
              setStateId(states.find(s => s.name === e.target.value)?.unique_id || '');
              setLgaId('');
              setValue('lga', ''); setValue('ward', '');
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
            <select id="lga" disabled={!stateId} {...register('lga', {
              onChange: (e) => {
                setLgaId(lgas.find(l => l.name === e.target.value)?.unique_id || '');
                setValue('ward', '');
              },
            })}>
              <option value="">{stateId ? 'Select LGA' : 'Select a state first'}</option>
              {lgas.map(l => <option key={l.unique_id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div className="xui-form-box">
            <label htmlFor="ward">Ward</label>
            <select id="ward" disabled={!lgaId} {...register('ward')}>
              <option value="">{lgaId ? 'Select ward' : 'Select an LGA first'}</option>
              {wards.map(w => <option key={w.unique_id} value={w.name}>{w.name}</option>)}
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
          <label htmlFor="contact_name">Contact Name</label>
          <input type="text" id="contact_name" placeholder="Enter contact name" {...register('contact_name')} />
        </div>

        <div className="xui-form-box">
          <label htmlFor="contact_office_address">Office Address</label>
          <input type="text" id="contact_office_address" placeholder="Enter office address" {...register('contact_office_address')} />
        </div>

        <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
          <PhoneNumberInput control={control} name="contact_phone_number" label="Phone Number" id="contact_phone_number" />
          <PhoneNumberInput control={control} name="contact_alt_phone_number" label="Alt. Phone" id="contact_alt_phone_number" placeholder="Alternative phone" />
        </div>

        <div className="xui-form-box" {...(errors.contact_email && { 'xui-error': 'true' })}>
          <label htmlFor="contact_email">Contact Email</label>
          <input type="email" id="contact_email" placeholder="Enter contact email" {...register('contact_email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })} />
          {errors.contact_email && <span className="message">{errors.contact_email.message}</span>}
        </div>
      </div>
    </div>
  );
};

export default SupportGroupLocationTab;
