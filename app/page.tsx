import {CloudApp} from '@/components/CloudApp';
import {cloudConfig} from '@/lib/cloud-config';
export const dynamic='force-dynamic';

export default function Home() {
  return <CloudApp config={cloudConfig()} />;
}
