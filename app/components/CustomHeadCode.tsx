'use client';

import { useEffect } from 'react';

export default function CustomHeadCode({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return;

    const container = document.createElement('div');
    container.innerHTML = code;

    const nodes: Node[] = [];
    while (container.firstChild) {
      const node = container.firstChild;
      document.head.appendChild(node);
      nodes.push(node);
    }

    return () => {
      nodes.forEach(node => {
        if (node.parentNode === document.head) {
          document.head.removeChild(node);
        }
      });
    };
  }, [code]);

  return null;
}
