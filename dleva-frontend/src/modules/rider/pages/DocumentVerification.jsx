/**
 * Rider Document Verification Page
 * Handles document uploads and verification status tracking
 */

import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertCircle, Loader2, X, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderVerification from '../services/riderVerification';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_DESCRIPTIONS,
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_BADGES,
  FILE_VALIDATION,
  VERIFICATION_ERRORS,
  VERIFICATION_SUCCESS,
  VERIFICATION_INFO,
  DOCUMENT_REQUIREMENTS,
} from '../constants/verificationConstants';

const DocumentVerification = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(DOCUMENT_TYPES.ID_CARD);
  const [isStageComplete, setIsStageComplete] = useState(false);
  const [recentlyUploaded, setRecentlyUploaded] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({}); // ✅ NEW: Local file state
  const [isSubmittingAll, setIsSubmittingAll] = useState(false); // ✅ NEW: Submit all state

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Check if document verification stage is complete (all required docs approved)
  useEffect(() => {
    checkStageCompletion();
  }, [documents]);

  // Clear success/error messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await riderVerification.getVerificationStatus();
      setDocuments(data.documents || {});
      setError(null);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(err.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Check if all required documents are approved
  const checkStageCompletion = () => {
    const requiredDocs = Object.entries(DOCUMENT_REQUIREMENTS)
      .filter(([_, req]) => req.required)
      .map(([docType, _]) => docType);

    const allRequiredApproved = requiredDocs.every(
      (docType) => documents[docType]?.status === DOCUMENT_STATUSES.APPROVED
    );

    setIsStageComplete(allRequiredApproved);
  };

  const handleNavigateNext = () => {
    if (isStageComplete) {
      // Navigate back to verification setup to see all stages and proceed
      navigate('/rider/verification-setup');
    }
  };

  const handleFileSelect = (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = riderVerification.validateFile(
      file,
      FILE_VALIDATION.MAX_SIZE,
      FILE_VALIDATION.ALLOWED_FORMATS
    );

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // ✅ Store file locally instead of uploading immediately
    setSelectedFiles(prev => ({ ...prev, [docType]: file }));
    setSuccess(`${DOCUMENT_TYPE_LABELS[docType]} selected. Click Submit to upload.`);
  };

  const handleRemoveFile = (docType) => {
    setSelectedFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
  };

  const handleReplaceFile = (docType) => {
    const fileInput = document.getElementById(`file-${docType}`);
    fileInput?.click();
  };

  const handleUploadDocument = async (file, docType) => {
    try {
      setUploading(prev => ({ ...prev, [docType]: true }));

      console.log(`📤 Uploading ${DOCUMENT_TYPE_LABELS[docType]}...`);

      const response = await riderVerification.uploadDocument(file, docType);

      // Update documents state
      setDocuments(prev => ({
        ...prev,
        [docType]: response.document || { ...response, document_type: docType }
      }));

      setRecentlyUploaded(docType);
      console.log('✓ Upload successful:', response);

      // Refresh documents after delay to get updated status from backend
      setTimeout(() => {
        fetchDocuments();
        // Keep showing recently uploaded indicator for 5 more seconds
        setTimeout(() => {
          setRecentlyUploaded(null);
        }, 5000);
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || VERIFICATION_ERRORS.UPLOAD_FAILED);
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  // ✅ NEW: Submit all selected files at once
  const handleSubmitAll = async () => {
    const filesToUpload = Object.entries(selectedFiles);

    if (filesToUpload.length === 0) {
      setError('Please select at least one document to upload.');
      return;
    }

    setIsSubmittingAll(true);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;
    const failedDocs = [];

    try {
      // Upload all files in parallel
      await Promise.all(
        filesToUpload.map(async ([docType, file]) => {
          try {
            await handleUploadDocument(file, docType);
            successCount++;
          } catch (err) {
            failCount++;
            failedDocs.push(DOCUMENT_TYPE_LABELS[docType]);
          }
        })
      );

      // Clear selected files on success
      setSelectedFiles({});

      if (failCount === 0) {
        setSuccess(`✓ All ${successCount} document(s) uploaded successfully!`);
      } else {
        setError(
          `${successCount} uploaded successfully, but ${failCount} failed: ${failedDocs.join(', ')}`
        );
      }
    } catch (err) {
      console.error('Batch upload failed:', err);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const getDocumentStatus = (docType) => {
    const doc = documents[docType];
    return doc?.status || null;
  };

  const isDocumentApproved = (docType) => {
    return getDocumentStatus(docType) === DOCUMENT_STATUSES.APPROVED;
  };

  const isDocumentRejected = (docType) => {
    return getDocumentStatus(docType) === DOCUMENT_STATUSES.REJECTED;
  };

  const renderDocumentCard = (docType) => {
    const status = getDocumentStatus(docType);
    const doc = documents[docType];
    const requirement = DOCUMENT_REQUIREMENTS[docType];
    const selectedFile = selectedFiles[docType]; // ✅ Get locally selected file

    return (
      <div
        key={docType}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {DOCUMENT_TYPE_LABELS[docType]}
            </h3>
            {!requirement.required && (
              <span className="text-xs text-gray-500">(Optional)</span>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {DOCUMENT_TYPE_DESCRIPTIONS[docType]}
            </p>
          </div>

          {status && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${DOCUMENT_STATUS_BADGES[status]}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>

        {/* ✅ Show locally selected file (not yet uploaded) */}
        {selectedFile && !status && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">📄 File Selected</p>
                <p className="text-xs text-blue-700 mt-1">{selectedFile.name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleReplaceFile(docType)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors"
              >
                Replace
              </button>
              <button
                onClick={() => handleRemoveFile(docType)}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* ✅ Show selected file for rejected documents (so user can replace with new file) */}
        {selectedFile && status === DOCUMENT_STATUSES.REJECTED && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">📄 New File Selected</p>
                <p className="text-xs text-blue-700 mt-1">{selectedFile.name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleReplaceFile(docType)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors"
              >
                Replace
              </button>
              <button
                onClick={() => handleRemoveFile(docType)}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Document not uploaded yet */}
        {!status && !selectedFile && (
          <div>
            <label
              htmlFor={`file-${docType}`}
              className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors border-blue-300 cursor-pointer hover:border-blue-400`}
            >
              <Upload size={32} className="mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Click to upload</p>
              <p className="text-xs text-gray-500 mt-1">Max 5MB • JPEG, PNG, PDF</p>
              <input
                id={`file-${docType}`}
                type="file"
                accept={FILE_VALIDATION.ALLOWED_EXTENSIONS.join(',')}
                onChange={(e) => handleFileSelect(e, docType)}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Document uploaded - Pending review */}
        {status === DOCUMENT_STATUSES.PENDING && (
          <div className={`rounded-lg p-4 ${
            recentlyUploaded === docType
              ? 'bg-blue-50 border border-blue-300'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <Loader2 size={20} className={`${
                recentlyUploaded === docType
                  ? 'text-blue-600'
                  : 'text-yellow-600'
              } animate-spin`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  recentlyUploaded === docType
                    ? 'text-blue-900'
                    : 'text-yellow-900'
                }`}>
                  {recentlyUploaded === docType ? '✓ Upload Successful - Pending Review' : 'Under Review'}
                </p>
                <p className={`text-xs mt-1 ${
                  recentlyUploaded === docType
                    ? 'text-blue-700'
                    : 'text-yellow-700'
                }`}>
                  {recentlyUploaded === docType 
                    ? 'Your document has been received and our team will review it shortly.'
                    : VERIFICATION_INFO.VERIFICATION_PROCESS
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document approved */}
        {status === DOCUMENT_STATUSES.APPROVED && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check size={20} className="text-green-600" />
              <p className="text-sm font-medium text-green-900">Verified</p>
            </div>
          </div>
        )}

        {/* Document rejected - Allow re-upload */}
        {status === DOCUMENT_STATUSES.REJECTED && !selectedFile && (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Rejected</p>
                  {doc?.rejection_reason && (
                    <p className="text-xs text-red-700 mt-2">
                      {VERIFICATION_INFO.REJECTION_REASON} {doc.rejection_reason}
                    </p>
                  )}
                  <p className="text-xs text-red-700 mt-2">{VERIFICATION_INFO.RESUBMIT_ALLOWED}</p>
                </div>
              </div>
            </div>
            <label
              htmlFor={`file-${docType}`}
              className="block border-2 border-dashed border-orange-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition-colors"
            >
              <Upload size={32} className="mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium text-gray-700">Click to upload new file</p>
              <p className="text-xs text-gray-500 mt-1">Max 5MB • JPEG, PNG, PDF</p>
              <input
                id={`file-${docType}`}
                type="file"
                accept={FILE_VALIDATION.ALLOWED_EXTENSIONS.join(',')}
                onChange={(e) => handleFileSelect(e, docType)}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Action buttons */}
        {status && (
          <div className="flex gap-3 mt-4">
            {doc?.file_url && (
              <button
                onClick={() => setPreviewFile(doc.file_url)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                Preview
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 mt-2">
            Upload required documents to complete your account verification
          </p>
          {isStageComplete && (
            <div className="mt-4 inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <p className="text-green-700 font-semibold flex items-center gap-2">
                <Check size={18} /> All documents approved!
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-start gap-3">
            <Check size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700">{success}</p>
              {success.includes('selected') && (
                <p className="text-xs text-blue-600 mt-1">You can review and edit your selections below before clicking Upload All.</p>
              )}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 {VERIFICATION_INFO.UPLOAD_HINT}. All documents must be clear and legible for review.
          </p>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(DOCUMENT_TYPES).map(docType => renderDocumentCard(docType))}
        </div>

        {/* Submit All Files or Navigation */}
        {Object.keys(selectedFiles).length > 0 ? (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Submit?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You have {Object.keys(selectedFiles).length} file(s) ready to upload. Click submit to upload all documents at once.
                </p>
              </div>
              <button
                onClick={handleSubmitAll}
                disabled={isSubmittingAll}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                  ${isSubmittingAll
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  }
                `}
              >
                {isSubmittingAll ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Upload All <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isStageComplete 
                    ? '✓ All required documents approved. Ready to proceed to next step.' 
                    : '⏳ Awaiting document approval. This may take 24-48 hours.'}
                </p>
              </div>
              <button
                onClick={handleNavigateNext}
                disabled={!isStageComplete}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                  ${isStageComplete
                    ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'
                  }
                `}
              >
                {isStageComplete ? 'Next Step' : 'Pending'} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto relative">
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full z-10"
              >
                <X size={24} />
              </button>
              {previewFile.endsWith('.pdf') ? (
                <iframe src={previewFile} className="w-full h-96" title="PDF Preview" />
              ) : (
                <img src={previewFile} alt="Document Preview" className="w-full h-auto" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;
