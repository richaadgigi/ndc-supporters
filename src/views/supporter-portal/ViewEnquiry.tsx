'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Checkmark, Calendar, Email, Phone, User } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import enquiriesService from '../../services/enquiries.service';
import type { Enquiry } from '../../services/enquiries.service';
import { formatDate } from '../../utils/formatters';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { DetailSkeleton } from '../../components/skeletons';

const ViewEnquiry = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds, checkAccess } = useGeneral();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Enquiry | null>(null);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'enquiries');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  const fetchItem = async () => {
    if (!id || !moduleId || !subModuleId) { setLoading(false); return; }
    try {
      const res = await enquiriesService.portalGetOne(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (res.success && res.data) setItem(res.data);
    } catch (err) { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchItem();
  }, [id, moduleId, subModuleId]);

  const handleMarkComplete = async () => {
    if (!moduleId || !subModuleId || !item) return { success: false, message: 'Unable to mark enquiry as completed' };
    return enquiriesService.portalComplete({ unique_id: item.unique_id }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
  };

  const handleMarkCompleteSuccess = () => {
    setItem(prev => prev ? { ...prev, enquiry_status: 'Completed' } : prev);
  };

  if (loading) return (
    <div>
      <Navbar title="Enquiry" subtitle="View enquiry details" />
      <div className="xui-py-1"><DetailSkeleton /></div>
    </div>
  );

  if (!item) return (
    <div>
      <Navbar title="Enquiry" subtitle="View enquiry details" />
      <div className="xui-py-2">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-opacity-5">Enquiry not found or you do not have access.</p>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar title="Enquiry" subtitle="View enquiry details" />
      <div className="xui-py-1">
        <a
          onClick={() => router.push('/dashboard/supporter-portal/enquiries')}
          className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-mb-1-half"
          style={{ color: 'var(--neutral-600)', fontSize: '14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Enquiries</span>
        </a>

        <div className="xui-row">
          <div className="xui-col-12 xui-lg-col-8">
            <div className="xui-bg-white xui-bdr-rad-half xui-p-1-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
              <h2 className="xui-font-sz-110 xui-font-w-700 xui-mb-1" style={{ color: 'var(--neutral-900)' }}>
                {item.title}
              </h2>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1-half xui-flex-wrap">
                <span className={`xui-badge ${item.enquiry_status?.toLowerCase() === 'completed' ? 'xui-badge-success' : 'xui-badge-warning'} xui-font-sz-70`}>
                  {item.enquiry_status?.toLowerCase() === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              <p className="xui-font-sz-90" style={{ lineHeight: '1.8', color: 'var(--neutral-700)', whiteSpace: 'pre-wrap' }}>
                {item.details}
              </p>
            </div>
          </div>

          <div className="xui-col-12 xui-lg-col-4 xui-pl-1">
            <div style={{ position: 'sticky', top: '20px' }}>
              <div className="xui-bg-white xui-bdr-rad-half xui-p-1 xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
                <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Enquiry Info
                </h4>

                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <User size={14} /> Full Name
                    </span>
                    <span className="xui-font-sz-80 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                      {item.name}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Email size={14} /> Email
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                      {item.email}
                    </span>
                  </div>

                  {item.phone_number && (
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                        <Phone size={14} /> Phone
                      </span>
                      <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                        {item.phone_number}
                      </span>
                    </div>
                  )}

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5">Status</span>
                    <span className={`xui-badge ${item.enquiry_status?.toLowerCase() === 'completed' ? 'xui-badge-success' : 'xui-badge-warning'} xui-font-sz-70`}>
                      {item.enquiry_status?.toLowerCase() === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> Created
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                      {formatDate(item.createdAt, 'MMM D, YYYY')}
                    </span>
                  </div>

                  <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                    <span className="xui-font-sz-80 xui-opacity-5 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half">
                      <Calendar size={14} /> Updated
                    </span>
                    <span className="xui-font-sz-80" style={{ color: 'var(--neutral-700)' }}>
                      {formatDate(item.updatedAt, 'MMM D, YYYY')}
                    </span>
                  </div>
                </div>
              </div>

              {item.enquiry_status?.toLowerCase() !== 'completed' && canEdit && (
                <div className="xui-bg-white xui-bdr-rad-half xui-p-1" style={{ border: '1px solid var(--neutral-200)' }}>
                  <h4 className="xui-font-sz-85 xui-font-w-600 xui-mb-1" style={{ color: 'var(--neutral-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Actions
                  </h4>
                  <button
                    onClick={() => modalShow('complete-modal')}
                    className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half xui-cursor-pointer xui-w-fluid-100 xui-font-sz-85 xui-font-w-500"
                    style={{
                      backgroundColor: 'var(--success)', color: '#fff',
                      border: 'none', padding: '10px 16px', borderRadius: '6px',
                    }}
                  >
                    <Checkmark size={16} /> Mark as Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
      <ConfirmModal id="complete-modal" title="Mark as Completed" message="Are you sure you want to mark this enquiry as completed?" itemName={item.title} confirmText="Mark Complete" confirmingText="Completing..." confirmButtonStyle="success" onConfirm={handleMarkComplete} onSuccess={handleMarkCompleteSuccess} setError={setActionError} setSuccessMessage={setSuccessMessage} showAlert={showAlert} />
    </div>
  );
};

export default ViewEnquiry;
