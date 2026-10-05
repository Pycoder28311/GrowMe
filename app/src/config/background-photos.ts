import type { ImageContentPosition } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

// Background photos for the home screen. They fill the whole screen, cropped to the phone's shape.
// `position` (optional) is the part of the photo to keep in view when it is cropped.
// Several are from Pinterest/Google with unknown owners: fine for a private demo, need permission to publish.

export type BackgroundPhoto = {
  source: ImageSourcePropType;
  position?: ImageContentPosition;
  credit: { author: string; license: string; source: string };
};

export const BACKGROUND_PHOTOS: BackgroundPhoto[] = [
  {
    source: require('@/assets/images/backgrounds/alley-potted-plants.webp'),
    credit: {
      author: 'Unsplash',
      license: 'Unsplash License',
      source: 'https://images.unsplash.com/photo-1772022077708-b527d6736530',
    },
  },
  {
    source: require('@/assets/images/backgrounds/balcony-geraniums-sea-view.webp'),
    // The pot sits right of centre, so keep that side in view when the screen crops the photo
    position: { left: '78%', top: '50%' },
    credit: {
      author: 'Rodolfo Cardarelli',
      license: 'CC BY 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Taormina_View_From_A_Balcony_(36266916).jpeg',
    },
  },
  {
    source: require('@/assets/images/backgrounds/balcony-hanging-pots.webp'),
    credit: {
      author: 'Unknown (via Pinterest)',
      license: 'Unknown',
      source: 'https://i.pinimg.com/736x/22/75/15/227515b0a4c08712bce409005a164706.jpg',
    },
  },
  {
    source: require('@/assets/images/backgrounds/balcony-street-shelves.webp'),
    credit: {
      author: 'Unknown (via Google Images)',
      license: 'Unknown',
      source: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwbj26e8mi0v4nbQFuK3Yfm5hivnd3ic9P_owK9REIBQ',
    },
  },
  {
    source: require('@/assets/images/backgrounds/balcony-tropical-sunset.webp'),
    credit: {
      author: 'Unknown (via Pinterest)',
      license: 'Unknown',
      source: 'https://i.pinimg.com/736x/9f/e7/d8/9fe7d8207b5c91a94752687a7f48be40.jpg',
    },
  },
  {
    source: require('@/assets/images/backgrounds/terrace-lemon-trees-sea.webp'),
    credit: {
      author: 'BuildGreenNH.com (via Pinterest)',
      license: 'Unknown',
      source: 'https://i.pinimg.com/736x/19/73/ca/1973ca87f6edf384b5f1e572b43b8289.jpg',
    },
  },
];
