import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wind,
  Waves,
  Thermometer,
  Sun,
  Navigation,
  Clock,
  ChevronRight,
  ChevronLeft,
  MapPin,
  AlertCircle,
  Cloud,
  Zap,
  Menu,
  X,
  ArrowUp,
  Maximize2,
  Activity,
  Settings,
  Search,
  Car,
  Camera,
  Users,
  Footprints,
  Globe,
  Info,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import ObservationCard from './components/ObservationCard';
import { METOBS_STATIONS, OCOBS_STATIONS } from './data/smhi-stations';
import { calculateSurfScore } from './utils/score';
import SensorConfigModal from './components/SensorConfigModal';
import SpotInfoCard from './components/SpotInfoCard';
import AdminDashboard from './components/AdminDashboard';

import logo from './assets/images/svaj_logo_gradient_anim.svg';

import { DEFAULT_SPOTS } from './data/spots';
import AISummaryModal from './components/AISummaryModal';
import { Sparkles } from 'lucide-react'; // Adding Sparkles for the button

const SCORE_TEXTS = {
  0: "INGEN SURF",
  1: "VÄNTA PÅ NÄSTA PUSH",
  2: "KANSKE SURFBART",
  3: "VÄRT ETT FÖRSÖK",
  4: "RIKTIGT BRA",
  5: "EPISKA FÖRHÅLLANDEN"
};

const SCORE_COLORS = {
  0: { text: 'text-neutral-700', bg: 'bg-neutral-500/5', border: 'border-neutral-900', hex: '#404040' },
  1: { text: 'text-rose-300', bg: 'bg-rose-300/5', border: 'border-rose-300/10', hex: '#fda4af' },
  2: { text: 'text-orange-300', bg: 'bg-orange-300/5', border: 'border-orange-300/10', hex: '#fdba74' },
  3: { text: 'text-amber-300', bg: 'bg-amber-300/5', border: 'border-amber-300/10', hex: '#fcd34d' },
  4: { text: 'text-emerald-300', bg: 'bg-emerald-300/5', border: 'border-emerald-300/10', hex: '#6ee7b7' },
  5: { text: 'text-sky-300', bg: 'bg-sky-300/5', border: 'border-sky-300/10', hex: '#7dd3fc' }
};

// Hjälpkomponent för vind- och vågriktning
export const DirectionArrow = ({ deg, size = 24, strokeWidth = 2, className = '' }) => (
  <div
    className={`transition-transform duration-700 ease-spring ${className}`}
    style={{ transform: `rotate(${deg}deg)` }}
  >
    <Navigation size={size} strokeWidth={strokeWidth} />
  </div>
);

