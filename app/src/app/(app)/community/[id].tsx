import { router, Stack, useLocalSearchParams } from 'expo-router';

import { PostPage } from '@/components/discussion/post-page';

const goBack = () => router.back();

/** One community post as a page of its own (reached from a link): it slides up from the bottom and back down when closed */
export default function CommunityPostScreen() {
  const { id, write } = useLocalSearchParams<{ id: string; write?: string }>();
  return (
    <>
      <Stack.Screen options={{ animation: 'slide_from_bottom' }} />
      <PostPage id={Number(id)} write={write === '1'} onClose={goBack} />
    </>
  );
}
