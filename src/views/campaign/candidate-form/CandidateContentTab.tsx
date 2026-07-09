'use client';
import { Add, TrashCan } from '@carbon/icons-react';
import type { UseFormRegister } from 'react-hook-form';
import type { CandidateFormData, ContentSection, KeyFact, EducationItem, CareerItem, OfficeItem, ManifestoItem } from './types';
import { CONTENT_SECTIONS } from './types';
import { EmptyState } from '../../../components/common';


interface Props {
  register: UseFormRegister<CandidateFormData>;
  activeSection: ContentSection;
  setActiveSection: (s: ContentSection) => void;
  sectionCounts: Record<ContentSection, number>;
  keyFactFields: Array<{ id: string } & KeyFact>;
  appendKeyFact: (v: KeyFact) => void;
  removeKeyFact: (i: number) => void;
  educationFields: Array<{ id: string } & EducationItem>;
  appendEducation: (v: EducationItem) => void;
  removeEducation: (i: number) => void;
  careerFields: Array<{ id: string } & CareerItem>;
  appendCareer: (v: CareerItem) => void;
  removeCareer: (i: number) => void;
  officeFields: Array<{ id: string } & OfficeItem>;
  appendOffice: (v: OfficeItem) => void;
  removeOffice: (i: number) => void;
  manifestoFields: Array<{ id: string } & ManifestoItem>;
  appendManifesto: (v: ManifestoItem) => void;
  removeManifesto: (i: number) => void;
}

const addBtnStyle = { backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' };
const removeBtnStyle = { backgroundColor: 'var(--error-light, #fee2e2)', color: 'var(--error)', border: '1px solid var(--error)' };
const cardStyle = { border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '16px', marginBottom: '12px' };


const SectionHeader = ({ title, subtitle, onAdd, addLabel }: { title: string; subtitle: string; onAdd: () => void; addLabel: string }) => (
  <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
    <div>
      <p className="xui-font-sz-90 xui-font-w-bold">{title}</p>
      <p className="xui-font-sz-80 xui-opacity-5">{subtitle}</p>
    </div>
    <button type="button" onClick={onAdd} className="xui-btn xui-btn-sm xui-bdr-rad-half" style={addBtnStyle}>
      <Add size={16} /> {addLabel}
    </button>
  </div>
);

const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="xui-btn xui-btn-sm xui-bdr-rad-half" style={removeBtnStyle}>
    <TrashCan size={14} /> Remove
  </button>
);

