// CommandCore Ingestion UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Tabs and Modes
    const fileUploadTab = document.getElementById('file-upload-tab');
    const textInputTab = document.getElementById('text-input-tab');
    const fileUploadMode = document.getElementById('file-upload-mode');
    const textInputMode = document.getElementById('text-input-mode');
    
    // DOM Elements - File Upload
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const selectedFileName = document.getElementById('selected-file-name');
    const dropArea = document.getElementById('drop-area');
    const uploadButton = document.getElementById('upload-button');
    
    // DOM Elements - Text Input
    const textForm = document.getElementById('text-form');
    const textSubmitButton = document.getElementById('text-submit-button');
    
    // DOM Elements - Status and Results
    const uploadStatus = document.getElementById('upload-status');
    const uploadComplete = document.getElementById('upload-complete');
    const uploadError = document.getElementById('upload-error');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const statusMessage = document.getElementById('status-message');
    const jobId = document.getElementById('job-id');
    const completeMessage = document.getElementById('complete-message');
    const completeDetails = document.getElementById('complete-details');
    const errorMessage = document.getElementById('error-message');
    const errorDetails = document.getElementById('error-details');
    const uploadAnotherBtn = document.getElementById('upload-another-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    
    // DOM Elements - Metadata Extraction Failure
    const metadataExtractionFailure = document.getElementById('metadata-extraction-failure');
    const metadataForm = document.getElementById('metadata-form');
    const metadataSubmitButton = document.getElementById('metadata-submit-button');
    const metadataCancelButton = document.getElementById('metadata-cancel-button');
    
    // DOM Elements - Bulk Upload Report
    const bulkUploadReport = document.getElementById('bulk-upload-report');
    const bulkSummary = document.getElementById('bulk-summary');
    const successFilesList = document.getElementById('success-files-list');
    const skippedFilesList = document.getElementById('skipped-files-list');
    const bulkDoneButton = document.getElementById('bulk-done-button');
    
    // State variables
    let currentJobId = null;
    let statusCheckInterval = null;
    let pendingFiles = [];
    let currentFile = null;
    let processedFiles = {
        success: [],
        skipped: []
    };
    
    // Event Listeners - Tab Switching
    fileUploadTab.addEventListener('click', () => switchTab('file'));
    textInputTab.addEventListener('click', () => switchTab('text'));
    
    // Event Listeners - File Upload
    fileInput.addEventListener('change', handleFileSelect);
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // Event Listeners - Text Input
    textForm.addEventListener('submit', handleTextSubmit);
    
    // Event Listeners - Status and Results
    uploadAnotherBtn.addEventListener('click', resetForms);
    tryAgainBtn.addEventListener('click', resetForms);
    
    // Event Listeners - Metadata Extraction Failure
    metadataForm.addEventListener('submit', handleMetadataSubmit);
    metadataCancelButton.addEventListener('click', cancelMetadataSubmission);
    
    // Event Listeners - Bulk Upload Report
    bulkDoneButton.addEventListener('click', resetForms);
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);
    
    // Functions - Tab Switching
    function switchTab(tab) {
        if (tab === 'file') {
            fileUploadTab.classList.add('active');
            textInputTab.classList.remove('active');
            fileUploadMode.classList.remove('hidden');
            textInputMode.classList.add('hidden');
        } else {
            fileUploadTab.classList.remove('active');
            textInputTab.classList.add('active');
            fileUploadMode.classList.add('hidden');
            textInputMode.classList.remove('hidden');
        }
    }
    
    // Functions - File Handling
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    }

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            const fileCount = fileInput.files.length;
            if (fileCount === 1) {
                selectedFileName.textContent = fileInput.files[0].name;
            } else {
                selectedFileName.textContent = `${fileCount} files selected`;
            }
        } else {
            selectedFileName.textContent = 'No file selected';
        }
    }
    
    // Functions - Form Handling
    async function handleFileUpload(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Validate form
        if (!fileInput.files.length) {
            showNotification('Please select a file to upload', 'error');
            return;
        }
        
        const domain = document.getElementById('domain-select').value;
        if (!domain) {
            showNotification('Please select a knowledge domain', 'error');
            return;
        }
        
        // For bulk uploads, queue all files
        if (fileInput.files.length > 1) {
            pendingFiles = Array.from(fileInput.files);
            processedFiles = { success: [], skipped: [] };
            processNextFile(domain);
        } else {
            // For single file upload
            const file = fileInput.files[0];
            currentFile = file;
            
            // Get metadata from form or use defaults
            const metadata = {
                title: document.getElementById('document-title').value || file.name.split('.')[0],
                author: document.getElementById('document-author').value || 'Unknown Author',
                publication_date: document.getElementById('publication-date').value || new Date().toISOString().split('T')[0],
                url: document.getElementById('document-url').value || '',
                additional_notes: document.getElementById('additional-notes').value || ''
            };
            
            console.log('Using metadata:', metadata);
            
            // Proceed with upload
            uploadFile(file, domain, metadata);
        }
    }
    
    function processNextFile(domain) {
        if (pendingFiles.length > 0) {
            const file = pendingFiles.shift();
            currentFile = file;
            
            // In a real implementation, we would send the file to backend for extraction
            // For now, just get metadata from form or use defaults
            const metadata = {
                title: document.getElementById('document-title').value || file.name.split('.')[0],
                author: document.getElementById('document-author').value || 'Unknown Author',
                publication_date: document.getElementById('publication-date').value || new Date().toISOString().split('T')[0],
                url: document.getElementById('document-url').value || '',
                additional_notes: document.getElementById('additional-notes').value || ''
            };
            
            uploadFile(file, domain, metadata);
        } else {
            // All files processed, show bulk report
            showBulkUploadReport();
        }
    }
    
    function getMetadataFromForm() {
        return {
            title: document.getElementById('document-title').value,
            author: document.getElementById('document-author').value,
            publication_date: document.getElementById('publication-date').value,
            url: document.getElementById('document-url').value,
            additional_notes: document.getElementById('additional-notes').value
        };
    }
    
    function showMetadataExtractionFailure() {
        hideAllSections();
        metadataExtractionFailure.classList.remove('hidden');
    }
    
    async function handleMetadataSubmit(e) {
        e.preventDefault();
        
        const metadata = {
            title: document.getElementById('manual-document-title').value,
            author: document.getElementById('manual-document-author').value,
            publication_date: document.getElementById('manual-publication-date').value,
            url: document.getElementById('document-url').value,
            additional_notes: document.getElementById('additional-notes').value
        };
        
        const domain = document.getElementById('domain-select').value;
        
        // Hide metadata form
        metadataExtractionFailure.classList.add('hidden');
        
        // Upload the file with manual metadata
        uploadFile(currentFile, domain, metadata);
    }
    
    function cancelMetadataSubmission() {
        metadataExtractionFailure.classList.add('hidden');
        fileUploadMode.classList.remove('hidden');
    }
    
    async function uploadFile(file, domain, metadata) {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('domain', domain);
        formData.append('source_info', JSON.stringify(metadata));
        
        // Show upload status
        hideAllSections();
        showSection(uploadStatus);
        
        // Add uploading class to progress container for visual effect
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.classList.add('uploading');
        }
        
        // Ensure the section is visible
        console.log('Making upload status visible');
        
        // Always show initial progress to indicate activity
        updateProgress(1);
        statusMessage.textContent = 'Preparing to upload document...';
        
        // Add a small delay to ensure UI updates before upload starts
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Show file size information
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`Uploading file: ${file.name}, Size: ${fileSizeMB} MB`);
        statusMessage.textContent = `Uploading document (${fileSizeMB} MB)...`;
        
        try {
            console.log('Starting document upload to ingestion service...');
            
            // Use XMLHttpRequest to track upload progress
            const xhr = new XMLHttpRequest();
            
            // Create a promise to handle the async operation
            const uploadPromise = new Promise((resolve, reject) => {
                // Track upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const uploadPercentage = Math.round((event.loaded / event.total) * 100);
                        console.log(`Upload progress: ${uploadPercentage}% (${event.loaded}/${event.total} bytes)`);
                        
                        // Ensure progress is at least 1% to show activity
                        const displayPercentage = Math.max(1, uploadPercentage);
                        
                        // Scale upload progress to 0-50% of the total process
                        const scaledPercentage = Math.floor(displayPercentage * 0.5);
                        updateProgress(scaledPercentage);
                        
                        // For small files that upload quickly, slow down the progress display
                        if (file.size < 1024 * 1024 && uploadPercentage > 90) {
                            // For small files, cap at 45% until complete
                            updateProgress(45);
                            statusMessage.textContent = `Uploading document... ${displayPercentage}%`;
                        } else {
                            statusMessage.textContent = `Uploading document... ${displayPercentage}%`;
                        }
                    } else {
                        console.log('Upload progress event fired but length not computable');
                        // Show indeterminate progress
                        statusMessage.textContent = 'Uploading document... (size unknown)';
                    }
                });
                
                // Handle upload complete (but before server response)
                xhr.upload.addEventListener('load', () => {
                    console.log('Upload complete, waiting for server processing...');
                    statusMessage.textContent = 'Upload complete, waiting for server response...';
                    updateProgress(50); // Upload is 50% of the total process
                });
                
                // Handle completion
                xhr.addEventListener('load', () => {
                    console.log(`Server response received: ${xhr.status}`);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            console.log('Response data:', data);
                            resolve(data);
                        } catch (e) {
                            console.error('Error parsing JSON response:', e);
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            console.error('Error response:', errorData);
                            reject(errorData);
                        } catch (e) {
                            console.error('Error parsing error response:', e);
                            reject(new Error(`HTTP error ${xhr.status}`));
                        }
                    }
                });
                
                // Handle errors
                xhr.addEventListener('error', (e) => {
                    console.error('Network error during upload:', e);
                    reject(new Error('Network error during upload'));
                });
                
                xhr.addEventListener('abort', () => {
                    console.log('Upload aborted');
                    reject(new Error('Upload aborted'));
                });
                
                // Add timeout handler
                xhr.addEventListener('timeout', () => {
                    console.error('Upload timed out');
                    reject(new Error('Upload timed out'));
                });
            });
            
            // Open and send the request
            xhr.open('POST', '/api/ingestion/v1/documents/upload');
            xhr.timeout = 300000; // 5 minute timeout
            xhr.send(formData);
            
            // Wait for the upload to complete
            const data = await uploadPromise;
            
            // Update status with job ID
            currentJobId = data.job_id;
            jobId.textContent = currentJobId;
            
            // Update status message to show we're now processing
            statusMessage.textContent = 'Upload complete. Processing document...';
            // Don't reset progress - continue from 50%
            // updateProgress(0); // Reset progress for processing phase
            
            // Start polling for status
            startStatusPolling();
        } catch (error) {
            console.error('Error during upload:', error);
            
            if (pendingFiles.length > 0) {
                // For bulk uploads, mark as skipped and continue
                processedFiles.skipped.push({
                    name: file.name,
                    reason: error.message || 'Network error'
                });
                
                processNextFile(domain);
            } else {
                // For single file, show error
                showError(error.message || 'An error occurred during upload. Please check the console for details and ensure the ingestion service is running.');
            }
        }
    }
    
    async function handleTextSubmit(e) {
        e.preventDefault();
        
        const textContent = document.getElementById('text-content').value.trim();
        if (!textContent) {
            showNotification('Please enter text content', 'error');
            return;
        }
        
        const domain = document.getElementById('text-domain-select').value;
        if (!domain) {
            showNotification('Please select a knowledge domain', 'error');
            return;
        }
        
        // Get metadata
        const metadata = {
            title: document.getElementById('text-document-title').value,
            author: document.getElementById('text-document-author').value,
            publication_date: document.getElementById('text-publication-date').value,
            url: document.getElementById('text-document-url').value,
            additional_notes: document.getElementById('text-additional-notes').value
        };
        
        // Validate required fields
        if (!metadata.title || !metadata.author || !metadata.publication_date) {
            showNotification('Please fill in all required metadata fields', 'error');
            return;
        }
        
        // Show upload status
        hideAllSections();
        showSection(uploadStatus);
        updateProgress(0);
        
        try {
            // For text input, we'll create a temporary file from the text content
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            const textFile = new File([textBlob], `${metadata.title}.txt`, { type: 'text/plain' });
            
            // Set as current file for upload
            currentFile = textFile;
            
            // Upload the file using the same endpoint
            await uploadFile(textFile, domain, metadata);
        } catch (error) {
            console.error('Error processing text:', error);
            showError('An error occurred while processing the text. Please try again.');
        }
    }
    
    function startStatusPolling() {
        // Poll every 2 seconds
        statusCheckInterval = setInterval(checkStatus, 2000);
    }

    async function checkStatus() {
        if (!currentJobId) return;
        
        try {
            console.log('Checking status for job:', currentJobId);
            const response = await fetch(`/api/ingestion/v1/documents/status/${currentJobId}`);
            console.log('Status response:', response.status);
            const data = await response.json();
            console.log('Status data:', data);
            
            if (response.ok) {
                updateStatus(data);
            } else {
                clearInterval(statusCheckInterval);
                showError('Failed to get status updates');
            }
        } catch (error) {
            console.error('Error checking status:', error);
            clearInterval(statusCheckInterval);
            showError('Error checking processing status');
        }
    }

    function updateStatus(statusData) {
        const status = statusData.status;
        console.log('Processing status update:', status);
        
        // Ensure uploading class is removed during processing
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.classList.remove('uploading');
        }
        
        if (status === 'processing') {
            // Update progress
            if (statusData.progress) {
                // Scale processing progress from 50% to 100%
                // Processing is the second half of the total process
                const processingPercentage = statusData.progress.percentage;
                const scaledPercentage = 50 + Math.floor(processingPercentage * 0.5);
                updateProgress(scaledPercentage);
                statusMessage.textContent = `Processing: ${statusData.progress.current_stage}...`;
                console.log('Updated progress:', processingPercentage, statusData.progress.current_stage, 'Scaled:', scaledPercentage);
            }
        } else if (status === 'completed') {
            console.log('Processing completed!');
            clearInterval(statusCheckInterval);
            
            // Set progress to 100% when complete
            updateProgress(100);
            statusMessage.textContent = 'Processing complete!';
            
            if (pendingFiles.length > 0) {
                // For bulk uploads, mark as success and continue
                processedFiles.success.push({
                    name: currentFile.name,
                    details: statusData.details
                });
                
                // Process next file
                processNextFile(document.getElementById('domain-select').value);
            } else {
                // For single file, show completed
                console.log('Showing completion UI');
                showCompleted(statusData);
            }
        } else if (status === 'failed') {
            clearInterval(statusCheckInterval);
            
            if (pendingFiles.length > 0) {
                // For bulk uploads, mark as skipped and continue
                processedFiles.skipped.push({
                    name: currentFile.name,
                    reason: statusData.error?.message || 'Processing failed'
                });
                
                // Process next file
                processNextFile(document.getElementById('domain-select').value);
            } else {
                // For single file, show error
                showError(statusData.error?.message || 'Processing failed');
            }
        }
    }

    function updateProgress(percentage) {
        console.log('Updating progress bar to:', percentage + '%');
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
    }
    
    function showBulkUploadReport() {
        hideAllSections();
        showSection(bulkUploadReport);
        
        // Show summary
        const totalFiles = processedFiles.success.length + processedFiles.skipped.length;
        bulkSummary.textContent = `Processed ${totalFiles} files: ${processedFiles.success.length} successful, ${processedFiles.skipped.length} skipped.`;
        
        // Show success list
        successFilesList.innerHTML = '';
        if (processedFiles.success.length > 0) {
            processedFiles.success.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="file-success-icon">✓</span> ${file.name}`;
                successFilesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No files were successfully processed.';
            successFilesList.appendChild(li);
        }
        
        // Show skipped list
        skippedFilesList.innerHTML = '';
        if (processedFiles.skipped.length > 0) {
            processedFiles.skipped.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="file-error-icon">✗</span> ${file.name} - Reason: ${file.reason}`;
                skippedFilesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No files were skipped.';
            skippedFilesList.appendChild(li);
        }
    }
    
    function hideAllSections() {
        console.log('Hiding all sections');
        
        // Remove both hidden class and add display: none directly
        uploadStatus.classList.add('hidden');
        uploadStatus.style.display = 'none';
        
        uploadComplete.classList.add('hidden');
        uploadComplete.style.display = 'none';
        
        uploadError.classList.add('hidden');
        uploadError.style.display = 'none';
        
        metadataExtractionFailure.classList.add('hidden');
        metadataExtractionFailure.style.display = 'none';
        
        bulkUploadReport.classList.add('hidden');
        bulkUploadReport.style.display = 'none';
        
        fileUploadMode.classList.add('hidden');
        fileUploadMode.style.display = 'none';
        
        textInputMode.classList.add('hidden');
        textInputMode.style.display = 'none';
    }
    
    function showSection(section) {
        // First remove hidden class
        section.classList.remove('hidden');
        // Then explicitly set display
        section.style.display = 'block';
        console.log(`Showing section:`, section.id);
    }
    
    function showError(message, details = '') {
        hideAllSections();
        uploadError.classList.remove('hidden');
        uploadError.style.display = 'block';
        
        errorMessage.textContent = message;
        
        if (details) {
            errorDetails.textContent = details;
            errorDetails.classList.remove('hidden');
        } else {
            errorDetails.classList.add('hidden');
        }
    }
    
    function showCompleted(data) {
        hideAllSections();
        uploadComplete.classList.remove('hidden');
        uploadComplete.style.display = 'block';
        
        // Clear any previous details
        completeDetails.innerHTML = '';
        
        // Add document details
        if (data.details) {
            const details = data.details;
            
            const docInfo = document.createElement('div');
            docInfo.className = 'document-info';
            
            // Document title
            if (details.document_title) {
                const title = document.createElement('p');
                title.innerHTML = `<strong>Title:</strong> ${details.document_title}`;
                docInfo.appendChild(title);
            }
            
            // Author if available
            if (details.document_author && details.document_author !== 'Unknown') {
                const author = document.createElement('p');
                author.innerHTML = `<strong>Author:</strong> ${details.document_author}`;
                docInfo.appendChild(author);
            }
            
            // Publication date if available
            if (details.document_date && details.document_date !== 'Unknown') {
                const date = document.createElement('p');
                date.innerHTML = `<strong>Date:</strong> ${details.document_date}`;
                docInfo.appendChild(date);
            }
            
            // Domain
            if (details.domain) {
                const domain = document.createElement('p');
                domain.innerHTML = `<strong>Domain:</strong> ${details.domain}`;
                docInfo.appendChild(domain);
            }
            
            // Chunks created
            if (details.chunks_created) {
                const chunks = document.createElement('p');
                chunks.innerHTML = `<strong>Chunks created:</strong> ${details.chunks_created}`;
                docInfo.appendChild(chunks);
            }
            
            // Metadata extraction info
            if (details.hasOwnProperty('metadata_extracted')) {
                const metadata = document.createElement('p');
                metadata.innerHTML = `<strong>Metadata extracted:</strong> ${details.metadata_extracted ? 'Yes' : 'No'}`;
                docInfo.appendChild(metadata);
            }
            
            completeDetails.appendChild(docInfo);
        }
    }
    
    function resetForms() {
        // Reset UI state
        hideAllSections();
        
        // Show the active tab using the showSection function
        if (fileUploadTab.classList.contains('active')) {
            showSection(fileUploadMode);
        } else {
            showSection(textInputMode);
        }
        
        // Reset form fields
        uploadForm.reset();
        textForm.reset();
        selectedFileName.textContent = 'No file selected';
        
        // Clear job ID and files
        currentJobId = null;
        pendingFiles = [];
        currentFile = null;
        processedFiles = { success: [], skipped: [] };
        
        // Ensure interval is cleared
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
    }
});