const ConditionRose = ({ rules, type, label, unit, colorClass, maxRange = 20 }) => {
  const sectors = [0, 45, 90, 135, 180, 225, 270, 315];
  const sectorNames = ["N", "NO", "Ö", "SO", "S", "SV", "V", "NV"];

  const getOpacity = (score) => {
    if (score === 5) return 0.95;
    if (score === 4) return 0.65;
    if (score === 3) return 0.35;
    if (score === 2) return 0.15;
    return 0.05;
  };

  const getScoreData = (deg) => {
    let bestScore = 0;
    let maxValue = 0;
    const typeKey = type === 'wave' ? 'waveDirs' : 'windDirs';
    const valueMaxKey = type === 'wave' ? 'periodMax' : 'windMax';
    const valueMinKey = type === 'wave' ? 'periodMin' : 'windMin';

    // Only verify against Score 5 (Optimal)
    if (rules[5] && rules[5][typeKey].includes(deg)) {
      bestScore = 5;
      maxValue = rules[5][valueMaxKey];
    }
    return { score: bestScore, value: maxValue };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Background Reference Lines */}
          <circle cx="50" cy="50" r="45" className="fill-white/[0.02] stroke-white/5" strokeWidth="0.5" />
          {[15, 30].map(r => (
            <circle key={r} cx="50" cy="50" r={r} className="fill-none stroke-white/[0.03]" strokeWidth="0.3" strokeDasharray="1 2" />
          ))}

          {sectors.map((deg) => {
            const { score, value } = getScoreData(deg);
            // Normalize radius based on maxRange. Minimum radius for visibility if value is small.
            const radius = score > 0 ? Math.max((value / maxRange) * 45, 8) : 5;

            const startAngle = deg - 22.1; // Small gap between sectors
            const endAngle = deg + 22.1;

            const x1 = 50 + radius * Math.sin(startAngle * Math.PI / 180);
            const y1 = 50 - radius * Math.cos(startAngle * Math.PI / 180);
            const x2 = 50 + radius * Math.sin(endAngle * Math.PI / 180);
            const y2 = 50 - radius * Math.cos(endAngle * Math.PI / 180);

            return (
              <path
                key={deg}
                d={`M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                className={`transition-all duration-700 ${score > 0 ? colorClass : 'text-neutral-800'}`}
                fill="currentColor"
                fillOpacity={getOpacity(score)}
                stroke="currentColor"
                strokeOpacity={score > 0 ? 0.3 : 0}
                strokeWidth="0.5"
              />
            );
          })}

          {/* Labels */}
          {sectors.map((deg, i) => (
            <text
              key={`label-${deg}`}
              x={50 + 54 * Math.sin(deg * Math.PI / 180)}
              y={50 - 54 * Math.cos(deg * Math.PI / 180)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6"
              fontWeight="900"
              className="fill-neutral-600 uppercase tracking-tighter"
            >
              {sectorNames[i]}
            </text>
          ))}
          <circle cx="50" cy="50" r="1.5" className="fill-neutral-950" />
        </svg>
      </div>
      <div className="mt-4 flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">{label}</span>
        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{unit}</span>
      </div>
    </div>
  );
};

const App = () => {
  const [spots, setSpots] = useState(DEFAULT_SPOTS);
  const [activeSpot, setActiveSpot] = useState(DEFAULT_SPOTS[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false); // Unified Admin Dashboard
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false); // Legacy: keeping for now but will be unused
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false); // Legacy: keeping for now to avoid break, will alias to isAdminOpen logic
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, analyze
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const mainContentRef = useRef(null);

  // FETCH SPOTS FROM API
  useEffect(() => {
    const loadSpots = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spots`);
        if (!res.ok) throw new Error('Failed to fetch spots');
        const data = await res.json();

        if (data && data.length > 0) {
          setSpots(data);

          // Extract settings map from spots
          const settingsMap = {};
          data.forEach(spot => {
            if (spot.settings) settingsMap[spot.id] = spot.settings;
          });
          setAllSettings(settingsMap);

          // Set active spot (default to first)
          setActiveSpot(data[0]);
        } else {
          // Fallback if DB empty
          setSpots(DEFAULT_SPOTS);
          setActiveSpot(DEFAULT_SPOTS[0]);
        }
      } catch (err) {
        console.error("API Error:", err);
        // Fallback
        setSpots(DEFAULT_SPOTS);
        setActiveSpot(DEFAULT_SPOTS[0]);
      }
    };
    loadSpots();
  }, []);



  // Update a specific spot's data
  const handleUpdateSpot = (spotId, newData) => {
    const updatedSpots = spots.map(s => s.id === spotId ? { ...s, ...newData } : s);
    setSpots(updatedSpots);

    // Update active spot if it matches
    if (activeSpot.id === spotId) {
      setActiveSpot({ ...activeSpot, ...newData });
    }

    // Persist
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spots/${spotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    }).catch(e => console.error("Persist failed", e));
  };

  const handleCreateSpot = async (newSpotData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpotData)
      });
      if (!res.ok) throw new Error('Failed to create spot');

      const createdSpot = await res.json();
      setSpots(prev => [...prev, createdSpot]);

      // Init settings for new spot
      setAllSettings(prev => ({
        ...prev,
        [createdSpot.id]: createdSpot.settings
      }));

      return createdSpot;
    } catch (err) {
      console.error("Failed to create spot:", err);
      return null;
    }
  };

  // Default settings for a spot
  const DEFAULT_SCORE_RULES = {
    1: { waveMin: 0.1, waveMax: 5.0, periodMin: 2, periodMax: 20, windMin: 0, windMax: 20, windDirs: [0, 45, 90, 135, 180, 225, 270, 315], waveDirs: [0, 45, 90, 135, 180, 225, 270, 315] },
    2: { waveMin: 0.3, waveMax: 5.0, periodMin: 3, periodMax: 20, windMin: 0, windMax: 15, windDirs: [0, 45, 90, 135, 180, 225, 270, 315], waveDirs: [0, 45, 90, 135, 180, 225, 270, 315] },
    3: { waveMin: 0.5, waveMax: 5.0, periodMin: 4, periodMax: 20, windMin: 0, windMax: 12, windDirs: [0, 45, 90, 135, 180, 225, 270, 315], waveDirs: [0, 45, 90, 135, 180, 225, 270, 315] },
    4: { waveMin: 0.8, waveMax: 5.0, periodMin: 5, periodMax: 20, windMin: 0, windMax: 10, windDirs: [0, 45, 90, 135, 180, 225, 270, 315], waveDirs: [0, 45, 90, 135, 180, 225, 270, 315] },
    5: { waveMin: 1.2, waveMax: 5.0, periodMin: 6, periodMax: 20, windMin: 0, windMax: 8, windDirs: [0, 45, 90, 135, 180, 225, 270, 315], waveDirs: [0, 45, 90, 135, 180, 225, 270, 315] }
  };

  const DEFAULT_SETTINGS = {
    activeActivity: 'surf',
    activityRules: {
      surf: DEFAULT_SCORE_RULES,
      windsurf: JSON.parse(JSON.stringify(DEFAULT_SCORE_RULES)),
      wingfoil: JSON.parse(JSON.stringify(DEFAULT_SCORE_RULES)),
      kitesurf: JSON.parse(JSON.stringify(DEFAULT_SCORE_RULES))
    },
    // Keep for legacy compatibility during migration
    weights: { wind: 3, waves: 5, temp: 1, sun: 1 },
    windPriorities: { 0: 0, 45: 0, 90: 0, 135: 0, 180: 0, 225: 0, 270: 0, 315: 0 },
    wavePriorities: { 0: 0, 45: 0, 90: 0, 135: 0, 180: 0, 225: 0, 270: 0, 315: 0 },
    thresholds: { waveFactor: 2.0, windMin: 4, windMax: 12 }
  };

  const [allSettings, setAllSettings] = useState({});

  // Sync to local storage


  // Current spot's settings with fallback to defaults
  const currentSettings = allSettings[activeSpot.id] || DEFAULT_SETTINGS;

  const updateCurrentSettings = (updateFn, targetSpotId = null) => {
    const id = targetSpotId || activeSpot.id;
    setAllSettings(prev => ({
      ...prev,
      [id]: updateFn(prev[id] || { ...DEFAULT_SETTINGS })
    }));
  };


  const handleAdminChange = (key, value, targetSpotId = null) => {
    const id = targetSpotId || activeSpot.id;
    // Optimistic
    updateCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }), id);

    // Persist
    const currentSpotSettings = allSettings[id] || DEFAULT_SETTINGS;
    const newSettings = { ...currentSpotSettings, [key]: value };

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings })
    }).catch(e => console.error("Settings persist failed", e));
  };

  const handleSpotSelect = (spot) => {
    setActiveSpot(spot);
    setIsMenuOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchSurfData = async () => {
      setLoading(true);
      setError(null);
      setWeatherData(null);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/weather/forecast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: activeSpot.lat, lng: activeSpot.lng })
        });

        if (!res.ok) throw new Error("Väderdata kunde inte hämtas från servern");
        const data = await res.json();
        const weatherRes = { data: data.weather }; // Adapter to match previous structure slightly or just use direct
        // Actually the proxy returns { weather: ..., marine: ... } directly.
        // Let's adapt the destructuring below:

        setWeatherData(data); // data now has .weather and .marine properties directly
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSurfData();
  }, [activeSpot]);

  const getSurfScore = (hourIdx) => {
    if (!weatherData) return 0;

    const wave = weatherData?.marine?.hourly?.wave_height?.[hourIdx] || 0;
    const period = weatherData?.marine?.hourly?.wave_period?.[hourIdx] || 0;
    const waveDir = weatherData?.marine?.hourly?.wave_direction?.[hourIdx] || 0;

    const wind = weatherData?.weather?.hourly?.wind_speed_10m?.[hourIdx] || 0;
    const windDir = weatherData?.weather?.hourly?.wind_direction_10m?.[hourIdx] || 0;

    const windSector = Math.round(windDir / 45) * 45 % 360;
    const waveSector = Math.round(waveDir / 45) * 45 % 360;

    const activity = currentSettings.activeActivity || 'surf';
    const rules = (currentSettings.activityRules && currentSettings.activityRules[activity])
      || DEFAULT_SETTINGS.activityRules[activity];

    return calculateSurfScore({
      wave,
      period,
      wind,
      windDir,
      waveDir
    }, rules);

    return 0;
  };

  const getLiveScore = () => {
    if (!liveData) return 0;
    const { waveHeight, wavePeriod, windSpeed, windDir, waveDir } = liveData;

    const activity = currentSettings.activeActivity || 'surf';
    const rules = (currentSettings.activityRules && currentSettings.activityRules[activity])
      || DEFAULT_SETTINGS.activityRules[activity];

    return calculateSurfScore({
      wave: waveHeight,
      period: wavePeriod,
      wind: windSpeed,
      windDir,
      waveDir
    }, rules);
  };

  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500 overflow-hidden">

      {/* Mobil Toppbar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800 z-50 relative">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Svaj Logo" className="h-[26px] w-auto" />
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-xl bg-neutral-800 text-cyan-400 border border-neutral-700 active:scale-90 transition-transform"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-row h-screen overflow-hidden">

        {/* Mobil Bakgrundsskugga */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Sidopanel */}
        <aside className={`
          fixed inset-y-0 left-0 w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col z-50 
          transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 border-b border-neutral-800 shrink-0 hidden lg:block">
            <img src={logo} alt="Svaj Logo" className="h-[35px] w-auto mb-2" />
            <a
              href="https://score.svajsurf.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-neutral-500 hover:text-cyan-400 uppercase tracking-[0.2em] font-bold transition-colors block"
            >
              score by svajsurf.se
            </a>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-neutral-900">
            <p className="text-[10px] text-neutral-500 font-black uppercase mb-3 ml-2 tracking-widest">Välj Lineup</p>
            {spots.filter(s => s.isActive !== false).map(spot => (
              <button
                key={spot.id}
                onClick={() => handleSpotSelect(spot)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between group active:scale-95 ${activeSpot.id === spot.id
                  ? 'bg-cyan-500 text-black font-black shadow-xl shadow-cyan-500/20 translate-x-1'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
              >
                <div>
                  <div className="text-sm tracking-tight">{spot.name}</div>
                  <div className={`text-[10px] uppercase font-bold tracking-tighter ${activeSpot.id === spot.id ? 'text-black/50' : 'text-neutral-600'}`}>
                    {spot.region}
                  </div>
                </div>
                <ChevronRight size={18} className={`transition-transform duration-300 ${activeSpot.id === spot.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-50'}`} />
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-neutral-800 text-[10px] text-neutral-600 font-bold uppercase tracking-widest text-center">
            Stay Salty • Version 1.6
          </div>
        </aside>

        {/* Huvudinnehåll */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-black p-4 lg:p-10 relative scroll-smooth z-10 w-full"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">Aktiv Prognos</span>
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none uppercase">{activeSpot.name}</h2>
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="p-2 rounded-full bg-neutral-900/50 border border-white/5 text-neutral-500 hover:text-cyan-400 hover:bg-neutral-800 transition-all active:scale-90"
                >
                  <Settings size={20} />
                </button>
              </div>
              <p className="text-neutral-500 text-xs mt-3 font-bold tracking-widest uppercase">Position: {activeSpot.lat.toFixed(3)}°N / {activeSpot.lng.toFixed(3)}°E</p>
            </div>

            {/* Sport-väljare (Header) */}
            <div className="flex bg-neutral-900/40 p-2 lg:p-3 rounded-[2rem] border border-neutral-800/50 backdrop-blur-xl w-full md:w-auto shadow-2xl relative group/selector">
              <div className="absolute inset-x-0 -top-[1px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover/selector:opacity-100 transition-opacity" />

              <div className="flex gap-2 w-full justify-around md:justify-start">
                {[
                  { id: 'surf', icon: Waves, label: 'Surf', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                  { id: 'windsurf', icon: Wind, label: 'Wind', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { id: 'wingfoil', icon: Zap, label: 'Wing', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { id: 'kitesurf', icon: Navigation, label: 'Kite', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
                ].map(sport => {
                  const isActive = (currentSettings.activeActivity || 'surf') === sport.id;
                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleAdminChange('activeActivity', sport.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 px-3 md:px-5 rounded-2xl transition-all active:scale-95 border ${isActive ? `${sport.bg} ${sport.border} ${sport.color} ring-1 ring-white/10` : 'bg-neutral-800/40 border-white/5 text-neutral-600 hover:text-neutral-400'}`}
                    >
                      <sport.icon size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{sport.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-8 text-cyan-500 font-black tracking-[0.3em] text-xs animate-pulse italic uppercase">Hämtar 10-dagars prognos...</p>
            </div>
          ) : error ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-red-400 text-center px-6">
              <AlertCircle size={64} className="mb-6 opacity-20" />
              <h3 className="text-2xl font-black mb-3 tracking-tight uppercase">Data ej tillgänglig</h3>
              <p className="text-sm text-neutral-500 max-w-sm font-medium italic">{error}</p>
            </div>
          ) : weatherData ? (
            <div key={activeSpot.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* Partial Data Warning */}
              {weatherData?.warnings?.length > 0 && (
                <div className="mb-6 mx-auto max-w-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
                  <AlertCircle size={20} className="text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Varning: {weatherData.warnings.join(', ')}
                  </span>
                </div>
              )}

              {/* Score & Combined Rose Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch mb-8">
                {/* Nuvarande Score */}
                <div className="bg-neutral-900 rounded-[2.5rem] p-8 lg:p-10 border border-neutral-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl min-h-[320px]">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 text-cyan-500">
                    <Zap size={240} />
                  </div>

                  {/* Activity Indicator / Switcher Shortcut */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
                    {currentSettings.activeActivity === 'windsurf' ? <Wind size={10} className="text-blue-400" /> :
                      currentSettings.activeActivity === 'wingfoil' ? <Zap size={10} className="text-emerald-400" /> :
                        currentSettings.activeActivity === 'kitesurf' ? <Navigation size={10} className="text-rose-400" /> :
                          <Waves size={10} className="text-cyan-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                      {currentSettings.activeActivity || 'Surf'}
                    </span>
                  </div>

                  {/* Gemini AI Button */}
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="absolute top-6 left-6 p-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500 hover:scale-110 transition-all z-20 group/ai"
                  >
                    <Sparkles size={16} />
                    <span className="absolute left-full ml-3 px-2 py-1 bg-neutral-900 border border-white/10 rounded-lg text-[10px] uppercase font-bold text-white whitespace-nowrap opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none">
                      AI Analys
                    </span>
                  </button>

                  <div className="relative z-10 w-full pt-4">
                    <div className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.5em] mb-4">SVAJ Score Just Nu</div>
                    <div className={`text-[100px] lg:text-[130px] font-black leading-none mb-4 tabular-nums tracking-tighter drop-shadow-2xl transition-colors duration-1000 ${getSurfScore(currentHour) === 0 ? 'text-neutral-700' : 'text-white'} flex items-baseline justify-center gap-4`}>
                      <div className="flex flex-col items-center">
                        <span className="leading-none">{getSurfScore(currentHour)}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest -mt-2 ${getSurfScore(currentHour) === 0 ? 'text-neutral-600' : 'text-white/40'}`}>Forecast</span>
                      </div>
                      {getLiveScore() > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[40px] lg:text-[50px] font-black text-emerald-500 tracking-tighter animate-in fade-in slide-in-from-bottom-2 leading-none">
                            {getLiveScore()}
                          </span>
                          <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mt-1">Live</span>
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-2 bg-black/60 backdrop-blur-md rounded-full inline-block border border-white/10">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                        {SCORE_TEXTS[getSurfScore(currentHour)]}
                      </span>
                    </div>



                    {/* Condition Roses */}
                    <div className="flex flex-row gap-4 justify-center mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      {(() => {
                        const activity = currentSettings.activeActivity || 'surf';
                        const activityRules = currentSettings.activityRules || { surf: DEFAULT_SCORE_RULES };
                        const rules = activityRules[activity] || DEFAULT_SCORE_RULES;
                        return (
                          <>
                            <ConditionRose
                              rules={rules}
                              type="wind"
                              label="Optimal Vind"
                              unit="m/s"
                              colorClass="text-blue-500"
                              maxRange={20}
                            />
                            <ConditionRose
                              rules={rules}
                              type="wave"
                              label="Optimal Våg"
                              unit="s"
                              colorClass="text-cyan-400"
                              maxRange={20}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quick Access Settings */}
                  <button
                    onClick={() => setIsAdminOpen(true)}
                    className="absolute bottom-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-600 hover:text-cyan-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Settings size={18} />
                  </button>
                </div>

                {/* Right Sidebar Stack */}
                <div className="xl:col-span-2 flex flex-col gap-4">

                  {/* 1. Live Observations - Spans Top */}
                  {(() => {
                    const activeStations = currentSettings.observationStations || {};

                    return (
                      <ObservationCard
                        stations={activeStations}
                        stationNames={{
                          wind: METOBS_STATIONS.find(s => s.id == activeStations.wind)?.name,
                          wave: OCOBS_STATIONS.find(s => s.id == activeStations.wave)?.name,
                          windSecondary: METOBS_STATIONS.find(s => s.id == activeStations.windSecondary)?.name,
                          waveSecondary: OCOBS_STATIONS.find(s => s.id == activeStations.waveSecondary)?.name
                        }}
                        onDataLoad={setLiveData}
                      />
                    );
                  })()}

                  {/* 2. Row of Forecast Cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {/* Våghöjd */}
                    <div className="min-w-0 bg-neutral-900 p-3 lg:p-4 rounded-3xl border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl h-full relative overflow-hidden group/card">
                      <div className="absolute top-0 right-0 p-3 opacity-10 text-cyan-500 group-hover/card:opacity-20 transition-opacity">
                        <Waves size={40} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em]">Vågor</span>
                          <div className="flex flex-col items-center">
                            <DirectionArrow deg={weatherData?.marine?.hourly?.wave_direction?.[currentHour] || 0} size={14} className="text-cyan-500" />
                            <span className="text-[8px] font-bold text-neutral-600">{Math.round(weatherData?.marine?.hourly?.wave_direction?.[currentHour] || 0)}°</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xl lg:text-2xl font-black text-white tracking-tighter block">{weatherData?.marine?.hourly?.wave_height?.[currentHour] || '-'}m</span>
                          <span className="text-[10px] font-bold text-neutral-500 tracking-wide">{weatherData?.marine?.hourly?.wave_period?.[currentHour] || '-'}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Vind */}
                    <div className="min-w-0 bg-neutral-900 p-3 lg:p-4 rounded-3xl border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl h-full relative overflow-hidden group/card">
                      <div className="absolute top-0 right-0 p-3 opacity-10 text-blue-500 group-hover/card:opacity-20 transition-opacity">
                        <Wind size={40} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em]">Vind</span>
                          <div className="flex flex-col items-center">
                            <DirectionArrow deg={weatherData.weather.hourly.wind_direction_10m[currentHour]} size={14} className="text-blue-500" />
                            <span className="text-[8px] font-bold text-neutral-600">{Math.round(weatherData.weather.hourly.wind_direction_10m[currentHour])}°</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xl lg:text-2xl font-black text-white tracking-tighter block">{Math.round(weatherData.weather.hourly.wind_speed_10m[currentHour])} <span className="text-xs opacity-50">m/s</span></span>
                          <span className="text-[10px] font-bold text-neutral-500 tracking-wide">({Math.round(weatherData.weather.hourly.wind_gusts_10m[currentHour])})</span>
                        </div>
                      </div>
                    </div>

                    {/* Luft & Moln (Compact Version) */}
                    <div className="min-w-0 bg-neutral-900 p-4 rounded-3xl border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Cloud size={40} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] block mb-1">Luft</span>
                          <span className="text-xl font-black text-white tracking-tighter">{Math.round(weatherData.weather.hourly.temperature_2m[currentHour])}°</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] block mb-1">Moln</span>
                          <span className="text-xl font-black text-white tracking-tighter">{weatherData.weather.hourly.cloudcover[currentHour]}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Om Spotet - Full Width */}
              <SpotInfoCard spot={activeSpot} activeActivity={currentSettings.activeActivity || 'surf'} />

              {/* 10-dagars översikt */}
              <div className="col-span-full pb-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black flex items-center gap-4 italic tracking-tight uppercase">
                    <Clock size={28} className="text-cyan-500" />
                    10-dagars prognos
                  </h3>
                  <span className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] hidden sm:block italic">Analys kl 14:00 • Klicka för detaljerad graf</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    // Find the hour with the HIGHEST score for this day
                    let bestHourIdx = i * 24 + 12; // Default to noon as fallback
                    let maxScore = -1;

                    // Iterate 06:00 to 22:00 to find best daytime conditions, or full day?
                    // Let's do full 24h to be safe, or maybe 04-22 to avoid dark night surfing?
                    // User said "highest forecast value", implying score.
                    for (let h = 4; h <= 21; h++) {
                      const currentIdx = i * 24 + h;
                      if (currentIdx < weatherData.weather.hourly.wind_speed_10m.length) {
                        const s = getSurfScore(currentIdx);
                        if (s > maxScore) {
                          maxScore = s;
                          bestHourIdx = currentIdx;
                        }
                      }
                    }

                    const hourIdx = bestHourIdx;
                    const score = getSurfScore(hourIdx);
                    const waveHeight = weatherData.marine.hourly.wave_height[hourIdx];
                    const windSpeed = weatherData.weather.hourly.wind_speed_10m[hourIdx];
                    const windDeg = weatherData.weather.hourly.wind_direction_10m[hourIdx];
                    const cloudCover = weatherData.weather.hourly.cloudcover[hourIdx];
                    const temp = weatherData.weather.hourly.temperature_2m[hourIdx];

                    const date = new Date();
                    date.setDate(date.getDate() + i);

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`bg-neutral-900/40 border rounded-[2.5rem] p-6 flex flex-col transition-all hover:scale-[1.03] hover:bg-neutral-900/70 cursor-pointer group ${score >= 4 ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-neutral-800/60'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest italic">
                            {i === 0 ? 'Idag' : date.toLocaleDateString('sv-SE', { weekday: 'short' })}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {cloudCover < 30 ? <Sun size={14} className="text-yellow-500" /> : <Cloud size={14} className="text-neutral-500" />}
                            <Maximize2 size={10} className="text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className={`text-5xl font-black mb-6 tabular-nums tracking-tighter text-center transition-colors duration-500 ${score === 0 ? 'text-neutral-700' : (score >= 4 ? 'text-cyan-400' : 'text-white')}`}>
                          {score}
                        </div>

                        <div className="space-y-4 w-full">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                              <span className="text-neutral-500 flex items-center gap-1"><Waves size={10} /> Vågor</span>
                              <span className="text-neutral-200">{waveHeight}m</span>
                            </div>
                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 transition-all duration-1000"
                                style={{ width: `${Math.min(waveHeight * 40, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                              <span className="text-neutral-500 flex items-center gap-1"><Wind size={10} /> Vind</span>
                              <span className="text-neutral-200">{windSpeed} m/s</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-1000"
                                  style={{ width: `${Math.min(windSpeed * 5, 100)}%` }}
                                />
                              </div>
                              <DirectionArrow deg={windDeg} size={12} className="text-blue-400" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1">Temp <Thermometer size={10} /></span>
                              <span className="text-xs font-bold text-neutral-300">{temp}°</span>
                            </div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-white/5 text-center">
                            <div className={`text-[9px] font-black uppercase tracking-tighter truncate ${score >= 4 ? 'text-cyan-400' : 'text-neutral-500'}`}>
                              {SCORE_TEXTS[score]}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Dekoration */}
          <div className="fixed bottom-0 right-0 text-[22vw] font-black text-white/[0.01] pointer-events-none select-none -mb-16 -mr-16 leading-none italic uppercase z-0">
            Svaj
          </div>
        </main>
      </div >

      {/* DETALJERAD DAG-MODAL */}
      {
        selectedDayIndex !== null && weatherData && (
          <DayDetailModal
            dayIndex={selectedDayIndex}
            weatherData={weatherData}
            onClose={() => setSelectedDayIndex(null)}
            setSelectedDayIndex={setSelectedDayIndex}
            getSurfScore={getSurfScore}
            activeActivity={currentSettings.activeActivity || 'surf'}
            onActivityChange={(id) => handleAdminChange('activeActivity', id)}
          />
        )
      }

      {/* Unified Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          activeSpot={activeSpot}
          allSettings={allSettings}
          defaultSettings={DEFAULT_SETTINGS}
          onClose={() => setIsAdminOpen(false)}
          onAdminChange={handleAdminChange}
          onUpdateSpot={handleUpdateSpot}
          onCreateSpot={handleCreateSpot}
          spots={spots}
          weatherData={weatherData}
          currentHour={new Date().getHours()}
        />
      )}

      {/* AI Analysis Modal */}
      {isAIModalOpen && (
        <AISummaryModal
          activeSpot={activeSpot}
          weatherData={weatherData}
          currentRules={allSettings[activeSpot.id]?.activityRules?.[allSettings[activeSpot.id]?.activeActivity || 'surf']}
          onClose={() => setIsAIModalOpen(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333333; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div >
  );
};

// MODAL-KOMPONENT FÖR DETALJERAD GRAF
const DayDetailModal = ({ dayIndex, weatherData, onClose, getSurfScore, setSelectedDayIndex, activeActivity, onActivityChange }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const dayStartIdx = dayIndex * 24;
  const hours = Array.from({ length: 24 }).map((_, h) => dayStartIdx + h);
  const date = new Date();
  date.setDate(date.getDate() + dayIndex);

  // Navigations-logik
  const goToPreviousDay = () => {
    if (dayIndex > 0) setSelectedDayIndex(dayIndex - 1);
  };
  const goToNextDay = () => {
    if (dayIndex < 9) setSelectedDayIndex(dayIndex + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPreviousDay();
      if (e.key === 'ArrowRight') goToNextDay();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dayIndex]);

  // Tooltip-logik
  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartAreaWidth = chartW - padding * 2;
    const relativeX = (x / rect.width) * chartW - padding;
    const hour = Math.round((relativeX / chartAreaWidth) * 23);

    if (hour >= 0 && hour <= 23) {
      setHoverIndex(hour);
    } else {
      setHoverIndex(null);
    }
  };

  // Beräkna maxvärden för skalning av Y-axel
  const maxWave = Math.max(...hours.map(h => weatherData?.marine?.hourly?.wave_height?.[h] || 0), 1);
  const maxPeriod = Math.max(...hours.map(h => weatherData?.marine?.hourly?.wave_period?.[h] || 0), 1);
  const maxWind = Math.max(...hours.map(h => weatherData.weather.hourly.wind_gusts_10m[h] || 0), 10);
  const temps = hours.map(h => weatherData.weather.hourly.temperature_2m[h]);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps, minTemp + 5);

  // SVG-inställningar
  const chartW = 1000;
  const chartH = 450;
  const padding = 50;

  // Generera kurva
  const getPath = (data, max, min = 0) => {
    return hours.map((h, i) => {
      const x = padding + (i / 23) * (chartW - padding * 2);
      const val = data[h] || 0;
      const y = padding + (chartH - padding * 2) - ((val - min) / (max - min)) * (chartH - padding * 2);
      return (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/90 backdrop-blur-xl animate-in">
      <div className="bg-neutral-900 w-full max-w-6xl max-h-[95vh] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col animate-slide-up shadow-2xl shadow-cyan-500/10">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button
              onClick={goToPreviousDay}
              disabled={dayIndex === 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border border-white/5 ${dayIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 active:scale-95 text-cyan-500'}`}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                {date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest italic">Detaljerad Tim-analys</span>
              </div>
            </div>

            {/* Sport Selector Removed from here */}
            <button
              onClick={goToNextDay}
              disabled={dayIndex === 9}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border border-white/5 ${dayIndex === 9 ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 active:scale-95 text-cyan-500'}`}
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Sport Selector */}
            <div className="hidden md:flex bg-neutral-800/50 p-1.5 rounded-xl border border-white/5 gap-1">
              {[
                { id: 'surf', icon: Waves, label: 'Surf', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { id: 'windsurf', icon: Wind, label: 'Wind', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { id: 'wingfoil', icon: Zap, label: 'Wing', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { id: 'kitesurf', icon: Navigation, label: 'Kite', color: 'text-rose-400', bg: 'bg-rose-500/10' }
              ].map(sport => (
                <button
                  key={sport.id}
                  onClick={() => onActivityChange(sport.id)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 ${activeActivity === sport.id
                    ? `${sport.bg} ${sport.color} ring-1 ring-white/10 shadow-lg`
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'}`}
                  title={sport.label}
                >
                  <sport.icon size={16} />
                  {activeActivity === sport.id && (
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none hidden md:inline-block">{sport.label}</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white border border-white/5 active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Innehåll */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">

          {/* Graf-sektion */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Activity size={18} /> Trendkurvor och score
              </h4>
              <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-500" /> Vind</span>
                <span className="flex items-center gap-2"><div className="w-3 h-0.5 border-t-2 border-dashed border-blue-500 opacity-60" /> Vindbyar</span>
                <span className="flex items-center gap-2"><div className="w-3 h-0.5 bg-cyan-500" /> Vågor</span>
                <span className="flex items-center gap-2"><div className="w-3 h-0.5 border-t-2 border-dashed border-cyan-500 opacity-60" /> Vågperiod</span>
                <span className="flex items-center gap-2"><div className="w-3 h-0.5 bg-amber-500" /> Temperatur</span>
              </div>
            </div>

            <div className="relative bg-black/60 rounded-[2.5rem] p-4 lg:p-6 border border-white/5 overflow-x-auto shadow-inner">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full min-w-[900px] h-[450px] overflow-visible select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
              >

                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Rutnät (Grid) */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                  const y = padding + tick * (chartH - padding * 2);
                  return (
                    <line key={tick} x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                  );
                })}

                {/* Y-AXEL VÄRDEN (Vind m/s till vänster) */}
                <text x={padding - 10} y={padding - 15} textAnchor="end" fill="#3b82f6" fontSize="10" fontWeight="900" className="uppercase">Vind m/s</text>
                {[0, 0.5, 1].map(tick => (
                  <text key={tick} x={padding - 10} y={padding + (1 - tick) * (chartH - padding * 2) + 4} textAnchor="end" fill="#3b82f6" fontSize="11" fontWeight="bold">
                    {Math.round(tick * maxWind)}
                  </text>
                ))}

                {/* Y-AXEL VÄRDEN (Vågor m till höger) */}
                <text x={chartW - padding + 10} y={padding - 15} textAnchor="start" fill="#06b6d4" fontSize="10" fontWeight="900" className="uppercase">Vågor m</text>
                {[0, 0.5, 1].map(tick => (
                  <text key={tick} x={chartW - padding + 10} y={padding + (1 - tick) * (chartH - padding * 2) + 4} textAnchor="start" fill="#06b6d4" fontSize="11" fontWeight="bold">
                    {(tick * maxWave).toFixed(1)}
                  </text>
                ))}

                {/* --- RITA STAPLAR --- */}
                {/* SVAJ Score Bars */}
                {hours.map((h, i) => {
                  const score = getSurfScore(h);
                  const x = padding + (i / 23) * (chartW - padding * 2);
                  const barWidth = (chartW - padding * 2) / 24 * 0.6;
                  const barHeight = (score / 5) * (chartH - padding * 2);
                  return (
                    <g key={`score-group-${i}`}>
                      <rect
                        x={x - barWidth / 2}
                        y={chartH - padding - barHeight}
                        width={barWidth}
                        height={barHeight}
                        fill={SCORE_COLORS[score].hex}
                        style={{ opacity: 0.3 + (score / 5) * 0.7 }}
                        className="transition-all duration-700"
                      />
                      {score > 0 && (
                        <text
                          x={x}
                          y={chartH - padding - barHeight - 5}
                          textAnchor="middle"
                          fill={SCORE_COLORS[score].hex}
                          fontSize="10"
                          fontWeight="900"
                          style={{ opacity: 0.5 + (score / 5) * 0.5 }}
                        >
                          {score}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* --- RITA KURVOR --- */}

                {/* Vindbyar (Streckad) */}
                <path d={getPath(weatherData.weather.hourly.wind_gusts_10m, maxWind)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" strokeOpacity="0.4" />

                {/* Vind (Heldragen) */}
                <path d={getPath(weatherData.weather.hourly.wind_speed_10m, maxWind)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />

                {/* Vågperiod (Streckad) */}
                <path d={getPath(weatherData?.marine?.hourly?.wave_period || [], maxPeriod)} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" strokeOpacity="0.4" />

                {/* Vågor (Heldragen) */}
                <path d={getPath(weatherData?.marine?.hourly?.wave_height || [], maxWave)} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Temperatur (Kontrastfärg heldragen) */}
                <path d={getPath(weatherData.weather.hourly.temperature_2m, maxTemp, minTemp)} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

                {/* X-AXEL TID */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <g key={i}>
                    <text x={padding + (i / 23) * (chartW - padding * 2)} y={chartH - padding + 25} textAnchor="middle" fill="#555" fontSize="10" fontWeight="900">
                      {String(i).padStart(2, '0')}
                    </text>
                    <line
                      x1={padding + (i / 23) * (chartW - padding * 2)}
                      y1={chartH - padding}
                      x2={padding + (i / 23) * (chartW - padding * 2)}
                      y2={chartH - padding + 5}
                      stroke="#333"
                    />
                  </g>
                ))}

                {/* --- TOOLTIP OVERLAY --- */}
                {hoverIndex !== null && (
                  <g pointerEvents="none">
                    <line
                      x1={padding + (hoverIndex / 23) * (chartW - padding * 2)}
                      y1={padding}
                      x2={padding + (hoverIndex / 23) * (chartW - padding * 2)}
                      y2={chartH - padding}
                      stroke="#06b6d4"
                      strokeWidth="1"
                      strokeDasharray="4,2"
                    />

                    {/* Tooltip Box */}
                    <g transform={`translate(${padding + (hoverIndex / 23) * (chartW - padding * 2) + (hoverIndex > 18 ? -215 : 15)}, ${padding})`}>
                      <rect
                        width="200"
                        height="130"
                        rx="16"
                        fill="rgba(0,0,0,0.85)"
                        stroke="rgba(6,182,212,0.3)"
                        strokeWidth="1"
                        className="backdrop-blur-xl"
                      />
                      <text x="15" y="25" fill="#fff" fontSize="12" fontWeight="900" className="uppercase italic tracking-tighter">
                        Kl {String(hoverIndex).padStart(2, '0')}:00
                      </text>

                      <text x="15" y="50" fill={SCORE_COLORS[getSurfScore(dayStartIdx + hoverIndex)].hex} fontSize="12" fontWeight="900" className="uppercase italic tracking-tighter">
                        {getSurfScore(dayStartIdx + hoverIndex)} - {SCORE_TEXTS[getSurfScore(dayStartIdx + hoverIndex)]}
                      </text>

                      <text x="15" y="70" fill="#a3a3a3" fontSize="10" fontWeight="900" className="uppercase opacity-60">Vågor</text>
                      <text x="185" y="70" textAnchor="end" fill="#fff" fontSize="10" fontWeight="900">
                        {weatherData?.marine?.hourly?.wave_height?.[dayStartIdx + hoverIndex] || '-'}m / {weatherData?.marine?.hourly?.wave_period?.[dayStartIdx + hoverIndex] || '-'}s / {weatherData?.marine?.hourly?.wave_direction?.[dayStartIdx + hoverIndex] || '-'}°
                      </text>

                      <text x="15" y="90" fill="#3b82f6" fontSize="10" fontWeight="900" className="uppercase opacity-60">Vind</text>
                      <text x="185" y="90" textAnchor="end" fill="#fff" fontSize="10" fontWeight="900">
                        {weatherData.weather.hourly.wind_speed_10m[dayStartIdx + hoverIndex]} ({weatherData.weather.hourly.wind_gusts_10m[dayStartIdx + hoverIndex]}) m/s / {weatherData.weather.hourly.wind_direction_10m[dayStartIdx + hoverIndex]}°
                      </text>

                      <text x="15" y="110" fill="#f59e0b" fontSize="10" fontWeight="900" className="uppercase opacity-60">Temp</text>
                      <text x="185" y="110" textAnchor="end" fill="#fff" fontSize="10" fontWeight="900">
                        {weatherData.weather.hourly.temperature_2m[dayStartIdx + hoverIndex]}°C
                      </text>
                    </g>
                  </g>
                )}
              </svg>
              <div className="mt-4 text-center">
                <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em] italic">
                  Score baserat på prioriterade förhållanden
                </span>
              </div>
            </div>
          </div>

          {/* Tim-för-Tim Tabell */}
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 border-b border-white/5 sticky top-0 bg-neutral-900 z-10">
              <span>Tid</span>
              <span>Score</span>
              <span>Våg / Rikt.</span>
              <span>Period</span>
              <span>Vind</span>
              <span>Byar</span>
              <span>Riktning</span>
              <span>Temp</span>
            </div>

            {hours.map((h, idx) => {
              const score = getSurfScore(h);
              const waveH = weatherData?.marine?.hourly?.wave_height?.[h] || '-';
              const waveD = weatherData?.marine?.hourly?.wave_direction?.[h] || 0;
              const waveP = weatherData?.marine?.hourly?.wave_period?.[h] || '-';
              const windS = weatherData.weather.hourly.wind_speed_10m[h];
              const windG = weatherData.weather.hourly.wind_gusts_10m[h];
              const windD = weatherData.weather.hourly.wind_direction_10m[h];
              const temp = weatherData.weather.hourly.temperature_2m[h];

              return (
                <div key={h} className="grid grid-cols-8 gap-4 px-8 py-5 rounded-3xl bg-white/[0.02] border border-white/[0.01] hover:bg-white/[0.05] hover:border-white/10 transition-all items-center tabular-nums group">
                  <span className="font-bold text-neutral-400 group-hover:text-cyan-400 transition-colors">{String(idx).padStart(2, '0')}:00</span>
                  <div className={`flex items-center gap-2 font-black ${score >= 4 ? 'text-cyan-400' : 'text-white'}`}>
                    <Zap size={12} className={score >= 4 ? 'animate-pulse' : 'opacity-20'} /> {score}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{waveH}m</span>
                    <DirectionArrow deg={waveD} size={18} strokeWidth={3} className="text-cyan-500" />
                  </div>
                  <span className="text-neutral-500 font-bold">{waveP}s</span>
                  <span className="font-bold text-blue-300/80">{windS} <span className="text-[8px] opacity-40">m/s</span></span>
                  <span className="text-blue-500 font-black">{windG} <span className="text-[8px] opacity-40 text-neutral-500">m/s</span></span>
                  <div className="flex items-center gap-2">
                    <DirectionArrow deg={windD} size={18} strokeWidth={3} className="text-cyan-500" />
                    <span className="text-[10px] text-neutral-600 font-bold uppercase">{windD}°</span>
                  </div>
                  <span className="font-black text-amber-500/90">{temp}°C</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-black/20 border-t border-white/5 text-center">
          <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em]">SVAJ Algoritm v2.0 • Vindbyar & Periodanalys inkluderad</p>
        </div>
      </div>
    </div>
  );
};

const ForecastCard = ({ title, value, sub, icon: Icon, color, direction }) => (
  <div className="bg-neutral-900 p-5 lg:p-6 rounded-3xl border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl h-full min-h-[160px]">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-black flex items-center justify-center shadow-inner border border-white/5 ${color}`}>
        <Icon size={20} className="group-hover:scale-110 transition-transform duration-500" />
      </div>
      {direction !== undefined && (
        <div className="flex flex-col items-center gap-1">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/5 ${color}`}>
            <DirectionArrow deg={direction} size={18} />
          </div>
          <div className="text-[9px] font-black text-neutral-500 tabular-nums tracking-tighter">{Math.round(direction)}°</div>
        </div>
      )}
    </div>
    <div>
      <div className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-1">{title}</div>
      <div className="text-xl lg:text-2xl font-black tabular-nums tracking-tighter text-white uppercase">{value}</div>
      <div className="text-[9px] text-neutral-600 mt-2 font-black uppercase tracking-tighter leading-tight opacity-80 italic">{sub}</div>
    </div>
  </div>
);
// ADMIN-MODAL FÖR ATT JUSTERA REGELVERK (1-5)
// End of App component


export default App;