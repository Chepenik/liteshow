'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FEATURED_TRACKS, JAMENDO_MIN_QUERY_LENGTH, JAMENDO_SEARCH_LIMIT } from '@/lib/constants';

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  image: string;
  audio?: string;
}

interface HintOverlayProps {
  visible: boolean;
  loading: boolean;
  onFileLoad: (file: File) => void;
  onStreamLoad: (buffer: ArrayBuffer, trackName: string, artistName: string) => void;
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function escHtml(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export default function HintOverlay({ visible, loading, onFileLoad, onStreamLoad }: HintOverlayProps) {
  const [tracks, setTracks] = useState<JamendoTrack[]>([...FEATURED_TRACKS]);
  const [searchEmpty, setSearchEmpty] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Show featured tracks when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setTracks([...FEATURED_TRACKS]);
      setSearchEmpty(false);
      setSearchError('');
    }
  }, [visible]);

  const search = useCallback(async (query: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const params = new URLSearchParams({
      search: query,
      format: 'json',
      limit: String(JAMENDO_SEARCH_LIMIT),
      imagesize: '100',
      audioformat: 'mp32',
    });
    try {
      const res = await fetch(`/api/jamendo?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const results = data.results || [];
      setTracks(results);
      setSearchEmpty(results.length === 0);
      setSearchError('');
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setTracks([]);
        setSearchError('Search failed');
        setSearchEmpty(false);
      }
    }
  }, []);

  const loadTrack = useCallback(async (track: JamendoTrack) => {
    setLoadingTrack(track.id);
    try {
      let audioUrl = track.audio || '';
      // If no audio URL (featured track), fetch it
      if (!audioUrl) {
        const params = new URLSearchParams({ id: track.id, format: 'json', audioformat: 'mp32' });
        const res = await fetch(`/api/jamendo?${params}`);
        if (!res.ok) throw new Error('Failed to get track info');
        const data = await res.json();
        if (!data.results?.[0]) throw new Error('Track not found');
        audioUrl = data.results[0].audio;
      }
      // Fetch audio through proxy
      const res = await fetch(`/api/proxy-audio?url=${encodeURIComponent(audioUrl)}`);
      if (!res.ok) throw new Error(`Failed to load audio (${res.status})`);
      const buf = await res.arrayBuffer();
      onStreamLoad(buf, track.name, track.artist_name);
    } catch (e) {
      alert('Error loading track: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingTrack(null);
    }
  }, [onStreamLoad]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = (e.target as HTMLInputElement).value.trim();
      if (q.length >= JAMENDO_MIN_QUERY_LENGTH) search(q);
    }
  }, [search]);

  const handleFocus = useCallback(() => {
    if (!searchRef.current?.value.trim()) {
      setTracks([...FEATURED_TRACKS]);
      setSearchEmpty(false);
      setSearchError('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    if (e.dataTransfer.files[0]) onFileLoad(e.dataTransfer.files[0]);
  }, [onFileLoad]);

  return (
    <>
      <div id="upload-overlay" className={visible ? '' : 'hidden'}>
        <div className="sacred-bg" />
        <h1>liteshow</h1>
        <div className="subtitle">Sacred Geometry &middot; Audio Visualizer</div>

        <div id="jamendo-search-wrap">
          <input
            ref={searchRef}
            type="text"
            id="jamendo-search"
            placeholder="Search 600,000+ free tracks..."
            autoComplete="off"
            spellCheck={false}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
          />
          <div id="search-results">
            {tracks.map(track => (
              <div
                key={track.id}
                className={`search-result${loadingTrack === track.id ? ' loading' : ''}`}
                onClick={() => loadTrack(track)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="sr-art" src={track.image} alt="" loading="lazy" />
                <div className="sr-info">
                  <div className="sr-title">{track.name}</div>
                  <div className="sr-artist">{track.artist_name}</div>
                </div>
                <span className="sr-dur">{fmtTime(track.duration)}</span>
              </div>
            ))}
          </div>
          {searchEmpty && <div id="search-empty" style={{ display: 'block' }}>No results found</div>}
          {searchError && <div id="search-empty" style={{ display: 'block' }}>{searchError}</div>}
        </div>

        <div id="or-divider">or</div>

        <div
          id="drop-zone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
          onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
          onDrop={handleDrop}
        >
          <div className="icon">&#10013;</div>
          <div className="label">Drop audio file here</div>
          <div className="sub">.wav .mp3 .ogg .flac .aac</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="file-input"
          accept=".wav,.mp3,.ogg,.flac,.aac,.m4a"
          onChange={e => { if (e.target.files?.[0]) onFileLoad(e.target.files[0]); }}
        />

        <div id="jamendo-attr">
          Powered by <a href="https://www.jamendo.com" target="_blank" rel="noopener">Jamendo</a> &middot; Creative Commons
        </div>
      </div>

      <div id="loading" className={loading ? 'active' : ''}>
        <span>Loading...</span>
      </div>
    </>
  );
}
