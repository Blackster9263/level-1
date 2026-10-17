'use client';

import {useEffect,useState,type ReactNode} from 'react';
import {ThemeProvider,useTheme} from 'next-themes';
import {Moon,Sun} from 'lucide-react';

function ThemeToggle(){
  const {resolvedTheme,setTheme}=useTheme();
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const dark=mounted&&resolvedTheme==='dark';
  return <div className="theme-toolbar no-print"><button type="button" className="theme-toggle" disabled={!mounted} aria-label={dark?'Switch to light mode':'Switch to dark mode'} onClick={()=>setTheme(dark?'light':'dark')}>
    {dark?<Sun aria-hidden="true"/>:<Moon aria-hidden="true"/>}<span>{dark?'Light mode':'Dark mode'}</span>
  </button></div>;
}

export function ThemeControls({children}:{children:ReactNode}){
  return <ThemeProvider attribute="data-theme" defaultTheme="system" storageKey="pulseprep-theme" enableSystem enableColorScheme disableTransitionOnChange><ThemeToggle/>{children}</ThemeProvider>;
}
