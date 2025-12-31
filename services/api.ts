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

export interface UploadResponse {
  success: boolean;
  message?: string;
  photoUrl?: string;
}

/**
 * Upload a profile photo
 *
 * TEMPORARY DUMMY IMPLEMENTATION
 * TODO: Replace with Supabase storage integration in the future
 *
 * @param photoUri - The local URI of the photo to upload
 * @returns Promise with success status and photo URL
 */
export async function uploadProfilePhoto(
  photoUri: string
): Promise<UploadResponse> {
  // Validate that photoUri is provided
  if (!photoUri) {
    console.error("DUMMY UPLOAD - No photo URI provided");
    return {
      success: false,
      message: "No photo URI provided",
    };
  }

  // TEMPORARY DUMMY IMPLEMENTATION
  // TODO: Replace with Supabase storage integration in the future

  console.log("DUMMY UPLOAD - Photo URI:", photoUri);
  console.log(
    "Note: Photo is not actually uploaded. Supabase integration pending."
  );

  // Return immediate success with the local URI as a placeholder
  return {
    success: true,
    photoUrl: photoUri,
  };
}
