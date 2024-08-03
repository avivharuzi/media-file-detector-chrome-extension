export interface MediaFile {
  type: 'image' | 'video';
  src: string;
  width?: number;
  height?: number;
}
