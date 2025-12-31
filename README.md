# Silhouette

A React Native app for managing personalized garment measurements. Users can input their body measurements and customize sizing for different garment types to achieve the perfect fit.

## Features

### Onboarding Flow
1. **Welcome Page** - Users upload a profile photo via camera or gallery
2. **Measurements Page** - Users enter their height and weight

### Garment Editor
The main application screen where users can:
- Select garment type (Shirt, Pants, Jacket)
- View interactive SVG garment visualizations with measurement indicators
- Edit measurements specific to each garment type:
  - **Shirt**: Shoulder Width, Chest, Sleeve Length, Body Length
  - **Pants**: Waist, Inseam, Rise, Leg Opening
  - **Jacket**: Shoulder Width, Chest, Sleeve Length, Body Length
- Measurements auto-save and persist across sessions

## Tech Stack
- React Native with Expo
- Expo Router (file-based routing)
- AsyncStorage for data persistence
- react-native-svg for garment visualizations
- react-native-reanimated for animations

## Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open the app in:
   - [Expo Go](https://expo.dev/go)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

## Project Structure

```
app/
  _layout.tsx        # Root layout with navigation logic
  welcome.tsx        # Photo upload welcome screen
  onboarding.tsx     # Height/weight input screen
  garment-editor.tsx # Main garment measurement editor
  index.tsx          # Default route

components/
  GarmentVisual.tsx    # SVG garment illustrations
  MeasurementPanel.tsx # Measurement input panel

services/
  api.ts             # Photo upload service (dummy implementation)

utils/
  storage.ts         # AsyncStorage helpers for persistence
```
