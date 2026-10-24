import { Image, StyleSheet, View } from 'react-native';
import { absoluteImageUrl } from '../api/client';

interface Props {
  path?: string;
  width: number;
  height: number;
  testID?: string;
}

export function ProductImage({ path, width, height, testID }: Props) {
  const uri = absoluteImageUrl(path);

  return (
    <View style={[styles.frame, { width, height }]} testID={testID}>
      {uri ? <Image source={{ uri }} style={{ width, height }} resizeMode="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eef1f5',
  },
});
