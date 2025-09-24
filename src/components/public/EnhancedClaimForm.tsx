import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTesseractOCR } from '../../hooks/useTesseractOCR';
import { extractFieldsFromText } from '../../utils/ocrExtract';
import { Upload, Eye, Loader2 } from 'lucide-react';
import { supabaseClaimsService } from '../../services/supabaseClaimsService';
import { useAuth } from '../../contexts/AuthContext';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="mb-3 bg-white/50 backdrop-blur-sm rounded-lg border border-forest-light/10 transition-shadow hover:shadow-sm">
      <button
        className="w-full px-6 py-4 text-left flex justify-between items-center group"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isOpen ? 'bg-forest-accent' : 'bg-forest-light'}`}></div>
          <span className={`font-medium text-base transition-colors ${isOpen ? 'text-forest-primary' : 'text-forest-medium'}`}>
            {title}
          </span>
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className={`w-5 h-5 transition-colors ${isOpen ? 'text-forest-accent' : 'text-forest-light'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  );
};

interface FormData {
  // Claim Details
  claimType: string;
  claimantName: string;
  guardianName: string;
  genderAge: string;
  caste: string;

  // Location & Land
  village: string;
  district: string;
  state: string;
  landClaimed: string; // e.g. "2.5 hectares" or "3 acres"
  surveyOrGps: string; // Survey Number / GPS Coordinates

  // Mandatory Documents
  identityProof: File | null;
  tribeCertificate: File | null;
  fraFormA: File | null;
  gramSabhaResolution: File | null;
}

interface EnhancedClaimFormProps {
  onSubmitSuccess?: () => void;
}

