import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Opens the system picker directly from the avatar press (also required on web). */
export async function chooseAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    allowsMultipleSelection: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || asset.width <= 0 || asset.height <= 0) throw new Error('This image could not be opened. Please choose another photo.');
  const side = Math.min(asset.width, asset.height);
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    context.crop({ originX: Math.floor((asset.width - side) / 2), originY: Math.floor((asset.height - side) / 2), width: side, height: side });
    context.resize({ width: 384, height: 384 });
    const image = await context.renderAsync();
    try {
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
      if (!saved.base64) throw new Error('This photo could not be saved. Please try another image.');
      // Small, durable data URI: no temporary picker/cache file can disappear on restart.
      return `data:image/jpeg;base64,${saved.base64}`;
    } finally { image.release(); }
  } finally { context.release(); }
}
