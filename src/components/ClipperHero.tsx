'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Power } from 'lucide-react';
import type { MotionState } from '@/components/Clipper3D';

const Clipper3D = dynamic(() => import('@/components/Clipper3D'), {
  ssr: false,
  loading: () => <div className="landing-clipper-loading" aria-hidden="true" />,
});

export default function ClipperHero() {
  const motion = useRef<MotionState>({ progress: 0, powered: false, reduced: false });
  const [powered, setPowered] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      motion.current.reduced = media.matches;
      motion.current.invalidate?.();
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const togglePower = () => {
    const next = !powered;
    setPowered(next);
    motion.current.powered = next;
    motion.current.invalidate?.();
  };

  return (
    <div className="landing-clipper" aria-label="Modelo 3D de uma máquina de corte">
      <div className="landing-clipper-glow" />
      <Clipper3D motion={motion} />
      <div className="landing-clipper-caption"><span>PRECISÃO EM CADA DETALHE</span><span>ARRASTE PARA EXPLORAR</span></div>
      <button className={powered ? 'landing-clipper-power is-on' : 'landing-clipper-power'} type="button" onClick={togglePower} aria-label={powered ? 'Desligar máquina de corte' : 'Ligar máquina de corte'} aria-pressed={powered}>
        <Power size={17} />
      </button>
    </div>
  );
}
