"use client";

import { AVATARS } from "@/lib/avatars";

interface AvatarPickerProps {
  selected: string;
  onChange: (key: string) => void;
}

export default function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-white/70 mb-3">Elige tu avatar</p>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.key}
            type="button"
            title={avatar.label}
            onClick={() => onChange(avatar.key)}
            className={`relative w-10 h-10 rounded-xl transition-all duration-200 overflow-hidden border-2 ${
              selected === avatar.key
                ? "border-[#a855f7] scale-110 shadow-lg shadow-[#a855f7]/40"
                : "border-white/10 hover:border-white/30 hover:scale-105"
            }`}
          >
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: avatar.svg }}
            />
            {selected === avatar.key && (
              <div className="absolute inset-0 ring-2 ring-[#a855f7] ring-inset rounded-xl pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
