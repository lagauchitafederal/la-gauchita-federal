/**
 * Helper to build the public URL for Supabase Storage assets.
 */
export function getPublicMediaUrl(
  bucketName: string | null | undefined,
  storagePath: string | null | undefined
): string {
  if (!bucketName || !storagePath) return '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '';

  // Clean trailing slashes from base URL
  const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
  // Clean leading and trailing slashes from bucket name
  const cleanBucket = bucketName.trim().replace(/^\/+|\/+$/g, '');
  // Clean leading slashes from storage path
  const cleanPath = storagePath.trim().replace(/^\/+/, '');

  return `${cleanUrl}/storage/v1/object/public/${cleanBucket}/${cleanPath}`;
}
