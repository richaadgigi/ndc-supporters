'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import faqsService from '../../services/faqs.service';
import type { Faq } from '../../services/faqs.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface FormData { question: string; answer: string; }

const EditFaq = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [item, setItem] = useState<Faq | null>(null);

  const accessIds = getAccessIds('candidate-portal', 'faqs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { question: '', answer: '' } });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !moduleId || !subModuleId) { setLoadingItem(false); return; }
      try {
        const res = await faqsService.get(id, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (res.success && res.data) { setItem(res.data); reset({ question: res.data.question, answer: res.data.answer }); }
      } catch (err) { console.error('Failed to fetch FAQ:', err); setError('Failed to load FAQ details'); showAlert('error-alert'); } finally { setLoadingItem(false); }
    };
    fetchItem();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!moduleId || !subModuleId || !id) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true); setError('');
    try {
      const response = await faqsService.editDetails({ unique_id: id, question: data.question, answer: data.answer }, { module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (response.success) {
        setSuccessMessage('FAQ updated successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/candidate-portal/faqs'), 1500);
      } else { setError(response.message || 'Failed to update FAQ'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to update FAQ')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  if (loadingItem) return (<div><Navbar title="Edit FAQ" subtitle="Modify FAQ" /><div className="xui-py-1"><FormSkeleton /></div></div>);
  if (!item) return (<div><Navbar title="Edit FAQ" subtitle="Modify FAQ" /><div className="xui-py-1"><a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"><span className="icon-container"><ArrowLeft size={20} /></span></a><p className="xui-opacity-5">FAQ not found or you do not have access.</p></div></div>);

  return (
    <div>
      <Navbar title="Edit FAQ" subtitle="Modify FAQ" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form" style={{ maxWidth: '600px' }}>
          <div className="xui-form-box" {...(errors.question && { 'xui-error': 'true' })}>
            <label htmlFor="question">Question *</label>
            <input type="text" id="question" placeholder="Enter the question" {...register('question', { required: 'Question is required', maxLength: { value: 300, message: 'Maximum 300 characters' } })} />
            {errors.question && <span className="message">{errors.question.message}</span>}
          </div>
          <div className="xui-form-box" {...(errors.answer && { 'xui-error': 'true' })}>
            <label htmlFor="answer">Answer *</label>
            <textarea id="answer" placeholder="Enter the answer" rows={6} {...register('answer', { required: 'Answer is required', maxLength: { value: 1000, message: 'Maximum 1000 characters' } })} />
            {errors.answer && <span className="message">{errors.answer.message}</span>}
          </div>
          <button type="submit" disabled={loading} className="xui-btn xui-mt-1 xui-bdr-rad-[4px]" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            {loading ? 'Updating FAQ...' : 'Update FAQ'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditFaq;
