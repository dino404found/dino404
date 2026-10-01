"use client";
import { AudioLines, Music2, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { AudioPreferences } from "@/lib/game-audio";

export default function ExperienceControls({ preferences, update, unlock, unavailable }: {
  preferences: AudioPreferences;
  update: (patch: Partial<AudioPreferences>) => void;
  unlock: () => void;
  unavailable: boolean;
}) {
  return <div className="experience-controls" aria-label="Game sound and page motion">
    <span className="experience-caption">SET YOUR RHYTHM</span>
    <div className="experience-buttons">
      <button type="button" className="experience-toggle" aria-pressed={preferences.motion} aria-label="Background motion"
        title="Background motion. Your device's reduced-motion setting is always respected."
        onPointerDown={e => e.preventDefault()} onClick={() => update({ motion: !preferences.motion })}>
        <Sparkles size={14} /><span>Motion</span><i aria-hidden="true" />
      </button>
      <button type="button" className="experience-toggle" aria-pressed={preferences.music} aria-label="Game music"
        title="Soft pixel music during your run" onPointerDown={e => e.preventDefault()}
        onClick={() => { update({ music: !preferences.music }); if (!preferences.music) unlock(); }}>
        <Music2 size={14} /><span>Music</span><i aria-hidden="true" />
      </button>
      <button type="button" className="experience-toggle" aria-pressed={preferences.effects} aria-label="Sound effects"
        title="Jump, duck, signal and game-over sounds" onPointerDown={e => e.preventDefault()}
        onClick={() => { update({ effects: !preferences.effects }); if (!preferences.effects) unlock(); }}>
        <AudioLines size={14} /><span>FX</span><i aria-hidden="true" />
      </button>
      <label className="experience-volume" title="Game volume">
        {preferences.volume ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
        <span className="sr-only">Game volume</span>
        <input type="range" min="0" max="100" step="5" value={Math.round(preferences.volume * 100)}
          onChange={e => { update({ volume: Number(e.target.value) / 100 }); unlock(); }}
          aria-valuetext={`${Math.round(preferences.volume * 100)} percent`} />
      </label>
    </div>
    {unavailable && <span className="audio-notice" role="status">Sound unavailable in this browser. You can keep playing.</span>}
  </div>;
}