const EnhancedClaimForm: React.FC<EnhancedClaimFormProps> = ({ onSubmitSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    details: true,
    land: false,
    documents: false,
  });

  const [formData, setFormData] = useState<FormData>({
    claimType: '',
    claimantName: '',
    guardianName: '',
    genderAge: '',
    caste: '',
    village: '',
    district: '',
    state: '',
    landClaimed: '',
    surveyOrGps: '',
    identityProof: null,
    tribeCertificate: null,
    fraFormA: null,
    gramSabhaResolution: null,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // OCR state shared across sections
  const { isProcessing, progress, runOnFile } = useTesseractOCR();
  const [sectionOcrFile, setSectionOcrFile] = useState<File | null>(null);
  const sharedOcrInputRef = useRef<HTMLInputElement>(null);
  const [manualText, setManualText] = useState<string>('');
  const applyExtracted = (text: string) => {
    const f = extractFieldsFromText(text);
    setFormData(prev => ({
      ...prev,
      claimType: touched.claimType ? prev.claimType : (f.claimType ?? prev.claimType),
      claimantName: touched.claimantName ? prev.claimantName : (f.claimantName ?? prev.claimantName),
      guardianName: touched.guardianName ? prev.guardianName : (f.guardianName ?? prev.guardianName),
      genderAge: touched.genderAge ? prev.genderAge : (f.genderAge ?? prev.genderAge),
      caste: touched.caste ? prev.caste : (f.caste ?? prev.caste),
      village: touched.village ? prev.village : (f.village ?? prev.village),
      district: touched.district ? prev.district : (f.district ?? prev.district),
      state: touched.state ? prev.state : (f.state ?? prev.state),
      landClaimed: touched.landClaimed ? prev.landClaimed : (f.landClaimed ?? prev.landClaimed),
      surveyOrGps: touched.surveyOrGps ? prev.surveyOrGps : (f.surveyNumber ?? f.coordinates ?? prev.surveyOrGps),
    }));
  };
  const runSectionOCR = async () => {
    if (!sectionOcrFile) {
      sharedOcrInputRef.current?.click();
      return;
    }
    const text = await runOnFile(sectionOcrFile, 'eng');
    applyExtracted(text);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.files![0],
      }));
    }
  };

  // removed evidence checkbox logic as only 4 mandatory uploads are required

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      // explicit validation for four mandatory files
      if (!formData.identityProof || !formData.tribeCertificate || !formData.fraFormA || !formData.gramSabhaResolution) {
        setSubmitError('Please select all mandatory documents before submitting.');
        return;
      }
      // Minimal payload to Supabase; map UI form to DB shape
      const areaNumber = parseFloat(formData.landClaimed.replace(/[^0-9.]/g, '')) || 0;
      const payload = {
        user_id: user?.id || 'public-guest',
        village: formData.village,
        area: areaNumber,
        coordinates: formData.surveyOrGps,
        applicant_name: formData.claimantName,
        claim_type: formData.claimType,
        documents: [
          formData.identityProof ? 'identityProof' : '',
          formData.tribeCertificate ? 'tribeCertificate' : '',
          formData.fraFormA ? 'fraFormA' : '',
          formData.gramSabhaResolution ? 'gramSabhaResolution' : ''
        ].filter(Boolean),
      } as const;
      console.log('Submitting claim payload:', payload);
      const claim = await supabaseClaimsService.create(payload);
      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Submission failed. Please try again.');
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      claimType: '',
      claimantName: '',
      guardianName: '',
      genderAge: '',
      caste: '',
      village: '',
      district: '',
      state: '',
      landClaimed: '',
      surveyOrGps: '',
      identityProof: null,
      tribeCertificate: null,
      fraFormA: null,
      gramSabhaResolution: null,
    });
    setSectionOcrFile(null);
    setManualText('');
    setSubmitted(false);
    setSubmitError(null);
  };

  const InputField: React.FC<{
    label: string;
    name: string;
    type?: string;
    value?: string;
    required?: boolean;
  }> = ({ label, name, type = 'text', value = '', required = false }) => (
    <div className="mb-5">
      <label className="block text-sm text-forest-medium mb-1">
        {label}
        {required && <span className="text-error ml-1 text-xs">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleInputChange}
        required={required}
        className="block w-full px-4 py-3 text-forest-dark bg-white/80 border border-green-200 focus:border-green-600 focus:outline-none transition-colors rounded-md shadow-sm"
      />
    </div>
  );

  const FileUpload: React.FC<{
    label: string;
    name: string;
    required?: boolean;
    accept?: string;
  }> = ({ label, name, required = false, accept = '' }) => {
    const currentFile = (formData as any)[name] as File | null;
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          [name]: file,
        }));
      }
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };
    return (
      <div className="mb-5">
        <label className="block text-sm text-forest-medium mb-2">
          {label}
          {required && <span className="text-error ml-1 text-xs">*</span>}
        </label>
        <div className="group">
          <div
            className="relative border border-green-200 bg-white/70 rounded-lg transition-all duration-200 group-hover:border-green-400 shadow-sm"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              onChange={(e) => handleFileChange(e, name)}
              accept={accept}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="px-4 py-3 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600/70 group-hover:text-green-700 transition-colors mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-forest-medium group-hover:text-forest-dark transition-colors">
                  Choose a file or drag & drop
                </span>
              </div>
              <span className="mt-1 text-xs text-forest-medium">
                {currentFile ? currentFile.name : 'No file chosen'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-forest-fade-in bg-white/80 rounded-2xl border border-green-100 shadow">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-green-800">Form submitted</h2>
          <p className="mt-2 text-forest-medium">Your claim has been recorded in the database.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={resetForm} className="forest-button-primary">Submit another claim</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-forest-fade-in relative bg-gradient-to-b from-green-50 via-white to-green-50 backdrop-blur-sm rounded-2xl border border-green-100 shadow">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-green-800">Submit FRA Claim</h2>
        <div className="mt-2 flex justify-center">
          <div className="h-1 w-28 bg-gradient-to-r from-green-500 to-green-700 rounded-full shadow"></div>
        </div>
      </div>
      <input
        ref={sharedOcrInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
        className="hidden"
        onChange={(e) => setSectionOcrFile(e.target.files?.[0] || null)}
      />

      {/* Section 1: Claim Details */}
      <AccordionSection
        title="1. Claim Details"
        isOpen={openSections.details}
        onToggle={() => toggleSection('details')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-forest-medium">OCR for this section</label>
            <div className="flex items-center gap-2">
              <button type="button" className="px-3 py-1.5 border rounded cursor-pointer text-sm flex items-center gap-2" onClick={() => sharedOcrInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Select Image
              </button>
              {sectionOcrFile && (
                <span className="text-xs text-forest-medium max-w-[200px] truncate" title={sectionOcrFile.name}>{sectionOcrFile.name}</span>
              )}
              <button type="button" onClick={runSectionOCR} disabled={!sectionOcrFile || isProcessing} className="forest-button-secondary flex items-center gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-forest-spin"/> : <Eye className="h-4 w-4"/>}
                {isProcessing ? `Scanning ${progress}%` : 'Scan & Autofill'}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-forest-medium mb-1">Or paste text to autofill</label>
            <div className="flex items-start gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Type or paste section text here..."
              />
              <button type="button" onClick={() => { if (manualText.trim()) { applyExtracted(manualText); } }} className="forest-button-secondary whitespace-nowrap">Parse text</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Claim
            </label>
            <select
              name="claimType"
              value={formData.claimType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md border-green-200 focus:border-green-600"
              required
            >
              <option value="">Select claim type</option>
              <option value="IFR">Individual Forest Rights (IFR)</option>
              <option value="CR">Community Rights (CR)</option>
              <option value="CFR">Community Forest Resource Rights (CFR)</option>
            </select>
          </div>
          <InputField
            label="Claimant Name"
            name="claimantName"
            value={formData.claimantName}
            required
          />
          <InputField
            label="Father's/Mother's/Spouse's Name"
            name="guardianName"
            value={formData.guardianName}
            required
          />
          <InputField
            label="Gender & Age"
            name="genderAge"
            value={formData.genderAge}
            required
          />
          <InputField
            label="Caste / Tribal Group"
            name="caste"
            value={formData.caste}
            required
          />
        </div>
      </AccordionSection>

      {/* Section 2: Location & Land */}
      <AccordionSection
        title="2. Location & Land"
        isOpen={openSections.land}
        onToggle={() => toggleSection('land')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-forest-medium">OCR for this section</label>
            <div className="flex items-center gap-2">
              <button type="button" className="px-3 py-1.5 border rounded cursor-pointer text-sm flex items-center gap-2" onClick={() => sharedOcrInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Select Image
              </button>
              {sectionOcrFile && (
                <span className="text-xs text-forest-medium max-w-[200px] truncate" title={sectionOcrFile.name}>{sectionOcrFile.name}</span>
              )}
              <button type="button" onClick={runSectionOCR} disabled={!sectionOcrFile || isProcessing} className="forest-button-secondary flex items-center gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-forest-spin"/> : <Eye className="h-4 w-4"/>}
                {isProcessing ? `Scanning ${progress}%` : 'Scan & Autofill'}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-forest-medium mb-1">Or paste text to autofill</label>
            <div className="flex items-start gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Type or paste section text here..."
              />
              <button type="button" onClick={() => { if (manualText.trim()) { applyExtracted(manualText); } }} className="forest-button-secondary whitespace-nowrap">Parse text</button>
            </div>
          </div>
          <InputField label="Village" name="village" value={formData.village} required />
          <InputField label="District" name="district" value={formData.district} required />
          <InputField label="State" name="state" value={formData.state} required />
          <InputField label="Land Claimed (area + unit)" name="landClaimed" value={formData.landClaimed} required />
          <InputField label="Survey Number / GPS Coordinates" name="surveyOrGps" value={formData.surveyOrGps} required />
        </div>
      </AccordionSection>

      {/* Section 3: Mandatory Documents */}
      <AccordionSection
        title="3. Mandatory Documents"
        isOpen={openSections.documents}
        onToggle={() => toggleSection('documents')}
      >
        <div className="space-y-4">
          <FileUpload label="Identity Proof" name="identityProof" required accept="image/*,application/pdf" />
          <FileUpload label="Tribe/Community Certificate" name="tribeCertificate" required accept="image/*,application/pdf" />
          <FileUpload label="FRA Claim Form (Form-A)" name="fraFormA" required accept="image/*,application/pdf" />
          <FileUpload label="Gram Sabha Resolution" name="gramSabhaResolution" required accept="image/*,application/pdf" />
        </div>
      </AccordionSection>

      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {submitError}
        </div>
      )}

      <div className="mt-6">
        <button
  type="button"
  onClick={handleSubmit}
  disabled={isSubmitting}
  className="group w-full bg-green-600 disabled:bg-green-400 text-white py-3.5 px-6 rounded-lg transition-all duration-300 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105"
>

          <div className="relative flex items-center justify-center">
            <span className="text-base font-medium group-hover:translate-x-[-4px] transition-transform">
              {isSubmitting ? 'Submitting…' : 'Submit Claim'}
            </span>
            <svg 
              className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default EnhancedClaimForm;
