# Garment Editor - Main Application Screen

## Overview
Create the main application screen where users can view and customize measurements for different types of garments (shirts, pants, jackets). This screen includes an interactive garment visualization and a measurement input panel.

## Technical Stack
- **Framework**: React Native with Expo
- **Required Packages**:
  - `react-native-svg` - For garment visualizations
  - `@react-native-picker/picker` or custom dropdown - For garment type selection
  - `react-native-reanimated` - For smooth animations
  - `@react-native-async-storage/async-storage` - For persisting measurements

## Flow Position
This is the main app screen that appears:
- **After**: Onboarding measurements are completed
- **Persists**: User stays on this screen for most app interactions
- **Purpose**: Primary interface for managing garment measurements

## Feature Requirements

### 1. Screen Layout
The screen is divided into three main sections:

#### A. Garment Type Selector (Top)
- Dropdown/Picker component showing current garment type
- Options: "Shirt", "Pants", "Jacket"
- Visual indicator (chevron icon) showing dropdown state
- Smooth animation when opening/closing
- Selected option highlighted in blue

#### B. Garment Visualization (Left/Main - 66% width on tablet/desktop)
- Large SVG visualization of the selected garment
- Visual representation updates when garment type changes
- Measurement indicators shown on the visualization
- Centered in a white rounded card with shadow
- Animations when switching between garment types:
  - Fade out old garment
  - Fade in new garment
  - Subtle scale animation

#### C. Measurement Panel (Right/Side - 33% width on tablet/desktop)
- Scrollable panel with measurement inputs
- Title: "Measurements" with ruler icon
- Input fields specific to selected garment type
- All measurements in inches
- Tip section at bottom with helpful information

### 2. Garment Types and Measurements

#### Shirt Measurements
- **Shoulder Width**: Default 18"
  - Distance across shoulders
- **Chest**: Default 40"
  - Circumference at chest
- **Sleeve Length**: Default 25"
  - Shoulder to wrist
- **Body Length**: Default 29"
  - Collar to bottom hem

#### Pants Measurements
- **Waist**: Default 32"
  - Waist circumference
- **Inseam**: Default 32"
  - Inner leg length
- **Rise**: Default 11"
  - Crotch to waistband
- **Leg Opening**: Default 8"
  - Width at ankle

#### Jacket Measurements
- **Shoulder Width**: Default 18.5"
  - Distance across shoulders
- **Chest**: Default 42"
  - Circumference at chest
- **Sleeve Length**: Default 26"
  - Shoulder to wrist
- **Body Length**: Default 30"
  - Collar to bottom hem

### 3. Garment Visualizations (SVG)

Each garment type needs a simple SVG illustration:

