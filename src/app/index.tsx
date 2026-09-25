import { Redirect } from 'expo-router';

import { links } from '@/config/links';

export default function Index() {
  return <Redirect href={links.chats} />;
}
