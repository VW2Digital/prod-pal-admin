import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSetting } from '@/lib/api';

type ScriptScope = 'all' | 'include' | 'exclude';
interface ScriptEntry {
  id: string;
  label?: string;
  code: string;
  scope?: ScriptScope;
  paths?: string[];
}

const parseScripts = (raw: string): ScriptEntry[] => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((e: any) => e && e.code)
        .map((e: any, i: number) => ({
          id: e.id || `s-${i}`,
          label: e.label,
          code: e.code,
          scope: (e.scope as ScriptScope) || 'all',
          paths: Array.isArray(e.paths) ? e.paths : [],
        }));
    }
  } catch { /* ignore */ }
  if (raw?.trim()) return [{ id: 'legacy', code: raw, scope: 'all', paths: [] }];
  return [];
};

// Converte padrão tipo "/checkout/*" para regex
const matchPath = (pattern: string, path: string): boolean => {
  const normalized = pattern.trim();
  if (!normalized) return false;
  if (normalized === '*' || normalized === '/*') return true;
  const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
};

const shouldRunOnPath = (entry: ScriptEntry, path: string): boolean => {
  const scope = entry.scope || 'all';
  const paths = entry.paths || [];
  if (scope === 'all') return true;
  const matches = paths.some((p) => matchPath(p, path));
  return scope === 'include' ? matches : !matches;
};

const buildNodes = (code: string): Node[] => {
  const container = document.createElement('div');
  container.innerHTML = code;
  const out: Node[] = [];
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeName === 'SCRIPT') {
      const original = node as HTMLScriptElement;
      const fresh = document.createElement('script');
      Array.from(original.attributes).forEach((attr) => fresh.setAttribute(attr.name, attr.value));
      if (original.textContent) fresh.textContent = original.textContent;
      out.push(fresh);
    } else {
      out.push(node.cloneNode(true));
    }
  });
  return out;
};

const HeadScriptInjector = () => {
  const location = useLocation();
  const [headScripts, setHeadScripts] = useState<ScriptEntry[]>([]);
  const [footerScripts, setFooterScripts] = useState<ScriptEntry[]>([]);
  // Mapa de id -> nós atualmente injetados, para remover quando sair da página
  const injectedRef = useRef<Map<string, Node[]>>(new Map());

  useEffect(() => {
    Promise.all([
      fetchSetting('head_script'),
      fetchSetting('footer_script'),
    ]).then(([headRaw, footerRaw]) => {
      setHeadScripts(parseScripts(headRaw || '').map((e) => ({ ...e, id: `head-${e.id}` })));
      setFooterScripts(parseScripts(footerRaw || '').map((e) => ({ ...e, id: `footer-${e.id}` })));
    });
  }, []);

  useEffect(() => {
    const all = [
      ...headScripts.map((e) => ({ entry: e, target: 'head' as const })),
      ...footerScripts.map((e) => ({ entry: e, target: 'body' as const })),
    ];
    const path = location.pathname;
    const map = injectedRef.current;

    all.forEach(({ entry, target }) => {
      const active = shouldRunOnPath(entry, path);
      const already = map.get(entry.id);

      if (active && !already) {
        const nodes = buildNodes(entry.code);
        const parent = target === 'head' ? document.head : document.body;
        nodes.forEach((n) => parent.appendChild(n));
        map.set(entry.id, nodes);
      } else if (!active && already) {
        already.forEach((n) => { try { (n as ChildNode).parentNode?.removeChild(n); } catch {/*noop*/} });
        map.delete(entry.id);
      }
    });
  }, [location.pathname, headScripts, footerScripts]);

  return null;
};

export default HeadScriptInjector;
