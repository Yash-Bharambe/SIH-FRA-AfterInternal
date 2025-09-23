import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import EnhancedClaimForm from './EnhancedClaimForm';

interface ClaimSubmissionProps {
  onSuccess?: () => void;
}

export const ClaimSubmission: React.FC<ClaimSubmissionProps> = ({ onSuccess }) => {
  const { showSuccess } = useToast();
  const { t } = useTranslation();

  const handleClaimSubmitted = () => {
    showSuccess(t('claims.submission.success', 'Claim submitted successfully!'));
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <EnhancedClaimForm onSubmitSuccess={handleClaimSubmitted} />
    </div>
  );
}