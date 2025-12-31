# Welcome Page - Dummy Upload Implementation

## Current Implementation Status

The welcome page feature has been implemented with the following files:

### Files Created
1. **utils/storage.ts** - AsyncStorage helpers for welcome flow tracking
   - `hasCompletedWelcome()` - Check if user has completed welcome
   - `setWelcomeCompleted()` - Mark welcome as completed
   - `resetWelcomeStatus()` - Reset for testing

2. **services/api.ts** - API service for photo upload
   - `uploadProfilePhoto()` - Uploads photo using expo-file-system
   - Currently points to a real API endpoint

3. **app/welcome.tsx** - Welcome page component
   - Camera and gallery permissions
   - Take Photo button (opens camera)
   - Choose from Gallery button (opens photo picker)
   - Photo preview with retake option
   - Upload with loading state and error handling

4. **app/_layout.tsx** - Root layout with welcome flow
   - Checks welcome completion on app start
   - Shows loading indicator while checking
   - Routes to welcome or main app accordingly
   - Disables gestures on welcome screen

### Packages Installed
- expo-camera
- expo-image-picker
- expo-file-system
- @react-native-async-storage/async-storage

## Required Changes

### Update API Service to Use Dummy Upload

**File to modify**: `services/api.ts`

**Current issue**: The upload function attempts to send photos to a real server endpoint, but we don't have Supabase integration set up yet.

**Required changes**:
1. Replace the current `uploadProfilePhoto()` function with a dummy implementation
2. The dummy function should:
   - Accept the photo URI as a parameter
   - **Return immediate success** (no delay needed)
   - Return a mock response that matches the expected format
   - Log the photo URI to console for debugging purposes
   - NOT actually upload anything to a server

**Implementation**:
```typescript
export async function uploadProfilePhoto(photoUri: string): Promise<{ success: boolean; url?: string }> {
  // TEMPORARY DUMMY IMPLEMENTATION
  // TODO: Replace with Supabase storage integration in the future

  console.log('DUMMY UPLOAD - Photo URI:', photoUri);
  console.log('Note: Photo is not actually uploaded. Supabase integration pending.');

  // Simulate immediate success
  return {
    success: true,
    url: photoUri // Return the local URI as a placeholder
  };
}
```

**Important notes**:
- Add clear comments indicating this is temporary
- Include a TODO comment for future Supabase integration
- Keep the function signature the same so no changes are needed in welcome.tsx
- The function should still validate that photoUri is provided

### Future Supabase Integration Note

**Add a comment block at the top of services/api.ts**:
```typescript
/**
 * API Service
 *
 * FUTURE IMPLEMENTATION REQUIRED:
 * - Supabase Storage integration for photo uploads
 * - Replace uploadProfilePhoto() dummy implementation with real Supabase upload
 * - Add authentication tokens/headers as needed
 * - Configure Supabase bucket for profile photos
 * - Handle upload progress and errors from Supabase
 */
```

## Testing Instructions

After implementing the dummy upload, test the following flow:

### Test 1: First Launch - Take Photo
1. Reset the welcome status by calling `resetWelcomeStatus()` (can add a button temporarily)
2. Restart the app
3. Verify welcome page appears
4. Tap "Take Photo"
5. Grant camera permission when prompted
6. Take a photo
7. Verify photo preview appears
8. Tap confirm/upload
9. Verify success and navigation to main app
10. Check console for dummy upload log message
11. Restart app - verify welcome page does NOT appear again

### Test 2: First Launch - Choose from Gallery
1. Reset the welcome status
2. Restart the app
3. Tap "Choose from Gallery"
4. Grant photo library permission when prompted
5. Select a photo
6. Verify photo preview appears
7. Tap confirm/upload
8. Verify success and navigation to main app
9. Restart app - verify welcome page does NOT appear again

### Test 3: Permission Denial
1. Reset the welcome status
2. Restart the app
3. Tap either button
4. Deny permission when prompted
5. Verify error message appears
6. Verify user can try again
7. Grant permission on retry
8. Verify flow completes successfully

### Test 4: AsyncStorage Persistence
1. Complete the welcome flow
2. Close the app completely (force quit)
3. Reopen the app
4. Verify the app goes directly to main screen (skips welcome)

## Known Limitations (Dummy Mode)

- Photos are not actually uploaded to any server
- Photo URI is logged to console but not stored permanently
- No server-side validation or processing
- No network error simulation
- Photo will only be accessible locally on the device

## Next Steps for Full Implementation

When ready to implement Supabase storage:

1. **Set up Supabase project**
   - Create Supabase account and project
   - Create a storage bucket for profile photos
   - Configure bucket permissions (public read or authenticated only)

2. **Install Supabase client**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Update services/api.ts**
   - Initialize Supabase client with your project URL and anon key
   - Replace dummy uploadProfilePhoto() with real Supabase upload:
     - Upload file to Supabase storage bucket
     - Get public URL of uploaded photo
     - Return the URL to save in user profile
     - Handle upload errors appropriately

4. **Add environment variables**
   - Store Supabase URL and keys securely
   - Use expo-constants or similar for environment configuration

5. **Update user profile**
   - Store the uploaded photo URL in user's profile/database
   - Display the photo in the app
   - Handle photo updates/deletions

## Additional Debugging Tools

Consider adding these temporary debugging features:

### Debug Button to Reset Welcome Status
Add a button in your main app (development only) that calls:
```typescript
import { resetWelcomeStatus } from '../utils/storage';

// In your component
const handleResetWelcome = async () => {
  await resetWelcomeStatus();
  console.log('Welcome status reset - restart app to see welcome page');
};
```

### Console Logging
Add console.log statements to track:
- When welcome status is checked
- When welcome is marked as complete
- When photo is selected/captured
- When upload is triggered
- Navigation decisions

### Error Boundaries
Consider adding error boundaries around the welcome page to catch and display any unexpected errors during development.

## File Checklist

After making changes, verify:
- [ ] services/api.ts has dummy uploadProfilePhoto() implementation
- [ ] services/api.ts has TODO comments for Supabase integration
- [ ] Dummy function returns immediate success
- [ ] Photo URI is logged to console
- [ ] Function signature matches what welcome.tsx expects
- [ ] No actual network requests are made
- [ ] App builds without errors
- [ ] Welcome flow completes successfully with dummy upload
- [ ] AsyncStorage correctly tracks completion
- [ ] Navigation works as expected
