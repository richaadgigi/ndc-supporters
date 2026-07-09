'use client';
import { useState } from 'react';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import { showAlert } from '../common';
import { extractErrorMessage } from '../../utils/formatters';

interface DenyApprovalModalProps {
  id?: string;
  onDeny: (notes: string) => Promise<{ success: boolean; message: string }>;
  onSuccess?: () => void;
  setError?: (error: string) => void;
  setSuccessMessage?: (message: string) => void;
}

const DenyApprovalModal = ({
  id = 'deny-approval-modal',
  onDeny,
  onSuccess,
  setError,
  setSuccessMessage,
}: DenyApprovalModalProps) => {
  const [notes, setNotes] = useState('');
  const [denying, setDenying] = useState(false);

  const closeModal = () => {
    setNotes('');
    modalHide(id);
  };

  const handleDeny = async () => {
    if (!notes.trim()) return;

    setDenying(true);
    try {
      const response = await onDeny(notes.trim());
      if (response.success) {
        if (setSuccessMessage) setSuccessMessage(response.message || 'Approval denied successfully');
        showAlert('success-alert');
        closeModal();
        if (onSuccess) onSuccess();
      } else {
        if (setError) setError(response.message || 'Failed to deny approval');
        showAlert('error-alert');
      }
    } catch (err: any) {
      if (setError) setError(extractErrorMessage(err, 'Failed to deny approval'));
      showAlert('error-alert');
    } finally {
      setDenying(false);
    }
  };

  return (
    <section className="xui-modal" xui-modal={id}>
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-90">Deny Approval</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-half xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <div className="xui-form">
          <div className="xui-form-box">
            <label>Reason for denial *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Enter reason for denying this approval..."
            />
          </div>
        </div>
        <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-1">
          <button
            type="button"
            className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-half"
            onClick={closeModal}
            disabled={denying}
          >
            Cancel
          </button>
          <button
            type="button"
            className="xui-btn xui-btn-block xui-btn-danger xui-bdr-rad-half"
            onClick={handleDeny}
            disabled={denying || !notes.trim()}
          >
            {denying ? 'Denying...' : 'Deny Approval'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DenyApprovalModal;
