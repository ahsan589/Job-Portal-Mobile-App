// src/services/jobService.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const JobService = {
  // Get all jobs with optional filters and keyword search
  getJobs: async (filters = {}, keyword = '') => {
    try {
      let jobsQuery = collection(db, 'jobs');
      let hasFilters = false;

      // Apply simple filters that can be done server-side
      if (filters.location && filters.location.length > 0) {
        // For location array, we'll filter client-side
        hasFilters = true;
      }
      if (filters.jobType && filters.jobType.length > 0) {
        // For jobType array, we'll filter client-side
        hasFilters = true;
      }
      if (filters.experienceLevel && filters.experienceLevel.length > 0) {
        // For experienceLevel array, we'll filter client-side
        hasFilters = true;
      }
      if (filters.industry && filters.industry.length > 0) {
        // For industry array, we'll filter client-side
        hasFilters = true;
      }
      if (filters.remote || filters.hybrid) {
        hasFilters = true;
      }
      if (filters.salary && (filters.salary.min || filters.salary.max)) {
        hasFilters = true;
      }
      if (filters.datePosted) {
        hasFilters = true;
      }

      // Only add orderBy if no filters are applied (to avoid index requirements)
      if (!hasFilters) {
        jobsQuery = query(jobsQuery, orderBy('postedAt', 'desc'));
      }

      const querySnapshot = await getDocs(jobsQuery);
      let jobs = [];

      querySnapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Apply advanced filters client-side
      jobs = jobs.filter(job => {
        // Location filter
        if (filters.location && filters.location.length > 0) {
          if (!job.location || !filters.location.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()))) {
            return false;
          }
        }

        // Job Type filter
        if (filters.jobType && filters.jobType.length > 0) {
          if (!job.jobType || !filters.jobType.includes(job.jobType)) {
            return false;
          }
        }

        // Experience Level filter
        if (filters.experienceLevel && filters.experienceLevel.length > 0) {
          if (!job.experienceLevel || !filters.experienceLevel.includes(job.experienceLevel)) {
            return false;
          }
        }

        // Industry filter
        if (filters.industry && filters.industry.length > 0) {
          if (!job.industry || !filters.industry.includes(job.industry)) {
            return false;
          }
        }

        // Remote/Hybrid filter
        if (filters.remote && !job.remote) {
          return false;
        }
        if (filters.hybrid && !job.hybrid) {
          return false;
        }

        // Salary filter
        if (filters.salary) {
          const jobSalary = parseFloat(job.salary?.replace(/[^0-9.]/g, '') || 0);
          if (filters.salary.min && jobSalary < parseFloat(filters.salary.min)) {
            return false;
          }
          if (filters.salary.max && jobSalary > parseFloat(filters.salary.max)) {
            return false;
          }
        }

        // Date Posted filter
        if (filters.datePosted) {
          const jobDate = job.postedAt?.toDate ? job.postedAt.toDate() : new Date();
          const now = new Date();
          const daysDiff = (now - jobDate) / (1000 * 60 * 60 * 24);

          switch (filters.datePosted) {
            case '1':
              if (daysDiff > 1) return false;
              break;
            case '3':
              if (daysDiff > 3) return false;
              break;
            case '7':
              if (daysDiff > 7) return false;
              break;
            case '30':
              if (daysDiff > 30) return false;
              break;
          }
        }

        return true;
      });

      // Filter by keyword client-side (Firestore does not support full text search)
      if (keyword.trim()) {
        const lowerKeyword = keyword.toLowerCase();
        jobs = jobs.filter(job =>
          job.title.toLowerCase().includes(lowerKeyword) ||
          job.company.toLowerCase().includes(lowerKeyword) ||
          job.description.toLowerCase().includes(lowerKeyword) ||
          (job.requirements && job.requirements.some(req => req.toLowerCase().includes(lowerKeyword)))
        );
      }

      // Sort by posted date (most recent first)
      jobs.sort((a, b) => {
        const dateA = a.postedAt?.toDate ? a.postedAt.toDate() : new Date(0);
        const dateB = b.postedAt?.toDate ? b.postedAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      return { success: true, data: jobs };
    } catch (error) {
      console.error('Error in getJobs:', error);
      return { success: false, error: error.message };
    }
  },

  // Get job by ID
  getJobById: async (jobId) => {
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        return { success: true, data: { id: jobDoc.id, ...jobDoc.data() } };
      }
      return { success: false, error: 'Job not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Post a new job (for employers)
  postJob: async (userId, jobData) => {
    try {
      const jobWithMeta = {
        ...jobData,
        employerId: userId,
        postedAt: new Date(),
        status: 'active',
        applicationsCount: 0
      };

      const docRef = await addDoc(collection(db, 'jobs'), jobWithMeta);
      return { success: true, id: docRef.id, message: 'Job posted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        ...jobData,
        updatedAt: new Date()
      });
      return { success: true, message: 'Job updated successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete job
  deleteJob: async (jobId) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get jobs posted by employer
  getEmployerJobs: async (employerId) => {
    try {
      // First try with the composite query (requires index)
      try {
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('employerId', '==', employerId),
          orderBy('postedAt', 'desc')
        );

        const querySnapshot = await getDocs(jobsQuery);
        const jobs = [];

        querySnapshot.forEach((doc) => {
          jobs.push({
            id: doc.id,
            ...doc.data()
          });
        });

        return { success: true, data: jobs };
      } catch (indexError) {
        console.warn('Composite index not found, falling back to client-side sorting:', indexError.message);

        // Fallback: get all jobs for this employer without ordering
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('employerId', '==', employerId)
        );

        const querySnapshot = await getDocs(jobsQuery);
        const jobs = [];

        querySnapshot.forEach((doc) => {
          jobs.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort client-side
        jobs.sort((a, b) => {
          const dateA = a.postedAt?.toDate ? a.postedAt.toDate() : new Date(0);
          const dateB = b.postedAt?.toDate ? b.postedAt.toDate() : new Date(0);
          return dateB - dateA;
        });

        return { success: true, data: jobs };
      }
    } catch (error) {
      console.error('Error in getEmployerJobs:', error);
      return { success: false, error: error.message };
    }
  },

  // Apply for job
  applyForJob: async (userId, jobId, applicationData) => {
    try {
      // Get job details to include in application
      const jobResult = await JobService.getJobById(jobId);
      if (!jobResult.success) {
        return { success: false, error: 'Job not found' };
      }

      // Get user profile information - ensure we get the most current data
      const { ProfileService } = await import('../services/profileService');
      const profileResult = await ProfileService.getProfile(userId);

      const job = jobResult.data;
      const userProfile = profileResult.data;

      // Determine resume URL: prefer applicationData.resumeUrl, fallback to profile resume URL if available
      let resumeUrl = applicationData.resumeUrl;
      if (!resumeUrl && userProfile.resumeUrl) {
        resumeUrl = userProfile.resumeUrl;
      }

      // Get the most complete name possible from profile
      const applicantName = userProfile.fullName ||
                           userProfile.name ||
                           userProfile.displayName ||
                           userProfile.firstName ||
                           `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() ||
                           'N/A';

      // Create application with user profile information
      const application = {
        userId,
        jobId,
        jobTitle: job.title,
        companyName: job.company,
        // User profile information - use the most complete name
        applicantName: applicantName,
        applicantEmail: userProfile.email || 'N/A',
        applicantPhone: userProfile.phone || 'N/A',
        applicantSkills: userProfile.skills || [],
        applicantExperience: userProfile.experience || [],
        applicantEducation: userProfile.education || [],
        // Application data
        ...applicationData,
        resumeUrl: resumeUrl || null,
        resumeFileName: userProfile.resumeFileName || null,
        appliedAt: new Date(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'applications'), application);

      // Update job's application count
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const currentCount = jobDoc.data().applicationsCount || 0;
        await updateDoc(jobRef, {
          applicationsCount: currentCount + 1
        });
      }

      return { success: true, id: docRef.id, message: 'Application submitted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get applications for a job (for employers)
  getJobApplications: async (jobId) => {
    try {
      // First try with the composite query (requires index)
      try {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', jobId),
          orderBy('appliedAt', 'desc')
        );

        const querySnapshot = await getDocs(applicationsQuery);
        const applications = [];

        querySnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });

        return { success: true, data: applications };
      } catch (indexError) {
        console.warn('Composite index not found for job applications, falling back to client-side sorting:', indexError.message);

        // Fallback: get all applications for this job without ordering
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', jobId)
        );

        const querySnapshot = await getDocs(applicationsQuery);
        const applications = [];

        querySnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort client-side
        applications.sort((a, b) => {
          const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(0);
          const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(0);
          return dateB - dateA;
        });

        return { success: true, data: applications };
      }
    } catch (error) {
      console.error('Error in getJobApplications:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's applications (for job seekers)
  getUserApplications: async (userId) => {
    try {
      // First try with the composite query (requires index)
      try {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('userId', '==', userId),
          orderBy('appliedAt', 'desc')
        );

        const querySnapshot = await getDocs(applicationsQuery);
        const applications = [];

        querySnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });

        return { success: true, data: applications };
      } catch (indexError) {
        console.warn('Composite index not found for user applications, falling back to client-side sorting:', indexError.message);

        // Fallback: get all applications for this user without ordering
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(applicationsQuery);
        const applications = [];

        querySnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort client-side
        applications.sort((a, b) => {
          const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(0);
          const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(0);
          return dateB - dateA;
        });

        return { success: true, data: applications };
      }
    } catch (error) {
      console.error('Error in getUserApplications:', error);
      return { success: false, error: error.message };
    }
  },

  // Withdraw application
  withdrawApplication: async (applicationId, jobId) => {
    try {
      // Delete the application
      await deleteDoc(doc(db, 'applications', applicationId));

      // Update job's application count
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const currentCount = jobDoc.data().applicationsCount || 0;
        await updateDoc(jobRef, {
          applicationsCount: Math.max(0, currentCount - 1)
        });
      }

      return { success: true, message: 'Application withdrawn successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Search jobs by keyword
  searchJobs: async (keyword, filters = {}) => {
    try {
      // For now, we'll get all jobs and filter client-side
      // In a production app, you'd use Firebase search or Algolia
      const result = await JobService.getJobs(filters);
      if (!result.success) return result;

      const filteredJobs = result.data.filter(job =>
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.company.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase()) ||
        job.requirements?.some(req => req.toLowerCase().includes(keyword.toLowerCase()))
      );

      return { success: true, data: filteredJobs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get application by ID
  getApplicationById: async (applicationId) => {
    try {
      const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
      if (applicationDoc.exists()) {
        const applicationData = applicationDoc.data();

        // If applicantName is missing or empty, try to get current name from profile
        if (!applicationData.applicantName || applicationData.applicantName === 'N/A') {
          try {
            const { ProfileService } = await import('../services/profileService');
            const profileResult = await ProfileService.getProfile(applicationData.userId);
            if (profileResult.success && profileResult.data) {
              const currentName = profileResult.data.fullName || profileResult.data.name || profileResult.data.displayName || 'N/A';
              if (currentName && currentName !== 'N/A') {
                // Update the application with the current name
                await updateDoc(doc(db, 'applications', applicationId), {
                  applicantName: currentName,
                  updatedAt: new Date()
                });
                applicationData.applicantName = currentName;
              }
            }
          } catch (profileError) {
            console.warn('Could not fetch current profile name:', profileError.message);
          }
        }

        return { success: true, data: { id: applicationDoc.id, ...applicationData } };
      }
      return { success: false, error: 'Application not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