const CandidateContentTab = ({
  register, activeSection, setActiveSection, sectionCounts,
  keyFactFields, appendKeyFact, removeKeyFact,
  educationFields, appendEducation, removeEducation,
  careerFields, appendCareer, removeCareer,
  officeFields, appendOffice, removeOffice,
  manifestoFields, appendManifesto, removeManifesto,
}: Props) => (
  <div className="xui-d-flex xui-grid-gap-2" style={{ minHeight: '400px' }}>
    <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid var(--neutral-200)', paddingRight: '16px' }}>
      <p className="xui-font-sz-75 xui-font-w-bold xui-opacity-5 xui-mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sections</p>
      {CONTENT_SECTIONS.map(section => (
        <button key={section.key} type="button" onClick={() => setActiveSection(section.key)}
          className="xui-w-fluid-100 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-half xui-btn xui-bdr-rad-half"
          style={{
            textAlign: 'left', padding: '10px 12px',
            backgroundColor: activeSection === section.key ? 'var(--primary-50, #f0f9ff)' : 'transparent',
            color: activeSection === section.key ? 'var(--primary-600)' : 'inherit',
            border: activeSection === section.key ? '1px solid var(--primary-200, #bae6fd)' : '1px solid transparent',
            fontWeight: activeSection === section.key ? 600 : 400,
          }}>
          <span className="xui-font-sz-85">{section.label}</span>
          {sectionCounts[section.key] > 0 && (
            <span style={{
              backgroundColor: activeSection === section.key ? 'var(--primary-600)' : 'var(--neutral-300)',
              color: activeSection === section.key ? 'var(--secondary-700)' : 'var(--neutral-700)',
              borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 600,
            }}>{sectionCounts[section.key]}</span>
          )}
        </button>
      ))}
    </div>

    <div style={{ flex: 1, minWidth: 0, maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
      <div style={{ display: activeSection === 'key_facts' ? 'block' : 'none' }}>
        <SectionHeader title="Key Facts" subtitle="Short memorable facts about the candidate" onAdd={() => appendKeyFact({ fact: '' })} addLabel="Add Fact" />
        {keyFactFields.length === 0 && <EmptyState title="No key facts yet" message='Click "Add Fact" to get started.' />}
        {keyFactFields.map((field, index) => (
          <div key={field.id} className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1">
            <span className="xui-font-sz-80 xui-opacity-4" style={{ width: '20px', flexShrink: 0 }}>{index + 1}.</span>
            <div className="xui-form-box xui-flex-1 xui-mb-0">
              <input type="text" placeholder="Enter a key fact..." {...register(`key_facts.${index}.fact`)} />
            </div>
            <button type="button" onClick={() => removeKeyFact(index)} className="xui-btn xui-btn-sm xui-bdr-rad-half" style={removeBtnStyle}><TrashCan size={14} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: activeSection === 'education' ? 'block' : 'none' }}>
        <SectionHeader title="Education" subtitle="Academic qualifications and certifications" onAdd={() => appendEducation({ institution: '', degree: '', year: '' })} addLabel="Add Education" />
        {educationFields.length === 0 && <EmptyState title="No education entries yet" message='Click "Add Education" to get started.' />}
        {educationFields.map((field, index) => (
          <div key={field.id} style={cardStyle}>
            <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-mb-1">
              <p className="xui-font-sz-85 xui-font-w-bold">Entry {index + 1}</p>
              <RemoveBtn onClick={() => removeEducation(index)} />
            </div>
            <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
              <div className="xui-form-box"><label>Institution</label><input type="text" placeholder="e.g. University of Lagos" {...register(`education.${index}.institution`)} /></div>
              <div className="xui-form-box"><label>Degree / Certificate</label><input type="text" placeholder="e.g. B.Sc Computer Science" {...register(`education.${index}.degree`)} /></div>
              <div className="xui-form-box"><label>Year Graduated</label><input type="text" placeholder="e.g. 2020" {...register(`education.${index}.year`)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: activeSection === 'career_history' ? 'block' : 'none' }}>
        <SectionHeader title="Career History" subtitle="Professional and work experience" onAdd={() => appendCareer({ organization: '', role: '', start_year: '', end_year: '' })} addLabel="Add Entry" />
        {careerFields.length === 0 && <EmptyState title="No career entries yet" message='Click "Add Entry" to get started.' />}
        {careerFields.map((field, index) => (
          <div key={field.id} style={cardStyle}>
            <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-mb-1">
              <p className="xui-font-sz-85 xui-font-w-bold">Entry {index + 1}</p>
              <RemoveBtn onClick={() => removeCareer(index)} />
            </div>
            <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
              <div className="xui-form-box"><label>Organization</label><input type="text" placeholder="Organization name" {...register(`career_history.${index}.organization`)} /></div>
              <div className="xui-form-box"><label>Role / Title</label><input type="text" placeholder="e.g. Senior Engineer" {...register(`career_history.${index}.role`)} /></div>
              <div className="xui-form-box"><label>Start Year</label><input type="text" placeholder="e.g. 2018" {...register(`career_history.${index}.start_year`)} /></div>
              <div className="xui-form-box"><label>End Year</label><input type="text" placeholder="e.g. 2022 or Present" {...register(`career_history.${index}.end_year`)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: activeSection === 'previous_public_offices' ? 'block' : 'none' }}>
        <SectionHeader title="Previous Public Offices" subtitle="Government or public service positions held" onAdd={() => appendOffice({ office: '', year: '' })} addLabel="Add Office" />
        {officeFields.length === 0 && <EmptyState title="No public offices yet" message='Click "Add Office" to get started.' />}
        {officeFields.map((field, index) => (
          <div key={field.id} style={cardStyle}>
            <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-mb-1">
              <p className="xui-font-sz-85 xui-font-w-bold">Office {index + 1}</p>
              <RemoveBtn onClick={() => removeOffice(index)} />
            </div>
            <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
              <div className="xui-form-box" style={{ gridColumn: '1 / -1' }}><label>Office Held</label><input type="text" placeholder="e.g. Commissioner for Education, Lagos State" {...register(`previous_public_offices.${index}.office`)} /></div>
              <div className="xui-form-box"><label>Year</label><input type="text" placeholder="e.g. 2015-2019" {...register(`previous_public_offices.${index}.year`)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: activeSection === 'manifesto' ? 'block' : 'none' }}>
        <SectionHeader title="Manifesto" subtitle="Key policy positions and campaign promises" onAdd={() => appendManifesto({ title: '', description: '' })} addLabel="Add Point" />
        {manifestoFields.length === 0 && <EmptyState title="No manifesto points yet" message='Click "Add Point" to get started.' />}
        {manifestoFields.map((field, index) => (
          <div key={field.id} style={cardStyle}>
            <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-mb-1">
              <p className="xui-font-sz-85 xui-font-w-bold">Point {index + 1}</p>
              <RemoveBtn onClick={() => removeManifesto(index)} />
            </div>
            <div className="xui-form-box"><label>Title</label><input type="text" placeholder="e.g. Infrastructure Development" {...register(`manifesto.${index}.title`)} /></div>
            <div className="xui-form-box"><label>Description</label><textarea placeholder="Describe this policy position..." rows={4} {...register(`manifesto.${index}.description`)} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CandidateContentTab;
