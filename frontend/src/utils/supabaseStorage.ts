const SUPABASE_URL = 'https://ewusmeywikyfnapvxkcr.supabase.co';
const HERO_IMAGES_BUCKET = 'hero-images';

export function getHeroImageUrl(filename: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${HERO_IMAGES_BUCKET}/${filename}`;
}

export function getLocalHeroImageUrl(filename: string): string {
  return `/assets/hero-images/${filename}`;
}
