import React from 'react';
import { FileText, X } from 'lucide-react';

const FileAttachment = ({ file, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-blue-50 border rounded-lg p-2 mb-3">
      <div className="flex items-center gap-3">
        <FileText className="text-blue-500" size={20} />
        <div>
          <p className="text-sm font-medium text-gray-700">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
        <X size={18} />
      </button>
    </div>
  );
};

export default FileAttachment;
