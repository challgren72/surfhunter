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
  Activity
} from 'lucide-react';

const SPOTS = [
  { id: 1, name: "Torö Stenstrand", lat: 58.82, lng: 17.84, region: "Stockholm" },
  { id: 2, name: "Apelviken", lat: 57.08, lng: 12.24, region: "Varberg" },
  { id: 3, name: "Kåseberga", lat: 55.38, lng: 14.06, region: "Österlen" },
  { id: 4, name: "Mölle", lat: 56.28, lng: 12.49, region: "Skåne" },
  { id: 5, name: "Salusand", lat: 63.49, lng: 19.26, region: "Ångermanland" },
  { id: 6, name: "Knäbäckshusen", lat: 55.59, lng: 14.28, region: "Österlen" },
  { id: 7, name: "Böda Sand", lat: 57.27, lng: 17.05, region: "Öland" },
  { id: 8, name: "Tylösand", lat: 56.64, lng: 12.73, region: "Halmstad" },
  { id: 9, name: "Ekeviken", lat: 57.96, lng: 19.23, region: "Fårö" },
  { id: 10, name: "Smitingen", lat: 62.61, lng: 17.96, region: "Härnösand" },
  { id: 11, name: "Skrea Strand", lat: 56.88, lng: 12.50, region: "Falkenberg" },
  { id: 12, name: "Träslövsläge", lat: 57.06, lng: 12.27, region: "Varberg" },
];

// Hjälpkomponent för vind- och vågriktning
const DirectionArrow = ({ deg, size = 16, className = "" }) => (
  <ArrowUp
    size={size}
    className={className}
    style={{ transform: `rotate(${deg}deg)` }}
  />
);

