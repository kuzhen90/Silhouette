# Welcome Page with Photo Upload Feature

## Overview
Create a welcome page that appears on the first app launch and prompts users to take a photo using their camera or upload one from their photo gallery. The photo must be uploaded to the server before the user can proceed to the main app.

## Technical Stack
- **Framework**: React Native with Expo
- **Required Expo packages**:
  - `expo-camera` - For camera access and taking photos
  - `expo-image-picker` - For selecting photos from gallery
  - `expo-file-system` - For file handling
  - `@react-native-async-storage/async-storage` - For tracking first launch

## Feature Requirements

### 1. First Launch Detection
- The welcome page should only appear on the first app launch
- After the user successfully uploads a photo, store a flag in AsyncStorage to indicate the welcome flow is complete
- On subsequent app launches, check this flag and skip the welcome page if it exists

### 2. UI Design
The welcome page should include:
- A welcoming title (e.g., "Welcome to [App Name]!")
- Brief explanatory text about why a photo is needed
- **Two separate buttons**:
  - "Take Photo" button - Opens the camera
  - "Choose from Gallery" button - Opens photo picker
- Clear, friendly UI that guides the user through the process
- No skip option - user must complete photo upload to proceed

### 3. Permission Handling
Before accessing camera or photo library, the app must:
- Request appropriate permissions using Expo's permission APIs
- Handle permission denial gracefully with clear error messages
- Explain to users why permissions are needed
- If permission is denied:
  - Show an alert explaining the permission is required
  - Provide a button to open device settings (if possible)
  - Keep user on welcome page until permission is granted and photo is uploaded

### 4. Camera Functionality
When "Take Photo" is pressed:
- Request camera permissions if not already granted
- Open the device camera using `expo-camera` or `expo-image-picker` camera mode
- Allow user to take a photo
- Show a preview of the taken photo (optional but recommended)
- Provide options to retake or confirm the photo

### 5. Gallery Functionality
When "Choose from Gallery" is pressed:
- Request photo library/media library permissions if not already granted
- Open the photo picker using `expo-image-picker`
- Allow user to select one photo from their gallery
- Return the selected photo

### 6. Photo Upload to Server
After the user takes or selects a photo:
- Show a loading indicator while uploading
- Upload the photo to the server endpoint (you'll need to specify your server endpoint)
- Handle upload success:
  - Store a flag in AsyncStorage (e.g., `hasCompletedWelcome: true`)
  - Navigate to the main app
- Handle upload failure:
  - Show an error message
  - Allow user to retry the upload
  - Keep user on welcome page until successful upload

### 7. Navigation Flow
- App starts → Check AsyncStorage for welcome completion flag
- If flag doesn't exist → Show Welcome Page
- If flag exists → Navigate directly to main app
- After successful photo upload → Set flag and navigate to main app

## Implementation Steps

### Step 1: Install Required Packages
```bash
npx expo install expo-camera expo-image-picker expo-file-system @react-native-async-storage/async-storage
```

### Step 2: Create WelcomePage Component
Create a new file: `app/welcome.tsx` (or appropriate location in your project structure)

The component should:
- Use React hooks (useState, useEffect)
- Handle permission requests
- Handle photo capture/selection
- Upload photo to server
- Navigate to main app after success

### Step 3: Update App Entry Point
Modify `app/_layout.tsx` or your main app entry point to:
- Check AsyncStorage for the welcome completion flag on app start
- Conditionally render WelcomePage or main app based on the flag

### Step 4: Implement Permission Requests
Use the following Expo APIs:
- `Camera.requestCameraPermissionsAsync()` for camera access
- `ImagePicker.requestMediaLibraryPermissionsAsync()` for gallery access
- Handle permission status: granted, denied, undetermined

### Step 5: Implement Photo Capture
- Use `ImagePicker.launchCameraAsync()` with appropriate options:
  - `allowsEditing: true` (optional - allows user to crop)
  - `aspect: [1, 1]` (optional - for square photos)
  - `quality: 0.8` (balance between quality and file size)

### Step 6: Implement Photo Selection
- Use `ImagePicker.launchImageLibraryAsync()` with same options as camera

### Step 7: Implement Server Upload
- Create an upload function that:
  - Takes the photo URI
  - Creates a FormData object
  - Sends POST request to your server endpoint
  - Returns success/failure
- Example endpoint: `POST /api/upload/profile-photo`

### Step 8: Add Error Handling
- Network errors during upload
- Permission denial
- Camera/gallery not available
- Invalid photo format
- Server errors

### Step 9: Add Loading States
- Show loading spinner during upload
- Disable buttons during processing
- Show progress indicator if possible

## Server Integration Notes
You will need to provide:
- Server endpoint URL for photo upload
- Required headers (authentication tokens, API keys, etc.)
- Expected request format (FormData, base64, etc.)
- Expected response format

## Testing Checklist
- [ ] Welcome page appears on first launch
- [ ] Welcome page does NOT appear on subsequent launches after photo upload
- [ ] Camera permission request works correctly
- [ ] Gallery permission request works correctly
- [ ] Camera opens and can take photo
- [ ] Gallery opens and can select photo
- [ ] Photo upload to server succeeds
- [ ] Error handling works for network failures
- [ ] Error handling works for permission denials
- [ ] Loading states display correctly
- [ ] Navigation to main app works after successful upload
- [ ] Works on both iOS and Android
- [ ] User cannot bypass the welcome page without uploading photo

## Edge Cases to Handle
1. User denies permissions - show explanation and keep on welcome page
2. Network connection lost during upload - show error, allow retry
3. Server returns error - show error message, allow retry
4. User closes camera/gallery without selecting - return to welcome page
5. App is closed during upload - handle incomplete state on next launch

## File Structure
```
app/
  welcome.tsx          # Welcome page component
  _layout.tsx          # Updated to check welcome completion
services/
  api.ts              # API service with photo upload function
utils/
  storage.ts          # AsyncStorage helpers for welcome flag
types/
  photo.ts            # TypeScript types for photo data
```

## Additional Considerations
- Consider adding photo compression before upload to reduce file size
- Consider adding photo validation (file size, dimensions, format)
- Consider adding retry logic with exponential backoff for failed uploads
- Consider adding analytics to track welcome flow completion
- Ensure UI is accessible and follows platform design guidelines
