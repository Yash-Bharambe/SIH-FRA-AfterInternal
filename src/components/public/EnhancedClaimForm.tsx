import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTesseractOCR } from '../../hooks/useTesseractOCR';
import { extractFieldsFromText } from '../../utils/ocrExtract';
import { Upload, Eye, Loader2 } from 'lucide-react';

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
  // General Information
  claimType: string;
  claimantName: string;
  guardianName: string;
  genderAge: string;
  caste: string;
  aadhaar: string;
  residentialProof: File | null;

  // Land & Location
  village: string;
  panchayat: string;
  block: string;
  district: string;
  state: string;
  surveyNumber: string;
  landClaimed: string;
  landUseType: string;
  mapUpload: File | null;
  boundaries: string;

  // Evidence
  selectedEvidence: string[];
  evidenceFiles: { [key: string]: File | null };

  // Supporting Documents
  fraForm: File | null;
  affidavit: File | null;
  gramSabhaEndorsement: File | null;
  signature: File | null;

  // Verification
  fieldReport: File | null;
  panchnama: File | null;
  photoEvidence: File | null;
  gisFile: File | null;
}

interface EnhancedClaimFormProps {
  onSubmitSuccess?: () => void;
}

const EnhancedClaimForm: React.FC<EnhancedClaimFormProps> = ({ onSubmitSuccess }) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    general: true,
    land: false,
    evidence: false,
    documents: false,
    verification: false,
  });

  const [formData, setFormData] = useState<FormData>({
    claimType: '',
    claimantName: '',
    guardianName: '',
    genderAge: '',
    caste: '',
    aadhaar: '',
    residentialProof: null,
    village: '',
    panchayat: '',
    block: '',
    district: '',
    state: '',
    surveyNumber: '',
    landClaimed: '',
    landUseType: '',
    mapUpload: null,
    boundaries: '',
    selectedEvidence: [],
    evidenceFiles: {},
    fraForm: null,
    affidavit: null,
    gramSabhaEndorsement: null,
    signature: null,
    fieldReport: null,
    panchnama: null,
    photoEvidence: null,
    gisFile: null,
  });

  // OCR state shared across sections
  const { isProcessing, progress, runOnFile } = useTesseractOCR();
  const [sectionOcrFile, setSectionOcrFile] = useState<File | null>(null);
  const sharedOcrInputRef = useRef<HTMLInputElement>(null);
  const [manualText, setManualText] = useState<string>('');
  const applyExtracted = (text: string) => {
    const f = extractFieldsFromText(text);
    setFormData(prev => ({
      ...prev,
      claimType: f.claimType ?? prev.claimType,
      claimantName: f.claimantName ?? prev.claimantName,
      guardianName: f.guardianName ?? prev.guardianName,
      genderAge: f.genderAge ?? prev.genderAge,
      caste: f.caste ?? prev.caste,
      aadhaar: f.aadhaar ?? prev.aadhaar,
      village: f.village ?? prev.village,
      panchayat: f.panchayat ?? prev.panchayat,
      block: f.block ?? prev.block,
      district: f.district ?? prev.district,
      state: f.state ?? prev.state,
      surveyNumber: f.surveyNumber ?? prev.surveyNumber,
      landClaimed: f.landClaimed ?? prev.landClaimed,
      landUseType: f.landUseType ?? prev.landUseType,
      boundaries: f.boundaries ?? prev.boundaries,
      selectedEvidence: f.selectedEvidence ? Array.from(new Set([...prev.selectedEvidence, ...f.selectedEvidence])) : prev.selectedEvidence,
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.files![0],
      }));
    }
  };

  const handleEvidenceCheckbox = (evidence: string) => {
    setFormData(prev => ({
      ...prev,
      selectedEvidence: prev.selectedEvidence.includes(evidence)
        ? prev.selectedEvidence.filter(e => e !== evidence)
        : [...prev.selectedEvidence, evidence],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call to submit the form data
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const InputField: React.FC<{
    label: string;
    name: string;
    type?: string;
    value?: string;
    required?: boolean;
  }> = ({ label, name, type = 'text', value = '', required = false }) => (
    <div className="mb-5">
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          required={required}
          placeholder=" "
          className="block w-full px-4 py-3 text-forest-dark bg-white/70 border-b-2 border-forest-light/20 focus:border-forest-accent focus:outline-none transition-colors peer"
        />
        <label 
          className="absolute text-sm text-forest-medium duration-300 transform -translate-y-8 scale-75 top-3 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8 peer-focus:text-forest-accent"
        >
          {label}
          {required && <span className="text-error ml-1 text-xs">*</span>}
        </label>
      </div>
    </div>
  );

  const FileUpload: React.FC<{
    label: string;
    name: string;
    required?: boolean;
  }> = ({ label, name, required = false }) => (
    <div className="mb-5">
      <label className="block text-sm text-forest-medium mb-2">
        {label}
        {required && <span className="text-error ml-1 text-xs">*</span>}
      </label>
      <div className="group">
        <div className="relative border border-forest-light/20 rounded-lg transition-all duration-200 group-hover:border-forest-accent/40">
          <input
            type="file"
            onChange={(e) => handleFileChange(e, name)}
            required={required}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="px-4 py-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-forest-light/70 group-hover:text-forest-accent transition-colors mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-forest-medium group-hover:text-forest-dark transition-colors">
              Choose a file or drag & drop
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 animate-forest-fade-in relative bg-white/40 backdrop-blur-sm rounded-xl forest-pattern">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-forest-primary">Forest Rights Claim Form</h2>
        <div className="mt-2 flex justify-center">
          <div className="h-1 w-24 bg-gradient-to-r from-forest-accent to-forest-primary rounded-full"></div>
        </div>
      </div>
      <input
        ref={sharedOcrInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
        className="hidden"
        onChange={(e) => setSectionOcrFile(e.target.files?.[0] || null)}
      />

      {/* Section 1: General Information */}
      <AccordionSection
        title="1. General Information"
        isOpen={openSections.general}
        onToggle={() => toggleSection('general')}
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
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select claim type</option>
              <option value="IFR">Individual Forest Rights (IFR)</option>
              <option value="CR">Community Rights (CR)</option>
              <option value="CFR">Community Forest Resource Rights (CFR)</option>
            </select>
          </div>
          <InputField
            label="Name of Claimant(s)"
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
          <InputField
            label="Aadhaar / UID (12 digits)"
            name="aadhaar"
            value={formData.aadhaar}
            required
          />
          <FileUpload
            label="Residential Status Proof"
            name="residentialProof"
            required
          />
        </div>
      </AccordionSection>

      {/* Section 2: Land & Location Details */}
      <AccordionSection
        title="2. Land & Location Details"
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
          <InputField label="Panchayat" name="panchayat" value={formData.panchayat} required />
          <InputField label="Block" name="block" value={formData.block} required />
          <InputField label="District" name="district" value={formData.district} required />
          <InputField label="State" name="state" value={formData.state} required />
          <InputField label="Survey Number / Khasra Number" name="surveyNumber" value={formData.surveyNumber} />
          <InputField
            label="Land Claimed (in acres/hectares)"
            name="landClaimed"
            type="number"
            value={formData.landClaimed}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Land Use Type
            </label>
            <select
              name="landUseType"
              value={formData.landUseType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select land use type</option>
              <option value="cultivation">Cultivation</option>
              <option value="homestead">Homestead</option>
              <option value="grazing">Grazing</option>
              <option value="CFR">Community Forest Resource</option>
            </select>
          </div>
          <FileUpload label="Map/Sketch Upload" name="mapUpload" required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boundaries Description
            </label>
            <textarea
              name="boundaries"
              value={formData.boundaries}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md h-32"
              placeholder="Describe natural features and boundaries..."
              required
            />
          </div>
        </div>
      </AccordionSection>

      {/* Section 3: Evidence Required */}
      <AccordionSection
        title="3. Evidence Required"
        isOpen={openSections.evidence}
        onToggle={() => toggleSection('evidence')}
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
            <h3 className="font-medium mb-2">Required Evidence Documents</h3>
            {['residentialProof', 'occupationProof', 'communityRights'].map((evidence) => (
              <div key={evidence} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={evidence}
                  checked={formData.selectedEvidence.includes(evidence)}
                  onChange={() => handleEvidenceCheckbox(evidence)}
                  className="mr-2"
                />
                <label htmlFor={evidence} className="text-sm">
                  {evidence === 'residentialProof' && 'Residential Proof (Ration card, Aadhaar, Voter ID)'}
                  {evidence === 'occupationProof' && 'Occupation/Cultivation Proof'}
                  {evidence === 'communityRights' && 'Community Rights Evidence'}
                </label>
              </div>
            ))}
          </div>
          {formData.selectedEvidence.map((evidence) => (
            <FileUpload
              key={evidence}
              label={`Upload ${evidence} Document`}
              name={`${evidence}File`}
            />
          ))}
        </div>
      </AccordionSection>

      {/* Section 4: Supporting Documents */}
      <AccordionSection
        title="4. Supporting Documents"
        isOpen={openSections.documents}
        onToggle={() => toggleSection('documents')}
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
          <FileUpload
            label="FRA Claim Form (Form A/B/C)"
            name="fraForm"
            required
          />
          <FileUpload
            label="Self-declaration/Affidavit"
            name="affidavit"
            required
          />
          <FileUpload
            label="Gram Sabha / FRC Endorsement"
            name="gramSabhaEndorsement"
            required
          />
          <FileUpload
            label="Claimant's Signature/Thumb Impression"
            name="signature"
            required
          />
        </div>
      </AccordionSection>

      {/* Section 5: Verification Stage Documents */}
      <AccordionSection
        title="5. Verification Stage Documents"
        isOpen={openSections.verification}
        onToggle={() => toggleSection('verification')}
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
          <FileUpload label="Field Verification Report" name="fieldReport" />
          <FileUpload label="Panchnama" name="panchnama" />
          <FileUpload label="Photographic Evidence" name="photoEvidence" />
          <FileUpload label="GIS Shapefile/Map" name="gisFile" />
        </div>
      </AccordionSection>

      <div className="mt-6">
        <button
  type="submit"
  className="group w-full bg-green-600 text-white py-3.5 px-6 rounded-lg transition-all duration-300 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105"
>

          <div className="relative flex items-center justify-center">
            <span className="text-base font-medium group-hover:translate-x-[-4px] transition-transform">
              Submit Claim
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
    </form>
  );
};

export default EnhancedClaimForm;
