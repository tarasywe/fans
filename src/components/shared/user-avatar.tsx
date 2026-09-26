import { Text } from '@ui/text';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';

const StyledImage = withUniwind(Image);

const SIZE_CLASS = {
  xs: 'h-5 w-5',
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-28 w-28',
} as const;

const BADGE_CLASS = {
  xs: 'h-2 w-2 border',
  sm: 'h-2.5 w-2.5 border-2',
  md: 'h-3.5 w-3.5 border-2',
  lg: 'h-4 w-4 border-2',
  xl: 'h-6 w-6 border-4 right-1 bottom-1',
} as const;

const TEXT_CLASS = {
  xs: 'text-[8px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-3xl',
} as const;

/** Tailwind palette tokens used for initials avatars until real photos exist. */
const TINTS = [
  'bg-violet-200',
  'bg-sky-200',
  'bg-emerald-200',
  'bg-amber-200',
  'bg-rose-200',
  'bg-indigo-200',
  'bg-teal-200',
  'bg-fuchsia-200',
] as const;

export type UserAvatarSize = keyof typeof SIZE_CLASS;

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: UserAvatarSize;
  /** `undefined` hides the status dot. */
  isOnline?: boolean;
  className?: string;
};

export function avatarTint(name: string): (typeof TINTS)[number] {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

/** First letters of the first and last words that contain a letter ("Test: send fails (500)" → "TF"). */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0])
    .filter((letter): letter is string => letter !== undefined);
  const picked = letters.length > 1 ? [letters[0], letters.at(-1)] : letters;
  return picked.join('').toUpperCase();
}

export function UserAvatar({ name, imageUrl, size = 'md', isOnline, className }: UserAvatarProps) {
  return (
    <View
      accessibilityLabel={`${name} avatar`}
      className={`items-center justify-center rounded-full ${SIZE_CLASS[size]} ${avatarTint(name)} ${className ?? ''}`}
    >
      {imageUrl ? (
        <StyledImage
          source={{ uri: imageUrl }}
          className="h-full w-full rounded-full"
          contentFit="cover"
        />
      ) : (
        <Text className={`${TEXT_CLASS[size]} font-semibold text-neutral-800`}>
          {initials(name)}
        </Text>
      )}
      {isOnline === undefined ? null : (
        <View
          testID={isOnline ? 'status-online' : 'status-offline'}
          className={`absolute bottom-0 right-0 rounded-full border-background ${BADGE_CLASS[size]} ${
            isOnline ? 'bg-online' : 'bg-offline'
          }`}
        />
      )}
    </View>
  );
}