#### Shirt Visual Elements
- Main body rectangle
- Two sleeves
- Collar detail
- Measurement indicator lines (dashed red lines)
- Visual points showing measurement locations
- Blue color scheme (#2563EB) with transparency

#### Pants Visual Elements
- Waistband rectangle
- Two leg shapes
- Center seam
- Measurement indicator lines
- Visual points showing measurement locations
- Blue color scheme with transparency

#### Jacket Visual Elements
- Split panel design (left and right)
- Lapels
- Two sleeves
- Collar detail
- Button details
- Measurement indicator lines
- Visual points showing measurement locations
- Blue color scheme with transparency

### 4. Measurement Input Panel

For each measurement:
- Clear label (e.g., "Shoulder Width")
- Text input field
  - Light gray background
  - Rounded corners
  - Focused state with blue ring
  - Right-aligned unit indicator ("in")
- Inputs animate in sequentially when garment type changes
- Values persist when switching between garment types

### 5. Data Persistence

#### Local Storage
Store measurements in AsyncStorage:
```typescript
{
  measurements: {
    shirt: { shoulder: "18", chest: "40", sleeves: "25", length: "29" },
    pants: { waist: "32", inseam: "32", rise: "11", leg: "8" },
    jacket: { shoulder: "18.5", chest: "42", sleeves: "26", length: "30" }
  }
}
```

#### Auto-save Behavior
- Save measurements automatically when user updates any field
- Debounce saves (500ms delay after last keystroke)
- Load saved measurements on app start
- Use default measurements if none exist

### 6. Responsive Layout

#### Mobile (Phone)
- Vertical stack layout
- Garment selector at top
- Garment visualization takes full width
- Measurement panel below visualization
- Scrollable content

#### Tablet/Desktop (if applicable)
- Horizontal layout
- Garment selector at top-left
- Visualization on left (2/3 width)
- Measurement panel on right (1/3 width)
- Side-by-side view

### 7. Animations

#### Garment Type Switching
- Dropdown menu: Fade and slide animation (0.2s)
- Visualization: Fade out old, fade in new (0.4s)
- Measurement panel: Slide in from right (0.4s)
- Measurement inputs: Stagger fade-in (0.05s delay each)

#### User Interactions
- Dropdown open/close: Rotate chevron icon
- Input focus: Smooth border color transition
- Button presses: Scale feedback (102% hover, 98% press)

### 8. User Experience Features

#### Helpful Tips
Show a tip box at bottom of measurement panel:
- Background: Light blue (#DBEAFE)
- Text: Blue (#1E40AF)
- Content: "Tip: Adjust measurements to match your perfect fit. All values are in inches."

#### Visual Feedback
- Active garment type highlighted in dropdown
- Focused input has blue ring
- Smooth transitions between all states
- Loading states if needed (future)

## Implementation Steps

### Step 1: Create Garment Editor Component
Create file: `app/garment-editor.tsx`

The component should:
- Manage state for:
  - Selected garment type
  - Measurements for all garment types
  - Dropdown open/closed state
- Handle garment type selection
- Handle measurement updates
- Auto-save to AsyncStorage
- Load measurements on mount

### Step 2: Create Measurement Panel Component
Create file: `components/MeasurementPanel.tsx`

Features:
- Receives garment type and measurements as props
- Renders appropriate input fields based on garment type
- Callback for measurement changes
- Scrollable container
- Animated entry for each input

### Step 3: Create Garment Visual Component
Create file: `components/GarmentVisual.tsx`

Features:
- Receives garment type and measurements as props
- Renders appropriate SVG based on type
- Smooth transition animations
- Responsive sizing
- Three sub-components:
  - `ShirtVisual`
  - `PantsVisual`
  - `JacketVisual`

### Step 4: Create SVG Illustrations
For each garment type, create simple SVG illustrations using `react-native-svg`:
- Use basic shapes (paths, rectangles, circles)
- Add measurement indicator lines (dashed)
- Include measurement points (circles)
- Apply colors and opacity
- Keep designs simple and clean

### Step 5: Update Storage Helpers
Add to `utils/storage.ts`:
```typescript
export async function saveMeasurements(measurements: MeasurementData): Promise<void> {
  await AsyncStorage.setItem('measurements', JSON.stringify(measurements));
}

export async function getMeasurements(): Promise<MeasurementData | null> {
  const data = await AsyncStorage.getItem('measurements');
  return data ? JSON.parse(data) : null;
}
```

### Step 6: Create Dropdown Component
Create a custom dropdown for garment type selection:
- Native Picker on mobile (iOS/Android styles)
- Custom dropdown with smooth animations
- Chevron icon that rotates
- Selected state highlighting

### Step 7: Integrate with App Navigation
Update `app/_layout.tsx`:
- After onboarding completion → Navigate to garment editor
- If user profile and measurements exist → Go directly to garment editor
- Pass user profile data to garment editor (for future AI recommendations)

## React Native Specific Considerations

### SVG Implementation
Use `react-native-svg` components:
```typescript
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';
```

### Picker/Dropdown
- iOS: Use native Picker with iOS styling
- Android: Use native Picker with Android styling
- Alternative: Build custom dropdown with Modal/Pressable

### Layout
```typescript
// Mobile: Vertical stack
<ScrollView>
  <GarmentSelector />
  <GarmentVisual />
  <MeasurementPanel />
</ScrollView>

// Tablet: Horizontal (use Dimensions or responsive library)
<View style={{ flexDirection: 'row' }}>
  <View style={{ flex: 2 }}>
    <GarmentVisual />
  </View>
  <View style={{ flex: 1 }}>
    <MeasurementPanel />
  </View>
</View>
```

### Animations
Use `react-native-reanimated` for smooth 60fps animations:
- Fade animations
- Scale transformations
- Layout transitions

## Testing Checklist
- [ ] Garment editor appears after onboarding completion
- [ ] All three garment types (shirt, pants, jacket) are selectable
- [ ] Dropdown opens and closes smoothly
- [ ] Correct measurements shown for each garment type
- [ ] SVG visualizations render correctly for all garment types
- [ ] Measurement inputs are editable
- [ ] Measurements auto-save to AsyncStorage
- [ ] Measurements persist after app restart
- [ ] Switching garment types preserves previous measurements
- [ ] Animations are smooth and performant
- [ ] Layout works on different screen sizes
- [ ] Keyboard handling works correctly
- [ ] ScrollView works when content exceeds screen height
- [ ] Visual feedback on interactions (focus, press, etc.)

## Future Enhancements (Out of Scope for Now)
- AI-based measurement recommendations using uploaded photo
- Size comparison with popular brands
- 3D garment visualization
- Measurement guides/tutorials
- Multiple measurement profiles
- Share measurements with tailors/brands
- Measurement history tracking
- AR try-on feature
- Export measurements as PDF
- Integration with e-commerce platforms

## Design Specifications (From Markup)

### Colors
- Primary: `#2563EB` (blue-600)
- Background: `#F9FAFB` to `#F3F4F6` gradient
- Card background: White (`#FFFFFF`)
- Input background: `#F9FAFB` (gray-50)
- Border: `#E5E7EB` (gray-200)
- Text: `#374151` (gray-700)
- Placeholder: `#9CA3AF` (gray-400)
- Accent: `#EF4444` (red-500 for measurement indicators)

### Spacing
- Card padding: 32px (p-8)
- Input padding: 16px vertical, 16px horizontal
- Gap between inputs: 16px (space-y-4)
- Panel padding: 24px (p-6)

### Border Radius
- Cards: 24px (rounded-3xl)
- Inputs: 12px (rounded-xl)
- Buttons: 16px (rounded-2xl)

### Shadows
- Cards: `shadow-xl` (large shadow for depth)
- Dropdown: `shadow-xl`

## Notes
- Keep visualizations simple and clear
- Focus on usability over complexity
- Ensure measurements are always visible while editing
- Provide visual feedback for all interactions
- Make it easy to switch between garment types
- Auto-save prevents data loss
- Default measurements should be reasonable starting points
- All measurements in inches (metric conversion future feature)
