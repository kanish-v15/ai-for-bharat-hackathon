import { useState } from 'react';
import { X, Download, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export default function DocumentViewer({ fileDataUrl, fileType, fileName, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  if (!fileDataUrl) return null;

  const isImage = fileType?.startsWith('image/');
  const isPdf = fileType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[95%] max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-saffron-500 shrink-0" />
            <span className="font-heading font-semibold text-sm text-dark truncate">{fileName || 'Document'}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls for images */}
            {isImage && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => setZoom(z => Math.max(25, z - 25))}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs font-heading font-semibold text-gray-500 w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(300, z + 25))}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}
            <a
              href={fileDataUrl}
              download={fileName || 'document'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron-50 text-saffron-600 rounded-lg text-xs font-medium hover:bg-saffron-100 transition-colors"
            >
              <Download size={14} /> Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {isPdf && (
            <iframe
              src={fileDataUrl}
              className="w-full h-full"
              title={fileName || 'PDF Document'}
            />
          )}
          {isImage && (
            <div className="flex items-center justify-center p-4 min-h-full overflow-auto">
              <img
                src={fileDataUrl}
                alt={fileName || 'Document'}
                className="max-h-none object-contain rounded-lg shadow-lg transition-transform duration-200"
                style={{ width: `${zoom}%`, maxWidth: `${zoom}%` }}
              />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <FileText size={48} />
              <p className="text-sm">Preview not available for this file type</p>
              <a href={fileDataUrl} download={fileName} className="text-saffron-500 text-sm font-medium">Download to view</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
