# TODO List for Fixes and Improvements

## Upload Error Fix
- [x] Review and fix property access in ImagePicker.js and ResumePicker.js to avoid "_located" error.
- [x] Add improved error handling for upload failures.
- [x] Verify uploadProfileImage and uploadResume functions in profileService.js.
- [x] Add missing uploadFile function to UploadService.js.
- [x] Fix ResumePicker props mismatch in job-details.js.
- [x] Implement Firebase Firestore fallback for image storage using base64 encoding.
- [x] Update uploadProfileImage and uploadResume functions to use Firestore as fallback when Firebase Storage fails.
- [x] Add blobToBase64 helper function for converting files to base64.
- [x] Update profile display components to handle base64 images properly.
- [x] Update jobseeker profile.js to display base64 profile images.
- [x] Update employer profile.js to display base64 company logos.

## Subscription Feature
- [x] Clarify subscription feature limitations in UI.
- [x] Add comments/placeholders for real payment integration in subscription.js.

## UI Improvements
- [x] Enhance interface styling for better visual appeal.
- [x] Add animations and hover effects to buttons, cards, and images.
- [x] Use React Native Animated API or suitable libraries.
- [x] Apply similar animations to other key components (PostCard, dashboard cards, etc.)
- [x] Enhance dashboard components with animations and better styling.

## Follow-up
- Test all fixes and improvements.
- Verify upload functionality for images and resumes.
- Verify subscription upgrade and cancellation flows.
- Verify Help & Support and Settings screens.
