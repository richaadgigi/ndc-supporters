'use client';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { SupportGroupFormData } from './types';

interface Props {
  register: UseFormRegister<SupportGroupFormData>;
  errors: FieldErrors<SupportGroupFormData>;
}

const SupportGroupAccountTab = ({ register, errors }: Props) => (
  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Account Information</p>

      <div className="xui-form-box">
        <label htmlFor="account_bank">Bank</label>
        <input type="text" id="account_bank" placeholder="Enter bank name" {...register('account_bank')} />
      </div>

      <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
        <div className="xui-form-box">
          <label htmlFor="account_name">Account Name</label>
          <input type="text" id="account_name" placeholder="Enter account name" {...register('account_name')} />
        </div>
        <div className="xui-form-box" {...(errors.account_number && { 'xui-error': 'true' })}>
          <label htmlFor="account_number">Account Number</label>
          <input type="text" id="account_number" placeholder="Enter account number" {...register('account_number')} />
          {errors.account_number && <span className="message">{errors.account_number.message}</span>}
        </div>
      </div>
    </div>

    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Additional</p>
      <div className="xui-form-box">
        <label htmlFor="account_other">Other Account Details</label>
        <textarea id="account_other" rows={4} placeholder="Enter any other account details" {...register('account_other')} />
      </div>
    </div>
  </div>
);

export default SupportGroupAccountTab;
