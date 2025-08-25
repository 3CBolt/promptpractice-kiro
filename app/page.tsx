import React from 'react';
import { GuidesList, LabsList } from '@/components';
import { getGuides, getLabs } from '@/lib/utils';
import HomeClient from './HomeClient';

// Force dynamic rendering to avoid build timeout
export const dynamic = 'force-dynamic';

export default function Home() {
  const guides = getGuides();
  const labs = getLabs();

  return <HomeClient guides={guides} labs={labs} />;
}

