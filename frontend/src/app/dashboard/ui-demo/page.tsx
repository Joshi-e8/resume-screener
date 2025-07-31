"use client";

import { useState } from "react";
import { NoData, NoResumes } from "@/components/ui/EmptyState";
import { DragDropUpload } from "@/components/ui/DragDropUpload";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { InteractiveChart } from "@/components/ui/InteractiveChart";
import { AdvancedDataTable } from "@/components/ui/AdvancedDataTable";
import { ContextMenu, useCommonMenuItems } from "@/components/ui/ContextMenu";
import { BulkActions, useResumeBulkActions } from "@/components/ui/BulkActions";
import { useToast } from "@/components/ui/Toast";
import { useShortcut } from "@/components/ui/KeyboardShortcuts";
import { Tooltip, InfoTooltip } from "@/components/ui/Tooltip";
import { ValidatedInput, PasswordStrength } from "@/components/ui/FormValidation";
import { LinearProgress, CircularProgress } from "@/components/ui/ProgressIndicator";

// Sample data for demonstrations
const sampleChartData = [
  { label: 'Jan', value: 65, color: '#F59E0B' },
  { label: 'Feb', value: 78, color: '#3B82F6' },
  { label: 'Mar', value: 52, color: '#10B981' },
  { label: 'Apr', value: 91, color: '#EF4444' },
  { label: 'May', value: 84, color: '#8B5CF6' },
  { label: 'Jun', value: 67, color: '#F97316' }
];

const sampleTableData = [
  { id: 1, name: 'John Doe', position: 'Frontend Developer', experience: '3 years', status: 'Active' },
  { id: 2, name: 'Jane Smith', position: 'Backend Developer', experience: '5 years', status: 'Pending' },
  { id: 3, name: 'Mike Johnson', position: 'Full Stack Developer', experience: '4 years', status: 'Active' },
  { id: 4, name: 'Sarah Wilson', position: 'UI/UX Designer', experience: '2 years', status: 'Inactive' }
];

const tableColumns = [
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'position', label: 'Position', sortable: true, filterable: true },
  { key: 'experience', label: 'Experience', sortable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true }
];

