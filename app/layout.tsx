import type { Metadata } from 'next';
import {ThemeControls} from '@/components/ThemeControls';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulsePrep — Practice interviews. Get scored. Improve.',
  description: 'Prepare for your next interview with a transparent scoring rubric, focused feedback, and a personal practice report.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><ThemeControls>{children}</ThemeControls></body></html>;
}
