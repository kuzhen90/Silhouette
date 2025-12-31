# Onboarding - User Measurements Collection

## Overview
Create an onboarding screen that appears immediately after the welcome page photo upload is complete. This screen collects the user's height and weight measurements to help generate accurate garment sizing recommendations.

## Technical Stack
- **Framework**: React Native with Expo
- **Required Packages**:
  - `@react-native-async-storage/async-storage` (already installed from welcome page)
  - `react-native-reanimated` (for animations if needed)
  - Expo Router for navigation

## Flow Position
This screen appears:
- **After**: Welcome page photo upload completes successfully
- **Before**: Main garment editor screen
- **Frequency**: Only on first launch (after welcome page)

## Feature Requirements

### 1. Screen Layout
Create a clean, welcoming interface with:
- Title: "Welcome" or "Let's Get Started"
- Subtitle: "Let's start by getting your measurements"
- Two input fields:
  - **Height input**
    - Label: "Height"
    - Placeholder: "5'10\"" or "70 inches"
    - Format: Allow both feet/inches (5'10") or total inches (70)
  - **Weight input**
    - Label: "Weight"
    - Placeholder: "160 lbs"
    - Format: Numeric with "lbs" unit
- **Continue button**
  - Disabled state when fields are empty
  - Enabled state when both fields have values
  - Shows arrow icon on the right
  - Primary blue color when enabled, gray when disabled

### 2. Visual Design (Based on Markup)
- Centered card layout on screen
- White background card with rounded corners (rounded-3xl / ~24px radius)
- Shadow for depth
- Modern, clean input fields:
  - Light gray background (bg-gray-50)
  - Rounded corners (rounded-2xl / ~16px)
  - Border on focus (blue ring)
  - Generous padding (px-4 py-4)
- Smooth animations:
  - Card fades in and slides up on mount
  - Inputs animate in sequentially with slight delays
  - Button hover/press animations (scale effects)

### 3. Input Validation
- **Height**:
  - Accept formats: "5'10\"", "5'10", "70", "70 inches", "70in"
  - Store as total inches
  - Optional: Show format hint/helper text
- **Weight**:
  - Accept numeric values
  - Append "lbs" automatically if not provided
  - Store as numeric value
- **Both fields required**:
  - Continue button disabled until both have values
  - No specific validation beyond presence (user can correct later)

### 4. Data Storage
After user submits:
- Store measurements in AsyncStorage:
  - Key: `userProfile`
  - Value: JSON object with `{ height: string, weight: string }`
- Keep data persistent across app sessions
- This data will be used for garment size recommendations

### 5. Navigation
After successful submission:
- Navigate to the Garment Editor screen
- Pass the user profile data (height, weight) as navigation params or make available via context/state
- No back navigation to welcome page (welcome is completed)

### 6. Animation Requirements (Optional but Recommended)
Based on the markup, implement:
- **Card entrance**: Fade in + slide up (0.6s duration with ease curve)
- **Content**: Stagger animations for title, inputs, button (0.2s delays)
- **Input animations**: Slide in from left with fade (0.3s and 0.4s delays)
- **Button**: Fade in after inputs (0.5s delay)
- **Button interactions**:
  - Hover: Scale to 102%
  - Press: Scale to 98%
  - Smooth transitions on all state changes

## Implementation Steps

### Step 1: Create Onboarding Component
Create file: `app/onboarding.tsx`

The component should:
- Use React hooks (useState for form state)
- Handle text input for height and weight
- Validate that both fields have values
- Submit and store data on continue
- Navigate to garment editor

### Step 2: Update Navigation Flow
Modify `app/_layout.tsx` or your navigation setup:
- After welcome page completion → Navigate to onboarding
- After onboarding completion → Navigate to garment editor
- Check AsyncStorage for `userProfile`:
  - If exists: Skip onboarding, go straight to garment editor
  - If not exists: Show onboarding

### Step 3: Create Storage Helper
Add to `utils/storage.ts`:
```typescript
export async function saveUserProfile(height: string, weight: string): Promise<void> {
  await AsyncStorage.setItem('userProfile', JSON.stringify({ height, weight }));
}

export async function getUserProfile(): Promise<{ height: string; weight: string } | null> {
  const data = await AsyncStorage.getItem('userProfile');
  return data ? JSON.parse(data) : null;
}

export async function resetUserProfile(): Promise<void> {
  await AsyncStorage.removeItem('userProfile');
}
```

### Step 4: UI Components
Use React Native components:
- `View` for layout containers
- `Text` for labels and titles
- `TextInput` for height and weight inputs
- `TouchableOpacity` or `Pressable` for continue button
- `KeyboardAvoidingView` to handle keyboard on iOS
- `ScrollView` wrapper for smaller screens

### Step 5: Styling
Create styles matching the markup:
- Card container: white background, rounded corners, shadow
- Inputs: light gray background, rounded, focus states
- Button: blue primary color, white text, disabled state gray
- Typography: Clear hierarchy (larger title, smaller subtitle)

### Step 6: Input Handling
- Parse height input to handle different formats
- Clean and format weight input
- Show/hide keyboard appropriately
- Handle form submission on button press

## React Native Specific Considerations

### Input Configuration
```typescript
<TextInput
  placeholder="5'10\""
  placeholderTextColor="#9CA3AF"
  keyboardType="default" // Allow both numbers and symbols for height
  returnKeyType="next"
  onSubmitEditing={() => weightInputRef.current?.focus()}
/>

<TextInput
  placeholder="160 lbs"
  placeholderTextColor="#9CA3AF"
  keyboardType="numeric"
  returnKeyType="done"
  onSubmitEditing={handleSubmit}
/>
```

### Platform Differences
- iOS: Use `KeyboardAvoidingView` with behavior="padding"
- Android: Adjust with `android:windowSoftInputMode="adjustResize"` in AndroidManifest.xml
- Both: Test keyboard visibility and input accessibility

## Testing Checklist
- [ ] Onboarding screen appears after welcome page completion
- [ ] Onboarding screen does NOT appear if user profile already exists
- [ ] Height input accepts various formats (5'10\", 70, etc.)
- [ ] Weight input accepts numeric values
- [ ] Continue button is disabled when fields are empty
- [ ] Continue button enables when both fields have values
- [ ] Data is saved to AsyncStorage on continue
- [ ] Navigation to garment editor works after submission
- [ ] Keyboard handling works on both iOS and Android
- [ ] Animations are smooth (if implemented)
- [ ] User can edit inputs before submitting
- [ ] App remembers user profile after restart

## Future Enhancements (Out of Scope for Now)
- Unit selection (imperial vs metric)
- More detailed measurements (chest, waist, etc.)
- Profile photo display from welcome page
- Edit profile functionality from settings
- AI-based size recommendations using height/weight

## Design Reference
The markup shows:
- Clean, minimal design with generous whitespace
- Modern rounded corners throughout
- Smooth, delightful animations
- Clear visual hierarchy
- Professional blue accent color (#2563EB / blue-600)
- Subtle shadows for depth

## Notes
- Keep the onboarding quick and simple (just 2 fields)
- Don't overwhelm users with too many questions
- Make it easy to skip back later if needed (future feature)
- Store data locally for now (Supabase sync can come later)
- Focus on smooth, polished user experience
