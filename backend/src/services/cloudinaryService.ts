import cloudinary from '../config/cloudinary';

/**
 * Bulk deletes images from Cloudinary with chunking to avoid orphaned assets
 */
export async function bulkDeleteCloudinaryImages(publicIds: string[]): Promise<{ deletedCount: number }> {
  const validIds = publicIds.filter((id) => id && id.trim().length > 0);
  if (validIds.length === 0) return { deletedCount: 0 };

  console.log(`Cloudinary Nuke: Deleting ${validIds.length} image assets...`);
  
  // Cloudinary allows maximum 100 public IDs per delete request
  const chunkSize = 100;
  let totalDeleted = 0;

  for (let i = 0; i < validIds.length; i += chunkSize) {
    const chunk = validIds.slice(i, i + chunkSize);
    try {
      const result = await cloudinary.api.delete_resources(chunk);
      console.log('Cloudinary bulk delete chunk result:', result);
      totalDeleted += chunk.length;
    } catch (error: any) {
      console.error('Error during Cloudinary batch deletion:', error.message);
    }
  }

  return { deletedCount: totalDeleted };
}