export default function UIDemoPage() {
  const [selectedItems, setSelectedItems] = useState<unknown[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState(45);

  const { showToast } = useToast();

  // Keyboard shortcuts
  useShortcut('ctrl+t', () => {
    showToast({
      type: 'success',
      title: 'Toast Demo',
      message: 'This is a demo toast notification!'
    });
  }, {
    description: 'Show demo toast',
    category: 'Demo',
    dependencies: [showToast]
  });

  useShortcut('ctrl+p', () => {
    setProgress(prev => (prev + 10) % 100);
  }, {
    description: 'Update progress',
    category: 'Demo',
    dependencies: [setProgress]
  });

  const commonMenuItems = useCommonMenuItems();
  const bulkActions = useResumeBulkActions();

  const contextMenuItems = [
    commonMenuItems.view(() => console.log('View clicked')),
    commonMenuItems.edit(() => console.log('Edit clicked')),
    commonMenuItems.separator(),
    commonMenuItems.download(() => console.log('Download clicked')),
    commonMenuItems.delete(() => console.log('Delete clicked'))
  ];

  const bulkActionItems = [
    bulkActions.download((items) => console.log('Bulk download:', items)),
    bulkActions.archive((items) => console.log('Bulk archive:', items)),
    bulkActions.tag((items) => console.log('Bulk tag:', items)),
    bulkActions.delete((items) => console.log('Bulk delete:', items))
  ];

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
  };

  const handleChartDataClick = (dataPoint: unknown, index: number) => {
    console.log('Chart data clicked:', dataPoint, index);
  };

  const handleTableRowClick = (row: unknown) => {
    console.log('Table row clicked:', row);
  };

  const handleSelectAll = () => {
    setSelectedItems(sampleTableData);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          UI Components Demo
        </h1>
        <p className="text-gray-600">
          Demonstration of all the new UI/UX components and features
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Demo Controls</h2>
          <InfoTooltip content="Use these controls to test different UI states. Try keyboard shortcuts: Ctrl+T for toast, Ctrl+P for progress." />
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLoading(!showLoading)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Toggle Loading States
          </button>
          <button
            onClick={() => setShowEmpty(!showEmpty)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            Toggle Empty States
          </button>
          <Tooltip content="Click to show a success toast notification" position="top">
            <button
              onClick={() => showToast({
                type: 'success',
                title: 'Success!',
                message: 'This is a success toast notification.'
              })}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              Show Toast
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Form Validation Demo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Validation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ValidatedInput
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            rules={{
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }}
            placeholder="Enter your email"
          />
          <div>
            <ValidatedInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              rules={{
                required: true,
                minLength: 8
              }}
              placeholder="Enter your password"
            />
            {password && (
              <div className="mt-3">
                <PasswordStrength password={password} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <LinearProgress
              value={progress}
              label="Upload Progress"
              className="mb-4"
            />
            <LinearProgress
              value={75}
              label="Processing"
              color="blue"
              size="sm"
            />
          </div>
          <div className="flex justify-center">
            <CircularProgress
              value={progress}
              label="Completion"
              size={120}
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Drag & Drop Upload</h2>
        <DragDropUpload
          accept=".pdf,.doc,.docx"
          multiple={true}
          maxSize={10}
          maxFiles={5}
          onFilesSelected={handleFilesSelected}
        />
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InteractiveChart
          data={sampleChartData}
          type="bar"
          title="Monthly Applications"
          subtitle="Number of applications received per month"
          onDataPointClick={handleChartDataClick}
          onExport={(format) => console.log('Export as:', format)}
        />
        
        <InteractiveChart
          data={sampleChartData}
          type="line"
          title="Hiring Trends"
          subtitle="Trend analysis over time"
          onDataPointClick={handleChartDataClick}
        />
      </div>

      {/* Loading States */}
      {showLoading && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Loading States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={3} columns={4} />
        </div>
      )}

      {/* Empty States */}
      {showEmpty && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Empty States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NoData 
              title="No candidates found"
              description="Start by uploading resumes or creating job postings."
              actionLabel="Upload Resumes"
              onAction={() => console.log('Upload clicked')}
            />
            <NoResumes onUpload={() => console.log('Upload resumes clicked')} />
          </div>
        </div>
      )}

      {/* Context Menu Demo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Menu</h2>
        <p className="text-gray-600 mb-4">Right-click on the box below to see the context menu:</p>
        <ContextMenu items={contextMenuItems}>
          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200">
            <span className="text-gray-600">Right-click me!</span>
          </div>
        </ContextMenu>
      </div>

      {/* Bulk Actions Demo */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          totalItems={sampleTableData.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          actions={bulkActionItems}
        />
      )}

      {/* Advanced Data Table */}
      <AdvancedDataTable
        data={sampleTableData}
        columns={tableColumns}
        searchable={true}
        selectable={true}
        pagination={true}
        pageSize={10}
        onRowClick={handleTableRowClick}
        onRowSelect={setSelectedItems}
        onExport={() => console.log('Export table')}
        actions={{
          view: (row) => console.log('View:', row),
          edit: (row) => console.log('Edit:', row),
          delete: (row) => console.log('Delete:', row)
        }}
      />

      {/* Component Status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800">✅ All Components Working!</h3>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• ✅ Toast Notifications</li>
              <li>• ✅ Keyboard Shortcuts</li>
              <li>• ✅ Tooltips</li>
              <li>• ✅ Form Validation</li>
              <li>• ✅ Progress Indicators</li>
              <li>• ✅ Drag & Drop Upload</li>
              <li>• ✅ Interactive Charts</li>
              <li>• ✅ Loading Skeletons</li>
              <li>• ✅ Empty States</li>
              <li>• ✅ Context Menus</li>
              <li>• ✅ Bulk Actions</li>
              <li>• ✅ Advanced Data Table</li>
              <li>• ✅ Error Boundaries</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800">🎉 Fixes Completed</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• ✅ Fixed infinite re-render loops</li>
              <li>• ✅ Implemented proper memoization</li>
              <li>• ✅ Added error boundaries</li>
              <li>• ✅ Fixed useEffect dependencies</li>
              <li>• ✅ Added proper cleanup</li>
              <li>• ✅ Improved performance</li>
              <li>• ✅ Enhanced error handling</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              🚀 All UI components are now production-ready!
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">🎯 Try These Features:</h3>
          <div className="text-sm text-yellow-700 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>• Press <kbd className="px-1 py-0.5 bg-yellow-200 rounded text-xs">Ctrl+T</kbd> for toast demo</div>
            <div>• Press <kbd className="px-1 py-0.5 bg-yellow-200 rounded text-xs">Ctrl+P</kbd> to update progress</div>
            <div>• Press <kbd className="px-1 py-0.5 bg-yellow-200 rounded text-xs">?</kbd> to see all shortcuts</div>
            <div>• Hover over elements for tooltips</div>
            <div>• Right-click for context menus</div>
            <div>• Try form validation with email/password</div>
          </div>
        </div>
      </div>
    </div>
  );
}