const CompassRose = ({ title, priorities, onPriorityChange, colorClass = "text-cyan-500" }) => {
  const sectors = [0, 45, 90, 135, 180, 225, 270, 315];
  const sectorNames = ["N", "NO", "Ö", "SO", "S", "SV", "V", "NV"];

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{title}</span>
      <div className="relative w-24 h-24 lg:w-32 lg:h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {sectors.map((deg, i) => {
            const level = priorities[deg] || 0;
            const opacity = level === 0 ? 0.05 : 0.2 + (level / 5) * 0.8;

            const startAngle = deg - 22.5;
            const endAngle = deg + 22.5;
            const x1 = 50 + 40 * Math.sin(startAngle * Math.PI / 180);
            const y1 = 50 - 40 * Math.cos(startAngle * Math.PI / 180);
            const x2 = 50 + 40 * Math.sin(endAngle * Math.PI / 180);
            const y2 = 50 - 40 * Math.cos(endAngle * Math.PI / 180);

            return (
              <path
                key={deg}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 0 1 ${x2} ${y2} Z`}
                className={`cursor-pointer transition-all duration-300 ${colorClass} hover:opacity-100`}
                fill="currentColor"
                fillOpacity={opacity}
                stroke="currentColor"
                strokeOpacity={level > 0 ? 0.5 : 0.1}
                strokeWidth={level > 0 ? 1.5 : 0.5}
                onClick={() => onPriorityChange(deg)}
              />
            );
          })}
          {sectors.map((deg, i) => (
            <text
              key={`label-${deg}`}
              x={50 + 52 * Math.sin(deg * Math.PI / 180)}
              y={50 - 52 * Math.cos(deg * Math.PI / 180)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="900"
              className="fill-neutral-600 pointer-events-none uppercase tracking-tighter"
            >
              {sectorNames[i]}
            </text>
          ))}
          <circle cx="50" cy="50" r="2" className="fill-neutral-800" />
        </svg>
      </div>
    </div>
  );
};

const App = () => {
  const [activeSpot, setActiveSpot] = useState(SPOTS[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const mainContentRef = useRef(null);

  // Default settings for a spot
  const DEFAULT_SETTINGS = {
    weights: { wind: 3, waves: 5, temp: 1, sun: 1 },
    windPriorities: { 0: 0, 45: 0, 90: 0, 135: 0, 180: 0, 225: 0, 270: 0, 315: 0 },
    wavePriorities: { 0: 0, 45: 0, 90: 0, 135: 0, 180: 0, 225: 0, 270: 0, 315: 0 }
  };

  // Persisted state for all spots
  const [allSettings, setAllSettings] = useState(() => {
    const saved = localStorage.getItem('svaj_spot_settings_v2');
    return saved ? JSON.parse(saved) : {};
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('svaj_spot_settings_v2', JSON.stringify(allSettings));
  }, [allSettings]);

  // Current spot's settings with fallback to defaults
  const currentSettings = allSettings[activeSpot.id] || DEFAULT_SETTINGS;

  const updateCurrentSettings = (updateFn) => {
    setAllSettings(prev => ({
      ...prev,
      [activeSpot.id]: updateFn(prev[activeSpot.id] || { ...DEFAULT_SETTINGS })
    }));
  };

  const handleWeightChange = (key) => {
    updateCurrentSettings(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: (prev.weights[key] % 5) + 1 }
    }));
  };

  const handlePriorityChange = (type, deg) => {
    const field = type === 'wind' ? 'windPriorities' : 'wavePriorities';
    updateCurrentSettings(prev => ({
      ...prev,
      [field]: { ...prev[field], [deg]: (prev[field][deg] + 1) % 6 }
    }));
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
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${activeSpot.lat}&longitude=${activeSpot.lng}&daily=sunrise,sunset&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloudcover&models=best_match&wind_speed_unit=ms&timezone=auto&forecast_days=10`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${activeSpot.lat}&longitude=${activeSpot.lng}&hourly=wave_height,wave_direction,wave_period&timezone=auto&forecast_days=10`;

        const [weatherRes, marineRes] = await Promise.all([
          fetch(weatherUrl).then(res => {
            if (!res.ok) throw new Error("Väderdata kunde inte hämtas");
            return res.json();
          }),
          fetch(marineUrl).then(res => {
            if (!res.ok) throw new Error("Marindata kunde inte hämtas");
            return res.json();
          })
        ]);

        setWeatherData({
          weather: weatherRes,
          marine: marineRes
        });
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
    if (!weatherData || !weatherData.marine.hourly.wave_height[hourIdx]) return 0;

    const wave = weatherData.marine.hourly.wave_height[hourIdx] || 0;
    const wind = weatherData.weather.hourly.wind_speed_10m[hourIdx] || 0;
    const temp = weatherData.weather.hourly.temperature_2m[hourIdx] || 0;
    const clouds = weatherData.weather.hourly.cloudcover[hourIdx] || 0;
    const windDir = weatherData.weather.hourly.wind_direction_10m[hourIdx] || 0;
    const waveDir = weatherData.marine.hourly.wave_direction[hourIdx] || 0;

    const windSector = Math.round(windDir / 45) * 45 % 360;
    const waveSector = Math.round(waveDir / 45) * 45 % 360;

    const { weights, windPriorities, wavePriorities } = currentSettings;

    const windDirBoost = (windPriorities[windSector] / 5) * 5;
    const waveDirBoost = (wavePriorities[waveSector] / 5) * 5;

    const waveScore = (Math.min(wave * 2, 5) * weights.waves) + (waveDirBoost * (weights.waves / 2));
    const windScore = ((wind > 4 && wind < 12 ? 5 : wind > 12 ? 2 : 1) * weights.wind) + (windDirBoost * (weights.wind / 2));
    const tempScore = (temp > 10 ? 5 : temp > 0 ? 3 : 1) * weights.temp;
    const sunScore = (clouds < 30 ? 5 : 2) * weights.sun;

    const totalWeight = weights.waves + weights.wind + weights.temp + weights.sun;
    const directionWeight = (windPriorities[windSector] > 0 ? weights.wind / 2 : 0) + (wavePriorities[waveSector] > 0 ? weights.waves / 2 : 0);

    return Math.round(((waveScore + windScore + tempScore + sunScore) / ((totalWeight + directionWeight) * 5)) * 10);
  };

  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500 overflow-hidden">

      {/* Mobil Toppbar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800 z-50 relative">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tighter text-cyan-400 italic uppercase tracking-widest">Svaj</h1>
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
            <h1 className="text-3xl font-black tracking-tighter text-cyan-400 italic uppercase">Svaj</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Cold Water Surfhunter</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-neutral-900">
            <p className="text-[10px] text-neutral-500 font-black uppercase mb-3 ml-2 tracking-widest">Välj Lineup</p>
            {SPOTS.map(spot => (
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
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none uppercase">{activeSpot.name}</h2>
              <p className="text-neutral-500 text-xs mt-3 font-bold tracking-widest uppercase">Position: {activeSpot.lat.toFixed(3)}°N / {activeSpot.lng.toFixed(3)}°E</p>
            </div>

            {/* Viktning av parametrar */}
            <div className="flex flex-col lg:flex-row gap-6 bg-neutral-900/40 p-6 lg:p-8 rounded-[3rem] border border-neutral-800/50 backdrop-blur-xl w-full md:w-auto shadow-2xl">
              <div className="flex flex-col justify-center border-r border-white/5 pr-6 hidden lg:flex">
                <p className="text-[10px] text-neutral-500 font-black uppercase mb-4 text-center tracking-[0.1em]">Prioritera Förhållanden</p>
                <div className="flex gap-4">
                  {[
                    { key: 'waves', icon: Waves, color: 'text-cyan-400' },
                    { key: 'wind', icon: Wind, color: 'text-blue-400' },
                    { key: 'temp', icon: Thermometer, color: 'text-orange-400' },
                    { key: 'sun', icon: Sun, color: 'text-yellow-400' }
                  ].map(item => (
                    <div key={item.key} className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleWeightChange(item.key)}
                        className={`p-3 rounded-2xl transition-all active:scale-90 bg-neutral-800 hover:bg-neutral-700 border border-white/5 ${item.color}`}
                      >
                        <item.icon size={22} />
                      </button>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 w-1 rounded-full transition-colors ${i <= currentSettings.weights[item.key] ? 'bg-cyan-500' : 'bg-neutral-800'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobilvyn visar bara vikter först */}
              <div className="lg:hidden flex justify-around w-full mb-6">
                {[
                  { key: 'waves', icon: Waves, color: 'text-cyan-400' },
                  { key: 'wind', icon: Wind, color: 'text-blue-400' },
                  { key: 'temp', icon: Thermometer, color: 'text-orange-400' },
                  { key: 'sun', icon: Sun, color: 'text-yellow-400' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleWeightChange(item.key)}
                    className={`p-3 rounded-2xl transition-all active:scale-90 bg-neutral-800 border border-white/5 ${item.color}`}
                  >
                    <item.icon size={22} />
                  </button>
                ))}
              </div>

              <div className="flex gap-8 lg:gap-12 justify-center lg:justify-start">
                <CompassRose
                  title="Vågriktning"
                  priorities={currentSettings.wavePriorities}
                  onPriorityChange={(deg) => handlePriorityChange('wave', deg)}
                  colorClass="text-cyan-500"
                />
                <CompassRose
                  title="Vindriktning"
                  priorities={currentSettings.windPriorities}
                  onPriorityChange={(deg) => handlePriorityChange('wind', deg)}
                  colorClass="text-blue-500"
                />
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
            <div key={activeSpot.id} className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* Nuvarande Score */}
              <div className="bg-neutral-900 rounded-[3rem] p-10 lg:p-12 border border-neutral-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                  <Zap size={300} />
                </div>
                <div className="relative z-10 w-full">
                  <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] mb-6">SVAJ Score Just Nu</div>
                  <div className="text-[120px] lg:text-[160px] font-black leading-none mb-6 tabular-nums tracking-tighter text-white drop-shadow-2xl">
                    {getSurfScore(currentHour)}
                  </div>
                  <div className="px-8 py-3 bg-black/60 backdrop-blur-md rounded-full inline-block border border-white/10">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">
                      {getSurfScore(currentHour) >= 8 ? 'EPIC CONDITIONS' :
                        getSurfScore(currentHour) >= 5 ? 'VÄRT ETT FÖRSÖK' : 'VÄNTA PÅ NÄSTA PUSH'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detaljer Just Nu */}
              <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <ForecastCard
                  title="Våghöjd"
                  value={`${weatherData.marine.hourly.wave_height[currentHour]}m`}
                  sub={`${weatherData.marine.hourly.wave_period[currentHour]}s period`}
                  icon={Waves}
                  color="text-cyan-400"
                />
                <ForecastCard
                  title="Vind"
                  value={`${weatherData.weather.hourly.wind_speed_10m[currentHour]} m/s`}
                  sub={`Byar: ${weatherData.weather.hourly.wind_gusts_10m[currentHour]} m/s`}
                  icon={Wind}
                  color="text-blue-400"
                />
                <ForecastCard
                  title="Luft"
                  value={`${weatherData.weather.hourly.temperature_2m[currentHour]}°C`}
                  sub="Cold water gear"
                  icon={Thermometer}
                  color="text-orange-400"
                />
                <ForecastCard
                  title="Moln"
                  value={`${weatherData.weather.hourly.cloudcover[currentHour]}%`}
                  sub={weatherData.weather.hourly.cloudcover[currentHour] < 30 ? 'Gnistrande sol' : 'Helt mulet'}
                  icon={Cloud}
                  color="text-neutral-400"
                />
              </div>

              {/* 10-dagars översikt */}
              <div className="col-span-full mt-12 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black flex items-center gap-4 italic tracking-tight uppercase">
                    <Clock size={28} className="text-cyan-500" />
                    10-dagars prognos
                  </h3>
                  <span className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] hidden sm:block italic">Analys kl 14:00 • Klicka för detaljerad graf</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const hourIdx = i * 24 + 14;
                    const score = getSurfScore(hourIdx);
                    const waveHeight = weatherData.marine.hourly.wave_height[hourIdx];
                    const windSpeed = weatherData.weather.hourly.wind_speed_10m[hourIdx];
                    const windDeg = weatherData.weather.hourly.wind_direction_10m[hourIdx];
                    const temp = weatherData.weather.hourly.temperature_2m[hourIdx];
                    const cloudCover = weatherData.weather.hourly.cloudcover[hourIdx];

                    const date = new Date();
                    date.setDate(date.getDate() + i);

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`bg-neutral-900/40 border rounded-[2.5rem] p-6 flex flex-col transition-all hover:scale-[1.03] hover:bg-neutral-900/70 cursor-pointer group ${score >= 7 ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-neutral-800/60'
                          }`}
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

                        <div className={`text-5xl font-black mb-6 tabular-nums tracking-tighter text-center ${score >= 7 ? 'text-cyan-400' : 'text-white'}`}>
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

                          <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1"><Wind size={10} /> Vind</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-neutral-300">{windSpeed}</span>
                                <DirectionArrow deg={windDeg} size={10} className="text-cyan-500" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1">Temp <Thermometer size={10} /></span>
                              <span className="text-xs font-bold text-neutral-300">{temp}°</span>
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
      </div>

      {/* DETALJERAD DAG-MODAL */}
      {selectedDayIndex !== null && weatherData && (
        <DayDetailModal
          dayIndex={selectedDayIndex}
          weatherData={weatherData}
          onClose={() => setSelectedDayIndex(null)}
          setSelectedDayIndex={setSelectedDayIndex}
          getSurfScore={getSurfScore}
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
    </div>
  );
};

// MODAL-KOMPONENT FÖR DETALJERAD GRAF
const DayDetailModal = ({ dayIndex, weatherData, onClose, getSurfScore, setSelectedDayIndex }) => {
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
  const maxWave = Math.max(...hours.map(h => weatherData.marine.hourly.wave_height[h] || 0), 1);
  const maxPeriod = Math.max(...hours.map(h => weatherData.marine.hourly.wave_period[h] || 0), 1);
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
            <button
              onClick={goToNextDay}
              disabled={dayIndex === 9}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border border-white/5 ${dayIndex === 9 ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 active:scale-95 text-cyan-500'}`}
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white border border-white/5 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Innehåll */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">

          {/* Graf-sektion */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Activity size={18} /> Trendkurva för dygnets alla parametrar
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
                  const barHeight = (score / 10) * (chartH - padding * 2);
                  return (
                    <g key={`score-group-${i}`}>
                      <rect
                        x={x - barWidth / 2}
                        y={chartH - padding - barHeight}
                        width={barWidth}
                        height={barHeight}
                        fill="url(#scoreGradient)"
                        className="transition-all duration-700"
                      />
                      {score > 0 && (
                        <text
                          x={x}
                          y={chartH - padding - barHeight - 5}
                          textAnchor="middle"
                          fill="#06b6d4"
                          fontSize="10"
                          fontWeight="900"
                          className="opacity-80"
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
                <path d={getPath(weatherData.marine.hourly.wave_period, maxPeriod)} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" strokeOpacity="0.4" />

                {/* Vågor (Heldragen) */}
                <path d={getPath(weatherData.marine.hourly.wave_height, maxWave)} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

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

                      <text x="15" y="50" fill="#06b6d4" fontSize="10" fontWeight="900" className="uppercase opacity-60">SVAJ Score</text>
                      <text x="185" y="50" textAnchor="end" fill="#06b6d4" fontSize="12" fontWeight="900">{getSurfScore(dayStartIdx + hoverIndex)}</text>

                      <text x="15" y="70" fill="#a3a3a3" fontSize="10" fontWeight="900" className="uppercase opacity-60">Vågor</text>
                      <text x="185" y="70" textAnchor="end" fill="#fff" fontSize="10" fontWeight="900">
                        {weatherData.marine.hourly.wave_height[dayStartIdx + hoverIndex]}m / {weatherData.marine.hourly.wave_period[dayStartIdx + hoverIndex]}s / {weatherData.marine.hourly.wave_direction[dayStartIdx + hoverIndex]}°
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
              const waveH = weatherData.marine.hourly.wave_height[h];
              const waveD = weatherData.marine.hourly.wave_direction[h];
              const waveP = weatherData.marine.hourly.wave_period[h];
              const windS = weatherData.weather.hourly.wind_speed_10m[h];
              const windG = weatherData.weather.hourly.wind_gusts_10m[h];
              const windD = weatherData.weather.hourly.wind_direction_10m[h];
              const temp = weatherData.weather.hourly.temperature_2m[h];

              return (
                <div key={h} className="grid grid-cols-8 gap-4 px-8 py-5 rounded-3xl bg-white/[0.02] border border-white/[0.01] hover:bg-white/[0.05] hover:border-white/10 transition-all items-center tabular-nums group">
                  <span className="font-bold text-neutral-400 group-hover:text-cyan-400 transition-colors">{String(idx).padStart(2, '0')}:00</span>
                  <div className={`flex items-center gap-2 font-black ${score >= 7 ? 'text-cyan-400' : 'text-white'}`}>
                    <Zap size={12} className={score >= 7 ? 'animate-pulse' : 'opacity-20'} /> {score}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{waveH}m</span>
                    <DirectionArrow deg={waveD} size={12} className="text-cyan-600" />
                  </div>
                  <span className="text-neutral-500 font-bold">{waveP}s</span>
                  <span className="font-bold text-blue-300/80">{windS} <span className="text-[8px] opacity-40">m/s</span></span>
                  <span className="text-blue-500 font-black">{windG} <span className="text-[8px] opacity-40 text-neutral-500">m/s</span></span>
                  <div className="flex items-center gap-2">
                    <DirectionArrow deg={windD} size={14} className="text-cyan-500" />
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

const ForecastCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-neutral-900 p-6 lg:p-8 rounded-[2.5rem] border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl">
    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-black flex items-center justify-center mb-6 lg:mb-8 shadow-inner border border-white/5 ${color}`}>
      <Icon size={24} className="group-hover:scale-110 transition-transform duration-500" />
    </div>
    <div>
      <div className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-2">{title}</div>
      <div className="text-2xl lg:text-3xl font-black tabular-nums tracking-tighter text-white uppercase">{value}</div>
      <div className="text-[10px] text-neutral-600 mt-3 font-black uppercase tracking-tighter leading-tight opacity-80 italic">{sub}</div>
    </div>
  </div>
);

export default App;