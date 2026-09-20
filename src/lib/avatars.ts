// src/lib/avatars.ts
// 12 avatares SVG inline para selección de perfil

export const AVATARS: { key: string; label: string; svg: string }[] = [
  {
    key: "hunter",
    label: "Cazador",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1a0a2e" stroke="#a855f7" stroke-width="2"/>
      <path d="M32 14l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" fill="#a855f7"/>
      <circle cx="32" cy="32" r="6" fill="#c084fc" opacity="0.4"/>
    </svg>`
  },
  {
    key: "shadow",
    label: "Sombra",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0a0a1a" stroke="#6366f1" stroke-width="2"/>
      <path d="M32 10c0 0-14 12-14 22a14 14 0 0028 0C46 22 32 10 32 10z" fill="#6366f1" opacity="0.8"/>
      <circle cx="26" cy="30" r="3" fill="#e0e7ff"/>
      <circle cx="38" cy="30" r="3" fill="#e0e7ff"/>
    </svg>`
  },
  {
    key: "mage",
    label: "Mago",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0f0f2a" stroke="#d946ef" stroke-width="2"/>
      <circle cx="32" cy="26" r="10" fill="#d946ef" opacity="0.3"/>
      <path d="M20 46 Q32 18 44 46" stroke="#d946ef" stroke-width="2.5" fill="none"/>
      <circle cx="32" cy="20" r="4" fill="#f0abfc"/>
      <path d="M28 46h8" stroke="#d946ef" stroke-width="2"/>
    </svg>`
  },
  {
    key: "dragon",
    label: "Dragón",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1a0505" stroke="#ef4444" stroke-width="2"/>
      <path d="M16 40c4-8 6-16 16-20 10 4 12 12 16 20-4-2-8-4-16-4s-12 2-16 4z" fill="#ef4444" opacity="0.8"/>
      <path d="M24 24 L20 16 L28 20" fill="#fca5a5"/>
      <path d="M40 24 L44 16 L36 20" fill="#fca5a5"/>
      <circle cx="27" cy="29" r="2.5" fill="#fef2f2"/>
      <circle cx="37" cy="29" r="2.5" fill="#fef2f2"/>
    </svg>`
  },
  {
    key: "warrior",
    label: "Guerrero",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0a1020" stroke="#3b82f6" stroke-width="2"/>
      <rect x="22" y="16" width="20" height="22" rx="4" fill="#1d4ed8" opacity="0.7"/>
      <path d="M26 14 L32 8 L38 14" fill="#60a5fa"/>
      <rect x="26" y="38" width="12" height="12" rx="2" fill="#1e40af"/>
      <path d="M18 28h8M38 28h8" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    key: "ninja",
    label: "Ninja",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#050510" stroke="#10b981" stroke-width="2"/>
      <circle cx="32" cy="28" r="12" fill="#065f46" opacity="0.6"/>
      <rect x="20" y="28" width="24" height="6" rx="1" fill="#047857"/>
      <circle cx="27" cy="26" r="2.5" fill="#6ee7b7"/>
      <circle cx="37" cy="26" r="2.5" fill="#6ee7b7"/>
      <path d="M24 48 L32 42 L40 48" stroke="#10b981" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    key: "beast",
    label: "Bestia",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1c0a00" stroke="#f59e0b" stroke-width="2"/>
      <ellipse cx="32" cy="30" rx="13" ry="14" fill="#92400e" opacity="0.7"/>
      <path d="M19 18 L24 26" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M45 18 L40 26" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="26" cy="29" r="3" fill="#fef3c7"/>
      <circle cx="38" cy="29" r="3" fill="#fef3c7"/>
      <path d="M27 38 Q32 42 37 38" stroke="#fbbf24" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    key: "witch",
    label: "Bruja",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0f0520" stroke="#8b5cf6" stroke-width="2"/>
      <path d="M18 22 L32 10 L46 22 L42 22 L32 14 L22 22z" fill="#7c3aed"/>
      <circle cx="32" cy="30" r="11" fill="#4c1d95" opacity="0.7"/>
      <circle cx="27" cy="28" r="2.5" fill="#c4b5fd"/>
      <circle cx="37" cy="28" r="2.5" fill="#c4b5fd"/>
      <path d="M26 36 Q32 40 38 36" stroke="#8b5cf6" stroke-width="2" fill="none"/>
      <path d="M20 46 Q32 36 44 46" stroke="#7c3aed" stroke-width="1.5" fill="none"/>
    </svg>`
  },
  {
    key: "robot",
    label: "Androide",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#030712" stroke="#06b6d4" stroke-width="2"/>
      <rect x="20" y="18" width="24" height="20" rx="3" fill="#0e7490" opacity="0.7"/>
      <rect x="24" y="22" width="6" height="5" rx="1" fill="#67e8f9"/>
      <rect x="34" y="22" width="6" height="5" rx="1" fill="#67e8f9"/>
      <path d="M26 33 h12" stroke="#06b6d4" stroke-width="2"/>
      <rect x="26" y="38" width="12" height="8" rx="2" fill="#0e7490"/>
      <path d="M18 24h2M44 24h2" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    key: "phoenix",
    label: "Fénix",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1a0800" stroke="#f97316" stroke-width="2"/>
      <path d="M32 16 Q20 28 16 38 Q24 34 32 38 Q40 34 48 38 Q44 28 32 16z" fill="#ea580c" opacity="0.8"/>
      <path d="M32 24 Q28 30 26 36 Q32 33 38 36 Q36 30 32 24z" fill="#fed7aa"/>
      <circle cx="32" cy="32" r="5" fill="#fb923c" opacity="0.6"/>
    </svg>`
  },
  {
    key: "skull",
    label: "Oscuro",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#030303" stroke="#71717a" stroke-width="2"/>
      <ellipse cx="32" cy="28" rx="12" ry="14" fill="#27272a" opacity="0.9"/>
      <circle cx="26" cy="25" r="4" fill="#09090b"/>
      <circle cx="38" cy="25" r="4" fill="#09090b"/>
      <circle cx="26" cy="25" r="2" fill="#e4e4e7"/>
      <circle cx="38" cy="25" r="2" fill="#e4e4e7"/>
      <path d="M26 37 h4 v4 h4 v-4 h4" stroke="#52525b" stroke-width="1.5" fill="none"/>
    </svg>`
  },
  {
    key: "moon",
    label: "Luna",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#040e2a" stroke="#818cf8" stroke-width="2"/>
      <path d="M40 16 A16 16 0 1 0 40 48 A12 12 0 1 1 40 16z" fill="#6366f1" opacity="0.8"/>
      <circle cx="22" cy="22" r="2" fill="#c7d2fe" opacity="0.6"/>
      <circle cx="18" cy="30" r="1.5" fill="#c7d2fe" opacity="0.4"/>
      <circle cx="24" cy="38" r="1" fill="#c7d2fe" opacity="0.5"/>
    </svg>`
  },
];

export function getAvatarSvg(key: string): string {
  return AVATARS.find(a => a.key === key)?.svg ?? AVATARS[0].svg;
}
