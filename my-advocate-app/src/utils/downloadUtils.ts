/**
 * Utility function to handle file downloads
 * @param url The URL to download from
 * @param filename The default filename to use
 * @param authToken The authentication token if required
 */
export const downloadFile = async (url: string, filename: string, authToken?: string): Promise<void> => {
    try {
        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to download file');
        }

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let finalFilename = filename;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                finalFilename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // Create blob and download link
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalFilename;
        link.style.display = 'none';
        
        // Append to body, trigger download, and clean up
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
    } catch (error) {
        console.error('Download error:', error);
        throw error; // Re-throw to allow caller to handle
    }
};

/**
 * Helper function to trigger file download with authentication
 * @param documentId The ID of the document to download
 * @param defaultFilename The default filename to use if not specified in headers
 * @param onError Callback for handling errors
 * @param onSuccess Callback for successful download
 */
export const downloadDocument = async (
    documentId: string, 
    defaultFilename: string,
    onError: (message: string) => void,
    onSuccess?: () => void
): Promise<void> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            onError('Authentication required. Please log in again.');
            return;
        }

        await downloadFile(
            `http://localhost:5000/api/documents/${documentId}/download`,
            defaultFilename,
            token
        );
        
        onSuccess?.();
    } catch (error) {
        console.error('Download failed:', error);
        onError(error instanceof Error ? error.message : 'Failed to download document. Please try again.');
    }
};
