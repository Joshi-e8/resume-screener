import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  className = ""
}: PaginationProps) {
  // Don't render if there's only one page or no items
//   if (totalPages <= 1) {
//     return null;
//   }

  // Calculate the range of items being shown
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination logic
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show current page and 2 pages on each side
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-gray-700">
          {/* <div className="font-medium">
            Page {currentPage} of {totalPages}
          </div> */}
          <div className="text-gray-500 mt-1">
            Showing {startItem} to {endItem} of {totalItems} enteries
          </div>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1 || loading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-yellow-500 text-white"
                    : loading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === totalPages || loading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            Show:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>
      </div>
    </div>
  );
}