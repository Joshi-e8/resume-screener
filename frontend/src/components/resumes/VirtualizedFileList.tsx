"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { CheckCircle, FileText } from 'lucide-react';
import { GoogleDriveFile } from '@/lib/services/googleDriveServices';
import { googleDriveService } from '@/lib/services/googleDriveServices';

interface VirtualizedFileListProps {
  files: GoogleDriveFile[];
  selectedFiles: GoogleDriveFile[];
  onFileSelect: (file: GoogleDriveFile) => void;
  height: number;
  itemHeight?: number;
  searchQuery?: string;
}

interface FileItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    files: GoogleDriveFile[];
    selectedFiles: GoogleDriveFile[];
    onFileSelect: (file: GoogleDriveFile) => void;
    searchQuery?: string;
  };
}

const FileItem: React.FC<FileItemProps> = ({ index, style, data }) => {
  const { files, selectedFiles, onFileSelect, searchQuery } = data;
  const file = files[index];
  
  if (!file) return null;
  
  const isSelected = selectedFiles.some(f => f.id === file.id);
  const isSupported = googleDriveService.isFileTypeSupported(file.mimeType);
  
  // Highlight search terms
  const highlightText = useCallback((text: string, query?: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    );
  }, []);
  
  return (
    <div style={style} className="px-4">
      <div
        onClick={() => isSupported && onFileSelect(file)}
        className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : isSupported
            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-xl">
              {googleDriveService.getFileIcon(file.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {highlightText(file.name, searchQuery)}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>{googleDriveService.formatFileSize(file.size)}</span>
                <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                {!isSupported && (
                  <span className="text-red-500 text-xs">Unsupported format</span>
                )}
              </div>
            </div>
          </div>
          {isSelected && (
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

export const VirtualizedFileList: React.FC<VirtualizedFileListProps> = ({
  files,
  selectedFiles,
  onFileSelect,
  height,
  itemHeight = 80,
  searchQuery
}) => {
  const itemData = useMemo(() => ({
    files,
    selectedFiles,
    onFileSelect,
    searchQuery
  }), [files, selectedFiles, onFileSelect, searchQuery]);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No files found</h4>
        <p className="text-gray-600">
          Try adjusting your search terms or browse different folders
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FileText className="w-4 h-4" />
          <span className="font-medium">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <span className="text-gray-500">
              matching "{searchQuery}"
            </span>
          )}
        </div>
      </div>
      
      <List
        height={height}
        itemCount={files.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
      >
        {FileItem}
      </List>
    </div>
  );
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemsRendered: 0,
    lastUpdate: Date.now()
  });

  const updateMetrics = useCallback((itemCount: number) => {
    const now = Date.now();
    setMetrics(prev => ({
      renderTime: now - prev.lastUpdate,
      itemsRendered: itemCount,
      lastUpdate: now
    }));
  }, []);

  return { metrics, updateMetrics };
};

export default VirtualizedFileList;
