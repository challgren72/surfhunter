import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { METOBS_STATIONS, OCOBS_STATIONS } from '../data/smhi-stations';

const StationSelect = ({ label, stations, value, onChange }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = stations.filter(s => s.name.toLowerCase().startsWith(search.toLowerCase()));
    const selectedStation = stations.find(s => s.id == value);

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
                    <Search size={14} className="text-neutral-500" />
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
            {selectedStation && (
                <div className="text-[9px] text-neutral-600 font-mono tracking-tight flex gap-3">
                    <span>ID: {selectedStation.id}</span>
                    <span>LAT: {selectedStation.lat}</span>
                    <span>LON: {selectedStation.lng}</span>
                </div>
            )}
        </div>
    );
};

const SensorConfigModal = ({ activeSpot, currentSettings, onClose, onAdminChange }) => {
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in">
            <div className="bg-neutral-900 w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden flex flex-col animate-slide-up shadow-2xl max-h-[90vh]">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-neutral-900/50">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-emerald-500">Sensor Config</h3>
                        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">{activeSpot.name}</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mb-6">
                        <p className="text-xs text-emerald-400 font-bold leading-relaxed">
                            Koppla primära och sekundära mätstationer till {activeSpot.name}. Sekundära stationer visas som referens i observation-korten.
                        </p>
                    </div>

                    {/* Wind Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">Vind (MetObs)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StationSelect
                                label="Primär Vindstation"
                                stations={METOBS_STATIONS}
                                value={currentSettings.observationStations?.wind || ''}
                                onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, wind: id })}
                            />
                            <StationSelect
                                label="Sekundär Vindstation"
                                stations={METOBS_STATIONS}
                                value={currentSettings.observationStations?.windSecondary || ''}
                                onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, windSecondary: id })}
                            />
                        </div>
                    </div>

                    {/* Wave Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">Vågor (OcObs)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StationSelect
                                label="Primär Vågstation"
                                stations={OCOBS_STATIONS}
                                value={currentSettings.observationStations?.wave || ''}
                                onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, wave: id })}
                            />
                            <StationSelect
                                label="Sekundär Vågstation"
                                stations={OCOBS_STATIONS}
                                value={currentSettings.observationStations?.waveSecondary || ''}
                                onChange={(id) => onAdminChange('observationStations', { ...currentSettings.observationStations, waveSecondary: id })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-black/40 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    >
                        Spara Sensorer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SensorConfigModal;
