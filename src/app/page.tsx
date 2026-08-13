'use client';
import HomeScreen from '@/components/screens/HomeScreen';
import AgeGate, { useAgeGate } from '@/components/AgeGate';

export default function HomePage() {
  const { confirmed, confirm } = useAgeGate();

  if (!confirmed) {
    return <AgeGate onConfirm={confirm} />;
  }

  return <HomeScreen />;
}
