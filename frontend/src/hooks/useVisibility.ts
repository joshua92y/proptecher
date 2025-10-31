import { useEffect, useState } from 'react';

export function useVisibility(targetId: string) {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.01 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [targetId]);

  return visible;
}



