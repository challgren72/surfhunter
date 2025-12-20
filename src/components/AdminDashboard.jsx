import React, { useState, useEffect } from 'react';
import {
    X,
    Settings,
    Wind,
    Waves,
    Activity,
    MapPin,
    ChevronRight,
    Save,
    Zap,
    Navigation,
    Cloud,
    Sparkles,
    Plus,
    Trash2
} from 'lucide-react';
import { DirectionArrow } from '../App';
import { calculateSurfScore } from '../utils/score';
import { METOBS_STATIONS, OCOBS_STATIONS } from '../data/smhi-stations';

// --- SUB-COMPONENTS ---

// 1. STATION SELECT (Reused)
const StationSelect = ({ label, stations, value, onChange }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Safety check for stations array
    const safeStations = stations || [];
    const filtered = safeStations.filter(s => s.name.toLowerCase().startsWith(search.toLowerCase()));

    // Handle case where value might be undefined/null
    const selectedStation = value ? safeStations.find(s => s.id == value) : null;

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{label}</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 flex justify-between items-center text-left hover:border-white/10 transition-colors"
                >
                    <span className={`text-sm font-bold ${selectedStation ? 'text-white' : 'text-neutral-500 italic'}`}>
                        {selectedStation ? selectedStation.name : 'Välj station...'}
                    </span>
                    <Settings size={14} className="text-neutral-500" />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Sök station..."
                            className="w-full bg-black/20 p-3 text-sm font-bold text-white border-b border-white/5 outline-none placeholder:text-neutral-600 uppercase tracking-wide"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => {
                                    onChange(null);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className="w-full p-3 text-left hover:bg-white/5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors border-b border-white/5 flex justify-between items-center group italic"
                            >
                                Ingen (Ta bort)
                                {!value && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}
                            </button>
                            {filtered.map(station => (
                                <button
                                    key={station.id}
                                    onClick={() => {
                                        onChange(station.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="w-full p-3 text-left hover:bg-white/5 text-sm font-medium text-neutral-300 hover:text-cyan-400 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                                >
                                    {station.name}
                                    {station.id == value && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="p-4 text-center text-xs text-neutral-600 font-bold uppercase italic">Inga stationer hittades</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 2. SCORE CONFIGURATOR
const ScoreConfigurator = ({
    currentSettings,
    onAdminChange,
    weatherData,
    currentHour
}) => {
    const [activeTab, setActiveTab] = useState(5);
    const activeActivity = currentSettings.activeActivity || 'surf';
    const activityRules = currentSettings.activityRules;

    const rules = activityRules[activeActivity];
    const currentRule = rules[activeTab];

    // Helper to calculate preview
    const getPreviewScore = () => {
        if (!weatherData) return 0;
        const wave = weatherData.marine?.hourly?.wave_height?.[currentHour] || 0;
        const period = weatherData.marine?.hourly?.wave_period?.[currentHour] || 0;
        const wind = weatherData.weather?.hourly?.wind_speed_10m?.[currentHour] || 0;
        const windDir = weatherData.weather?.hourly?.wind_direction_10m?.[currentHour] || 0;
        const waveDir = weatherData.marine?.hourly?.wave_direction?.[currentHour] || 0;

        return calculateSurfScore({
            wave, period, wind, windDir, waveDir
        }, rules);
    };

    const previewScore = getPreviewScore();

    const updateRule = (key, value) => {
        onAdminChange('activityRules', {
            ...activityRules,
            [activeActivity]: {
                ...rules,
                [activeTab]: { ...currentRule, [key]: value }
            }
        });
    };

    const DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];

    const toggleDir = (type, deg) => {
        const currentDirs = currentRule[type] || [];
        const newDirs = currentDirs.includes(deg)
            ? currentDirs.filter(d => d !== deg)
            : [...currentDirs, deg].sort((a, b) => a - b);
        updateRule(type, newDirs);
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col">
            {/* New Header with Live Preview */}
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Score Regler</h3>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Ställ in kriterier för varje score-nivå</p>
                </div>
                <div className={`px-4 py-2 bg-black/40 rounded-xl inline-flex items-center gap-3 border border-white/5 mr-24`}>
                    <div className="text-right">
                        <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Live Preview</span>
                        <span className="block text-[8px] text-neutral-600 font-bold uppercase tracking-wide">Timme {currentHour}:00</span>
                    </div>
                    <span className={`text-2xl font-black leading-none ${previewScore > 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>{previewScore}</span>
                </div>
            </div>

            {/* Activity + Level Tabs */}
            <div className="space-y-4">
                {/* Activities */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl gap-2 border border-white/5">
                    {[
                        { id: 'surf', icon: Waves, label: 'Surf' },
                        { id: 'windsurf', icon: Wind, label: 'Wind' },
                        { id: 'wingfoil', icon: Zap, label: 'Wing' },
                        { id: 'kitesurf', icon: Navigation, label: 'Kite' }
                    ].map(sport => (
                        <button
                            key={sport.id}
                            onClick={() => onAdminChange('activeActivity', sport.id)}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeActivity === sport.id ? 'bg-white/10 text-cyan-400 font-black ring-1 ring-white/10' : 'text-neutral-500 hover:text-neutral-300 font-bold'}`}
                        >
                            <sport.icon size={14} />
                            <span className="uppercase tracking-[0.1em] text-[10px] hidden sm:inline">{sport.label}</span>
                        </button>
                    ))}
                </div>

                {/* Level Tabs (1-5) */}
                <div className="flex bg-black/20 p-1.5 rounded-2xl gap-2 overflow-x-auto">
                    {[1, 2, 3, 4, 5].map(s => (
                        <button
                            key={s}
                            onClick={() => setActiveTab(s)}
                            className={`flex-1 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap px-4 ${activeTab === s ? (s >= 4 ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-neutral-700 text-white') : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Score {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sliders & Toggles */}
            <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 flex-grow">
                {/* Waves */}
                <div className="space-y-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                    <h4 className="flex items-center gap-2 text-cyan-500 font-black uppercase tracking-widest text-xs mb-4">
                        <Waves size={14} /> Vågor
                    </h4>

                    {/* Height */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            <span>Våghöjd</span>
                            <span className="text-white">{currentRule.waveMin.toFixed(1)} - {currentRule.waveMax.toFixed(1)} m</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <input type="range" min="0" max="4" step="0.1" value={currentRule.waveMin} onChange={(e) => updateRule('waveMin', parseFloat(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                            <input type="range" min="0" max="6" step="0.1" value={currentRule.waveMax} onChange={(e) => updateRule('waveMax', parseFloat(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                        </div>
                    </div>

                    {/* Period */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            <span>Period</span>
                            <span className="text-white">{(currentRule.periodMin || 0)} - {(currentRule.periodMax || 20)} s</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <input type="range" min="0" max="15" step="1" value={currentRule.periodMin || 0} onChange={(e) => updateRule('periodMin', parseInt(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                            <input type="range" min="0" max="25" step="1" value={currentRule.periodMax || 20} onChange={(e) => updateRule('periodMax', parseInt(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                        </div>
                    </div>

                    {/* Direction */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Riktning</span>
                        <div className="grid grid-cols-8 gap-2">
                            {DEGREES.map(deg => (
                                <button
                                    key={deg}
                                    onClick={() => toggleDir('waveDirs', deg)}
                                    className={`p-1.5 rounded-lg border transition-all flex flex-col items-center gap-1 ${currentRule.waveDirs.includes(deg) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-neutral-800/50 border-white/5 text-neutral-600'}`}
                                >
                                    <DirectionArrow deg={deg} size={12} className={currentRule.waveDirs.includes(deg) ? 'text-cyan-400' : 'text-neutral-700'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wind */}
                <div className="space-y-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                    <h4 className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-xs mb-4">
                        <Wind size={14} /> Vind
                    </h4>

                    {/* Speed */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            <span>Styrka</span>
                            <span className="text-white">{currentRule.windMin} - {currentRule.windMax} m/s</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <input type="range" min="0" max="15" step="1" value={currentRule.windMin} onChange={(e) => updateRule('windMin', parseInt(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                            <input type="range" min="0" max="25" step="1" value={currentRule.windMax} onChange={(e) => updateRule('windMax', parseInt(e.target.value))} className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                        </div>
                    </div>

                    {/* Direction */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Riktning</span>
                        <div className="grid grid-cols-8 gap-2">
                            {DEGREES.map(deg => (
                                <button
                                    key={deg}
                                    onClick={() => toggleDir('windDirs', deg)}
                                    className={`p-1.5 rounded-lg border transition-all flex flex-col items-center gap-1 ${currentRule.windDirs.includes(deg) ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-neutral-800/50 border-white/5 text-neutral-600'}`}
                                >
                                    <DirectionArrow deg={deg} size={12} className={currentRule.windDirs.includes(deg) ? 'text-blue-400' : 'text-neutral-700'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// 3. SENSOR SETTINGS
const SensorSettings = ({ currentSettings, onAdminChange, activeSpot }) => {
    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Sensorer</h3>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Koppla mätstationer för live-data</p>
                </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow space-y-8">
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                    <p className="text-xs text-emerald-400 font-bold leading-relaxed">
                        Välj vilka SMHI och OcObs bojar som ska visas för {activeSpot.name}.
                    </p>
                </div>

                {/* Wind Section */}
                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 space-y-6">
                    <h4 className="flex items-center gap-2 text-neutral-300 font-black uppercase tracking-widest text-xs">
                        <Wind size={14} /> MetObs (Vind & Temp)
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                        <StationSelect
                            label="Primär Station"
                            stations={METOBS_STATIONS}
                            value={currentSettings.observationStations?.wind || ''}
                            onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, wind: id })}
                        />
                        <StationSelect
                            label="Sekundär Station (Referens)"
                            stations={METOBS_STATIONS}
                            value={currentSettings.observationStations?.windSecondary || ''}
                            onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, windSecondary: id })}
                        />
                    </div>
                </div>

                {/* Wave Section */}
                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 space-y-6">
                    <h4 className="flex items-center gap-2 text-neutral-300 font-black uppercase tracking-widest text-xs">
                        <Waves size={14} /> OcObs (Våg)
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                        <StationSelect
                            label="Primär Vågboj"
                            stations={OCOBS_STATIONS}
                            value={currentSettings.observationStations?.wave || ''}
                            onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, wave: id })}
                        />
                        <StationSelect
                            label="Sekundär Vågboj (Referens)"
                            stations={OCOBS_STATIONS}
                            value={currentSettings.observationStations?.waveSecondary || ''}
                            onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, waveSecondary: id })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. SPOT EDITOR (NEW)
const SpotEditor = ({ activeSpot, onUpdateSpot }) => {
    // Local state for editing form to avoid excessive re-renders on every keystroke, 
    // or direct binding if preferred. Let's bind directly for simplicity.
    const handleChange = (field, value) => {
        onUpdateSpot(activeSpot.id, { [field]: value });
    };

    const handleNestedChange = (parent, field, value) => {
        onUpdateSpot(activeSpot.id, {
            [parent]: {
                ...(activeSpot[parent] || {}),
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Om Spotet</h3>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Information, texter och länkar</p>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Namn</label>
                    <input
                        type="text"
                        value={activeSpot.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm focus:border-cyan-500 outline-none transition-colors"
                    />
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Region</label>
                        <input
                            type="text"
                            value={activeSpot.region || ''}
                            onChange={(e) => handleChange('region', e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm focus:border-cyan-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        {/* Empty for spacing or maybe an ID field? */}
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">ID</label>
                        <input
                            type="text"
                            disabled
                            value={activeSpot.id}
                            className="w-full bg-neutral-900/50 p-3 rounded-xl border border-white/5 text-neutral-500 font-mono text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Latitud</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={activeSpot.lat || ''}
                            onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm focus:border-cyan-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Longitud</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={activeSpot.lng || ''}
                            onChange={(e) => handleChange('lng', parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm focus:border-cyan-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Beskrivning</label>

                        {/* AI Generator Controls */}
                        <div className="flex gap-2">
                            <select
                                id="tonality-select"
                                className="bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/5 px-2 py-1 outline-none"
                                defaultValue="Neutral"
                            >
                                <option value="Neutral">Neutral</option>
                                <option value="Inspirerande">Inspirerande</option>
                                <option value="Poetisk">Poetisk</option>
                                <option value="Rolig">Rolig (Surf-slang)</option>
                                <option value="Faktisk">Faktisk/Teknisk</option>
                            </select>
                            <button
                                onClick={async () => {
                                    const btn = document.getElementById('ai-gen-btn');
                                    const originalText = btn.innerHTML;
                                    btn.innerHTML = `<span class="animate-spin">✨</span>`;
                                    btn.disabled = true;

                                    try {
                                        const tonality = document.getElementById('tonality-select').value;
                                        const res = await fetch('http://localhost:3001/api/generate-description', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                spotName: activeSpot.name,
                                                currentDescription: activeSpot.description,
                                                tonality: tonality
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.description) {
                                            handleChange('description', data.description);
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        btn.innerHTML = originalText;
                                        btn.disabled = false;
                                    }
                                }}
                                id="ai-gen-btn"
                                className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                            >
                                <Sparkles size={12} />
                                SV:AI Förslag
                            </button>
                        </div>
                    </div>
                    <textarea
                        rows={4}
                        value={activeSpot.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-neutral-300 font-medium text-sm focus:border-cyan-500 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Parking */}
            <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-2">Parkering</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Typ</label>
                        <select
                            value={activeSpot.parking?.type || 'Free'}
                            onChange={(e) => handleNestedChange('parking', 'type', e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm outline-none cursor-pointer"
                        >
                            <option value="Free">Gratis</option>
                            <option value="Paid">Betal</option>
                            <option value="Restricted">Förbud/Begränsad</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Avstånd</label>
                        <input
                            type="text"
                            placeholder="t.ex. 100m"
                            value={activeSpot.parking?.distance || ''}
                            onChange={(e) => handleNestedChange('parking', 'distance', e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Info</label>
                    <input
                        type="text"
                        value={activeSpot.parking?.description || ''}
                        onChange={(e) => handleNestedChange('parking', 'description', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-neutral-300 font-medium text-sm outline-none"
                    />
                </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Access Info</label>
                    <input
                        type="text"
                        value={activeSpot.access || ''}
                        onChange={(e) => handleChange('access', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-neutral-300 font-medium text-sm outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Vibe & Crowd</label>
                    <input
                        type="text"
                        value={activeSpot.vibe || ''}
                        onChange={(e) => handleChange('vibe', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-neutral-300 font-medium text-sm outline-none"
                    />
                </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
                <div className="space-y-4">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Webbkameror</label>
                    <div className="space-y-3">
                        {(() => {
                            // Normalize to array of objects
                            let cameras = [];
                            if (Array.isArray(activeSpot.webcam)) {
                                cameras = activeSpot.webcam;
                            } else if (activeSpot.webcam && typeof activeSpot.webcam === 'string' && activeSpot.webcam.length > 0) {
                                cameras = [{ name: 'Webbkamera', url: activeSpot.webcam }];
                            }

                            return cameras.map((cam, idx) => (
                                <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                                    <input
                                        type="text"
                                        placeholder="Namn (t.ex. Hamnen)"
                                        value={cam.name || ''}
                                        onChange={(e) => {
                                            const newCams = [...cameras];
                                            newCams[idx] = { ...newCams[idx], name: e.target.value };
                                            handleChange('webcam', newCams);
                                        }}
                                        className="w-1/3 bg-neutral-800 p-3 rounded-xl border border-white/5 text-white font-bold text-sm outline-none focus:border-cyan-500 transition-colors"
                                    />
                                    <input
                                        type="text"
                                        placeholder="URL"
                                        value={cam.url || (typeof cam === 'string' ? cam : '')}
                                        onChange={(e) => {
                                            const newCams = [...cameras];
                                            newCams[idx] = { ...newCams[idx], url: e.target.value };
                                            handleChange('webcam', newCams);
                                        }}
                                        className="flex-1 bg-neutral-800 p-3 rounded-xl border border-white/5 text-cyan-400 font-medium text-sm outline-none focus:border-cyan-500 transition-colors"
                                    />
                                    <button
                                        onClick={() => {
                                            const newCams = cameras.filter((_, i) => i !== idx);
                                            handleChange('webcam', newCams);
                                        }}
                                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ));
                        })()}

                        <button
                            onClick={() => {
                                let cameras = [];
                                if (Array.isArray(activeSpot.webcam)) {
                                    cameras = activeSpot.webcam;
                                } else if (activeSpot.webcam && typeof activeSpot.webcam === 'string' && activeSpot.webcam.length > 0) {
                                    cameras = [{ name: 'Webbkamera', url: activeSpot.webcam }];
                                }
                                handleChange('webcam', [...cameras, { name: '', url: '' }]);
                            }}
                            className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/50 text-neutral-500 hover:text-cyan-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus size={16} /> Lägg till Kamera
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Surfzone URL</label>
                    <input
                        type="text"
                        value={activeSpot.surfzone || ''}
                        onChange={(e) => handleChange('surfzone', e.target.value)}
                        className="w-full bg-neutral-800 p-3 rounded-xl border border-white/5 text-blue-400 font-medium text-sm outline-none"
                    />
                </div>
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD ---

const AdminDashboard = ({
    activeSpot, // Background active spot
    spots,
    allSettings, // NEW: We need ALL settings to pick the right one for editingSpot
    defaultSettings, // For fallback
    onClose,
    onAdminChange,
    onUpdateSpot,
    onCreateSpot, // NEW
    weatherData,
    currentHour
}) => {
    // Default to the active spot
    const [selectedSpotId, setSelectedSpotId] = useState(activeSpot.id);
    const [activeSection, setActiveSection] = useState('score');
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [isSpotMenuOpen, setIsSpotMenuOpen] = useState(false); // NEW: Explicit state for dropdown

    // Derive the "Spot being edited"
    const editingSpot = spots.find(s => s.id === selectedSpotId) || activeSpot;

    // Derive settings for the editing spot (fallback to defaults if missing)
    const editingSettings = allSettings?.[editingSpot.id] || defaultSettings || {};

    // Helper to wrap onAdminChange with the correct ID
    const handleSettingsChange = (key, value) => {
        onAdminChange(key, value, editingSpot.id);
    };
    const handleSave = () => {
        setIsSaving(true);
        // Simulate save delay (since state is already updated live, this is visual feedback)
        setTimeout(() => {
            setIsSaving(false);
            setHasSaved(true);
            setTimeout(() => setHasSaved(false), 2000);
        }, 800);
    };

    const handleCreateNew = async () => {
        if (!onCreateSpot) return;

        // Template for new spot
        const newSpot = {
            name: "Nytt Spot",
            lat: 59.0,
            lng: 18.0,
            region: "Region",
            description: "Beskrivning...",
            parking: { type: "Free", distance: "", description: "" },
            access: "",
            vibe: "",
            webcam: [],
            surfzone: "",
            settings: defaultSettings // Ensure settings are initialized
        };

        const created = await onCreateSpot(newSpot);
        if (created) {
            setSelectedSpotId(created.id);
            setActiveSection('spot'); // Switch to edit info
            setIsSpotMenuOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-neutral-900 w-full max-w-6xl h-[85vh] rounded-[3rem] border border-white/10 overflow-hidden flex shadow-2xl relative" onClick={e => e.stopPropagation()}>

                {/* 1. Sidebar */}
                <div className="w-20 lg:w-64 bg-black/20 border-r border-white/5 flex flex-col justify-between py-8">
                    <div className="flex flex-col gap-2 px-4">
                        <div className="pl-4 mb-6 hidden lg:block">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-1">Admin</div>
                            <div className="text-xl font-black text-white italic tracking-tighter mb-4">Dashboard</div>

                            {/* SPOT SELECTOR (CLICK-BASED) */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Redigerar:</label>
                                <div className="relative z-20">
                                    <button
                                        onClick={() => setIsSpotMenuOpen(!isSpotMenuOpen)}
                                        className={`w-full text-left px-3 py-2 rounded-xl border flex justify-between items-center transition-all ${isSpotMenuOpen ? 'bg-white/10 border-cyan-500/50' : 'bg-white/5 border-white/5 hover:border-cyan-500/50'}`}
                                    >
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${editingSpot.isActive === false ? 'text-red-400 line-through' : 'text-cyan-400'} truncate mr-2`}>
                                            {editingSpot.name}
                                        </span>
                                        <ChevronRight size={14} className={`text-neutral-500 transition-transform duration-300 ${isSpotMenuOpen ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* Dropdown */}
                                    {isSpotMenuOpen && (
                                        <>
                                            {/* Backdrop to close menu when clicking outside */}
                                            <div className="fixed inset-0 z-10" onClick={() => setIsSpotMenuOpen(false)} />

                                            <div className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                {/* Add New Button */}
                                                <button
                                                    onClick={handleCreateNew}
                                                    className="w-full text-left px-3 py-3 text-[10px] font-black uppercase tracking-wider hover:bg-white/10 border-b border-white/5 transition-colors text-cyan-400 flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> Nytt Spot
                                                </button>

                                                {spots.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => {
                                                            setSelectedSpotId(s.id);
                                                            setIsSpotMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 block border-b border-white/5 last:border-0 transition-colors ${s.id === selectedSpotId ? 'text-cyan-400 bg-white/5' : 'text-neutral-400'}`}
                                                    >
                                                        {s.name} {s.isActive === false && '(Inaktiv)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Nav Items */}
                        <button
                            onClick={() => setActiveSection('score')}
                            className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeSection === 'score' ? 'bg-cyan-500 text-black' : 'hover:bg-white/5 text-neutral-500'}`}
                        >
                            <Activity size={24} className="min-w-[24px]" />
                            <span className="hidden lg:block font-bold uppercase tracking-wider text-xs">Score Regler</span>
                            {activeSection === 'score' && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
                        </button>

                        <button
                            onClick={() => setActiveSection('sensors')}
                            className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeSection === 'sensors' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5 text-neutral-500'}`}
                        >
                            <Zap size={24} className="min-w-[24px]" />
                            <span className="hidden lg:block font-bold uppercase tracking-wider text-xs">Sensorer</span>
                            {activeSection === 'sensors' && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
                        </button>

                        <button
                            onClick={() => setActiveSection('spot')}
                            className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeSection === 'spot' ? 'bg-purple-500 text-black' : 'hover:bg-white/5 text-neutral-500'}`}
                        >
                            <MapPin size={24} className="min-w-[24px]" />
                            <span className="hidden lg:block font-bold uppercase tracking-wider text-xs">Om Spotet</span>
                            {activeSection === 'spot' && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
                        </button>
                    </div>

                    <div className="px-4 flex flex-col gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || hasSaved}
                            className={`w-full p-4 rounded-2xl transition-all flex items-center justify-center lg:justify-start gap-4 shadow-lg group ${hasSaved
                                ? 'bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-500'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                                }`}
                        >
                            {isSaving ? (
                                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : hasSaved ? (
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <span className="text-xl">✓</span>
                                </div>
                            ) : (
                                <Save size={24} className="transition-transform group-hover:scale-110" />
                            )}

                            <span className="hidden lg:block font-black uppercase tracking-wider text-xs">
                                {isSaving ? 'Sparar...' : hasSaved ? 'Sparat!' : 'Spara'}
                            </span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center justify-center lg:justify-start gap-4"
                        >
                            <X size={24} />
                            <span className="hidden lg:block font-bold uppercase tracking-wider text-xs">Stäng</span>
                        </button>
                    </div>
                </div>

                {/* 2. Content Area */}
                <div className="flex-1 p-6 lg:p-10 overflow-hidden relative">

                    {/* GLOBAL TOP RIGHT ACTION - Toggle Active */}
                    <div className="absolute top-4 right-[54px] lg:top-5 lg:right-[70px] z-50">
                        <button
                            onClick={() => onUpdateSpot(editingSpot.id, { isActive: editingSpot.isActive === false ? true : false })}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-xl backdrop-blur-md transform -translate-y-[10px] translate-x-[20px] ${editingSpot.isActive !== false
                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/50 hover:bg-red-500/20'}`}
                        >
                            {editingSpot.isActive !== false ? '• Aktiv' : '• Inaktiv'}
                        </button>
                    </div>

                    {activeSection === 'score' && (
                        <ScoreConfigurator
                            currentSettings={editingSettings}
                            onAdminChange={handleSettingsChange}
                            weatherData={weatherData} // Note: This is still for ACTIVE Spot (bg). Preview might look weird if editing different spot.
                            currentHour={currentHour}
                        />
                    )}
                    {activeSection === 'sensors' && (
                        <SensorSettings
                            currentSettings={editingSettings}
                            onAdminChange={handleSettingsChange}
                            activeSpot={editingSpot}
                        />
                    )}
                    {activeSection === 'spot' && (
                        <SpotEditor
                            activeSpot={editingSpot}
                            onUpdateSpot={onUpdateSpot}
                        />
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
