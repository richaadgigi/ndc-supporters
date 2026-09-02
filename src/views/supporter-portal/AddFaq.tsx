'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import faqsService from '../../services/faqs.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FormData { question: string; answer: string; }

const AddFaq = () => {
  const router = useRouter();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('supporter-portal', 'faqs');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { question: '', answer: '' } });

  const onSubmit = async (data: FormData) => {
    if (!accessIds) { setError('You do not have access to this module'); showAlert('error-alert'); return; }
    setLoading(true);
    try {
      const response = await faqsService.portalAdd({ question: data.question, answer: data.answer }, { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });
      if (response.success) {
        setSuccessMessage('FAQ added successfully'); showAlert('success-alert');
        setTimeout(() => router.push('/dashboard/supporter-portal/faqs'), 1500);
      } else { setError(response.message || 'Failed to add FAQ'); showAlert('error-alert'); }
    } catch (err: any) { setError(extractErrorMessage(err, 'Failed to add FAQ')); showAlert('error-alert'); } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar title="Add FAQ" subtitle="Create a new FAQ" />
      <div className="xui-py-1">
        <a onClick={() => router.back()} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the FAQ details below.</p>
        <hr className="xui-my-2" />
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
            {loading ? 'Adding FAQ...' : 'Add FAQ'}
          </button>
        </form>
      </div>
      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddFaq;
