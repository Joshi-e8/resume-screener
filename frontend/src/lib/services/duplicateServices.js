import CONSTANTS from '../constants';
import useAxiosClient from '../hooks/useAxiosClient';
import errorHandler from '../utils/errorHandler';

const useDuplicateServices = () => {
  const axios = useAxiosClient("admin");



  // Get all duplicate groups
  const getDuplicateGroups = async () => {
    try {
      console.log('Fetching duplicate groups...');
      const response = await axios.get(CONSTANTS.RESUMES.DUPLICATES);
      console.log('Duplicate groups response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Check for duplicates
  const checkForDuplicates = async (fileHash, candidateName = null, candidateEmail = null) => {
    try {
      console.log('Checking for duplicates:', { fileHash, candidateName, candidateEmail });
      
      const requestData = {};
      if (fileHash) requestData.file_hash = fileHash;
      if (candidateName) requestData.candidate_name = candidateName;
      if (candidateEmail) requestData.candidate_email = candidateEmail;
      
      const response = await axios.post(CONSTANTS.RESUMES.CHECK_DUPLICATES, requestData);
      console.log('Duplicate check response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Delete a duplicate resume
  const deleteDuplicateResume = async (resumeId) => {
    try {
      console.log('Deleting duplicate resume:', resumeId);
      const response = await axios.delete(CONSTANTS.RESUMES.DELETE_DUPLICATE(resumeId));
      console.log('Delete duplicate response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Calculate file hash (client-side)
  const calculateFileHash = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Error calculating file hash:', error);
      return null;
    }
  };

  // Check if file is duplicate before upload
  const checkFileBeforeUpload = async (file) => {
    try {
      console.log(`🔍 Starting duplicate check for file: ${file.name}`);
      const fileHash = await calculateFileHash(file);
      console.log(`🔍 Calculated file hash: ${fileHash}`);

      if (!fileHash) {
        console.warn('❌ Could not calculate file hash');
        return { success: false, error: 'Could not calculate file hash' };
      }

      console.log(`🔍 Checking for duplicates with hash: ${fileHash}`);
      const duplicateCheck = await checkForDuplicates(fileHash);
      console.log(`🔍 Duplicate check API response:`, duplicateCheck);

      if (!duplicateCheck.success) {
        console.warn('❌ Duplicate check API failed:', duplicateCheck.error);
        return duplicateCheck;
      }

      console.log(`✅ Duplicate check completed successfully`);
      return {
        success: true,
        data: {
          file_hash: fileHash,
          duplicate_info: duplicateCheck.data
        }
      };
    } catch (error) {
      console.error('❌ Error in checkFileBeforeUpload:', error);
      return errorHandler(error);
    }
  };

  // Bulk delete duplicates
  const bulkDeleteDuplicates = async (resumeIds) => {
    try {
      console.log('Bulk deleting duplicates:', resumeIds);
      
      const results = [];
      for (const resumeId of resumeIds) {
        const result = await deleteDuplicateResume(resumeId);
        results.push({ resumeId, ...result });
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      return {
        success: true,
        data: {
          total: results.length,
          success_count: successCount,
          fail_count: failCount,
          results
        }
      };
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get duplicate statistics
  const getDuplicateStats = async () => {
    try {
      const groupsResult = await getDuplicateGroups();
      if (!groupsResult.success) {
        return groupsResult;
      }

      const groups = groupsResult.data.duplicate_groups || [];
      const totalGroups = groups.length;
      const totalDuplicates = groups.reduce((sum, group) => sum + (group.count - 1), 0);
      const totalOriginals = groups.length;
      
      // Calculate potential space savings (rough estimate)
      const avgFileSize = 500 * 1024; // 500KB average
      const potentialSpaceSavings = totalDuplicates * avgFileSize;

      return {
        success: true,
        data: {
          total_groups: totalGroups,
          total_duplicates: totalDuplicates,
          total_originals: totalOriginals,
          potential_space_savings: potentialSpaceSavings,
          groups
        }
      };
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    getDuplicateGroups,
    checkForDuplicates,
    deleteDuplicateResume,
    calculateFileHash,
    checkFileBeforeUpload,
    bulkDeleteDuplicates,
    getDuplicateStats,
  };
};

export default useDuplicateServices;
