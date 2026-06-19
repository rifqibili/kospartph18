import React, { useState, useRef } from 'react';

const DragDropZone = ({ onFileDrop, accept, label, selectedFile, multiple = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave' || e.type === 'drop') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (multiple) {
                onFileDrop(Array.from(e.dataTransfer.files));
            } else {
                onFileDrop(e.dataTransfer.files[0]);
            }
        }
    };

    return (
        <div 
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-emerald-400'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input type="file" className="hidden" ref={fileInputRef} accept={accept} multiple={multiple} onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                    if (multiple) {
                        onFileDrop(Array.from(e.target.files));
                    } else {
                        onFileDrop(e.target.files[0]);
                    }
                }
            }} />
            <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                <svg className={`w-8 h-8 transition-colors duration-200 ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-xs font-semibold text-slate-600">{label || 'Klik atau tarik file ke sini'}</p>
                {selectedFile && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {multiple && Array.isArray(selectedFile) ? `${selectedFile.length} file dipilih` : selectedFile.name}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DragDropZone;
