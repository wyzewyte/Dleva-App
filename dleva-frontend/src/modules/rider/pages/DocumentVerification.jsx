import { useEffect, useState } from 'react';
import { AlertCircle, Check, Eye, FileText, Loader2, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import riderVerification from '../services/riderVerification';
import {
  DOCUMENT_REQUIREMENTS,
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_BADGES,
  DOCUMENT_TYPE_DESCRIPTIONS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  FILE_VALIDATION,
  VERIFICATION_ERRORS,
  VERIFICATION_INFO,
} from '../constants/verificationConstants';
import {
  RiderCard,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderStatusBadge,
} from '../components/ui/RiderPrimitives';

const DocumentVerification = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [recentlyUploaded, setRecentlyUploaded] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await riderVerification.getVerificationStatus();
      setDocuments(data.documents || {});
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const requiredDocs = Object.entries(DOCUMENT_REQUIREMENTS)
    .filter(([, requirement]) => requirement.required)
    .map(([docType]) => docType);

  const isStageComplete = requiredDocs.every(
    (docType) => documents[docType]?.status === DOCUMENT_STATUSES.APPROVED
  );

  const handleFileSelect = (event, docType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = riderVerification.validateFile(
      file,
      FILE_VALIDATION.MAX_SIZE,
      FILE_VALIDATION.ALLOWED_FORMATS
    );

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFiles((current) => ({ ...current, [docType]: file }));
    setSuccess(`${DOCUMENT_TYPE_LABELS[docType]} selected. Upload when you are ready.`);
  };

  const handleRemoveFile = (docType) => {
    setSelectedFiles((current) => {
      const next = { ...current };
      delete next[docType];
      return next;
    });
  };

  const handleReplaceFile = (docType) => {
    document.getElementById(`file-${docType}`)?.click();
  };

  const handleUploadDocument = async (file, docType) => {
    try {
      setUploading((current) => ({ ...current, [docType]: true }));
      const response = await riderVerification.uploadDocument(file, docType);
      setDocuments((current) => ({
        ...current,
        [docType]: response.document || { ...response, document_type: docType },
      }));
      setRecentlyUploaded(docType);
      window.setTimeout(() => {
        fetchDocuments();
        window.setTimeout(() => setRecentlyUploaded(null), 5000);
      }, 1200);
    } catch (err) {
      setError(err.message || VERIFICATION_ERRORS.UPLOAD_FAILED);
      throw err;
    } finally {
      setUploading((current) => ({ ...current, [docType]: false }));
    }
  };

  const handleSubmitAll = async () => {
    const filesToUpload = Object.entries(selectedFiles);
    if (!filesToUpload.length) {
      setError('Please select at least one document to upload.');
      return;
    }

    setIsSubmittingAll(true);
    setError('');
    setSuccess('');

    let successCount = 0;
    let failCount = 0;
    const failedDocs = [];

    try {
      await Promise.all(
        filesToUpload.map(async ([docType, file]) => {
          try {
            await handleUploadDocument(file, docType);
            successCount += 1;
          } catch {
            failCount += 1;
            failedDocs.push(DOCUMENT_TYPE_LABELS[docType]);
          }
        })
      );

      setSelectedFiles({});

      if (failCount === 0) {
        setSuccess(`All ${successCount} document(s) uploaded successfully.`);
      } else {
        setError(`${successCount} uploaded successfully, but ${failCount} failed: ${failedDocs.join(', ')}`);
      }
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const renderDocumentCard = (docType) => {
    const document = documents[docType];
    const status = document?.status || null;
    const requirement = DOCUMENT_REQUIREMENTS[docType];
    const selectedFile = selectedFiles[docType];
    const isRejected = status === DOCUMENT_STATUSES.REJECTED;
    const isPending = status === DOCUMENT_STATUSES.PENDING;
    const isApproved = status === DOCUMENT_STATUSES.APPROVED;

    return (
      <RiderCard key={docType} className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-dark">{DOCUMENT_TYPE_LABELS[docType]}</h3>
              <RiderStatusBadge status={status || (requirement.required ? 'pending' : 'offline')} className="text-[9px]">
                {status ? status.replace('_', ' ') : requirement.required ? 'Needed' : 'Optional'}
              </RiderStatusBadge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{DOCUMENT_TYPE_DESCRIPTIONS[docType]}</p>
          </div>
        </div>

        {selectedFile ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Selected file</p>
            <p
              className="mt-1 text-xs leading-relaxed text-blue-700"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}
              title={selectedFile.name}
            >
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-blue-700">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => handleReplaceFile(docType)} className="text-xs font-semibold text-primary transition-colors hover:opacity-80">
                Replace
              </button>
              <button type="button" onClick={() => handleRemoveFile(docType)} className="text-xs font-semibold text-red-600 transition-colors hover:opacity-80">
                Remove
              </button>
            </div>
          </div>
        ) : null}

        {!status && !selectedFile ? (
          <label
            htmlFor={`file-${docType}`}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-7 text-center transition-colors hover:border-primary/50 hover:bg-white"
          >
            <Upload size={24} className="text-primary" />
            <p className="mt-3 text-sm font-semibold text-dark">Choose file</p>
            <p className="mt-1 text-xs text-muted">Max 5MB. JPEG, PNG, or PDF.</p>
          </label>
        ) : null}

        {isRejected && !selectedFile ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Rejected</p>
              {document?.rejection_reason ? <p className="mt-1 text-xs leading-relaxed text-red-700">{document.rejection_reason}</p> : null}
              <p className="mt-2 text-xs text-red-700">Upload a clearer replacement file to continue.</p>
            </div>
            <label
              htmlFor={`file-${docType}`}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-orange-50 px-4 py-7 text-center transition-colors hover:border-orange-400"
            >
              <Upload size={24} className="text-orange-600" />
              <p className="mt-3 text-sm font-semibold text-dark">Upload replacement</p>
              <p className="mt-1 text-xs text-muted">Max 5MB. JPEG, PNG, or PDF.</p>
            </label>
          </div>
        ) : null}

        {isPending ? (
          <div className={`mt-4 rounded-2xl border p-4 ${recentlyUploaded === docType ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              <Loader2 size={16} className={`mt-0.5 shrink-0 animate-spin ${recentlyUploaded === docType ? 'text-blue-700' : 'text-amber-700'}`} />
              <div>
                <p className={`text-sm font-semibold ${recentlyUploaded === docType ? 'text-blue-900' : 'text-amber-900'}`}>
                  {recentlyUploaded === docType ? 'Upload successful, pending review' : 'Under review'}
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${recentlyUploaded === docType ? 'text-blue-700' : 'text-amber-700'}`}>
                  {recentlyUploaded === docType ? 'Your file has been received and is waiting for verification.' : VERIFICATION_INFO.VERIFICATION_PROCESS}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {isApproved ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check size={16} />
              <p className="text-sm font-semibold">Verified</p>
            </div>
          </div>
        ) : null}

        {document?.file_url ? (
          <button
            type="button"
            onClick={() => setPreviewFile(document.file_url)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:opacity-80"
          >
            <Eye size={16} />
            Preview file
          </button>
        ) : null}

        <input
          id={`file-${docType}`}
          type="file"
          accept={FILE_VALIDATION.ALLOWED_EXTENSIONS.join(',')}
          onChange={(event) => handleFileSelect(event, docType)}
          className="hidden"
          disabled={Boolean(uploading[docType] || isSubmittingAll)}
        />
      </RiderCard>
    );
  };

  return (
    <RiderPageShell maxWidth="max-w-5xl" withBottomNavSpacing={false}>
      <RiderPageHeader
        title="Document verification"
        subtitle="Upload clear rider documents so identity and vehicle checks can be approved without delays."
        showBack
        onBack={() => navigate('/rider/verification-setup')}
        sticky
      />

      <div className="space-y-6 py-6">
        <RiderCard className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-dark">Document status</h2>
                <RiderStatusBadge status={isStageComplete ? 'approved' : 'pending'}>
                  {isStageComplete ? 'Complete' : 'In progress'}
                </RiderStatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted">Upload all required files clearly. Optional files can still be added later if needed.</p>
            </div>
          </div>
        </RiderCard>

        {error ? (
          <RiderCard className="border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </RiderCard>
        ) : null}

        {success ? (
          <RiderCard className="border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3 text-blue-700">
              <Check size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </RiderCard>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <RiderCard key={item} className="p-5 sm:p-6">
                <div className="space-y-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                  <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100" />
                </div>
              </RiderCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.values(DOCUMENT_TYPES).map((docType) => renderDocumentCard(docType))}
          </div>
        )}

        <RiderCard className="p-5 sm:p-6">
          {Object.keys(selectedFiles).length > 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark">Ready to upload</h3>
                <p className="mt-1 text-sm text-muted">
                  You have {Object.keys(selectedFiles).length} file(s) selected. Upload them together when you are ready.
                </p>
              </div>
              <RiderPrimaryButton onClick={handleSubmitAll} loading={isSubmittingAll} className="sm:w-auto sm:px-6">
                {isSubmittingAll ? 'Uploading...' : 'Upload selected files'}
              </RiderPrimaryButton>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark">Verification progress</h3>
                <p className="mt-1 text-sm text-muted">
                  {isStageComplete ? 'All required rider documents are approved.' : 'Keep checking here while your uploads are being reviewed.'}
                </p>
              </div>
              <RiderSecondaryButton onClick={() => navigate('/rider/verification-setup')} className="sm:w-auto sm:px-6">
                Back to setup
              </RiderSecondaryButton>
            </div>
          )}
        </RiderCard>
      </div>

      {previewFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-auto rounded-[24px] bg-white p-3 sm:p-4">
            <button
              type="button"
              onClick={() => setPreviewFile(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50"
            >
              <X size={18} />
            </button>
            {previewFile.endsWith('.pdf') ? (
              <iframe src={previewFile} className="h-[75vh] w-full rounded-2xl" title="Document preview" />
            ) : (
              <img src={previewFile} alt="Document preview" className="h-auto w-full rounded-2xl" />
            )}
          </div>
        </div>
      ) : null}
    </RiderPageShell>
  );
};

export default DocumentVerification;
