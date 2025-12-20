import React, { useState } from 'react';
import {
    Activity,
    ChevronDown,
    Info,
    Car,
    Footprints,
    Users,
    Camera,
    Globe,
    Cloud,
    Sparkles,
    ExternalLink
} from 'lucide-react';

const SurfzoneTab = ({ spot, activeActivity }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    React.useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // We now just ask for the spot, backend returns ALL sports
                const res = await fetch('http://localhost:3001/api/surfzone-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        spotName: spot.name
                    })
                });
                const json = await res.json();
                if (mounted) setData(json);
            } catch (e) {
                console.error(e);
                if (mounted) setData({ found: false, sports: {} });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [spot.name]); // Only refetch if spot changes. Activity change is just client-side filtering now!

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 max-w-xl">
                <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-white/5" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-1/3" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                </div>
                <div className="h-20 bg-white/5 rounded-3xl" />
            </div>
        );
    }

    // Extract data for current activity or fallback to generic 'surf'
    const sportData = data?.sports?.[activeActivity] || data?.sports?.['surf'] || data?.sports?.['kitesurf'] || null;

    if (!data || !sportData) {
        return (
            <div className="p-6 text-center text-neutral-500 italic text-sm bg-white/5 rounded-3xl border border-white/5 max-w-xl">
                Inga specifika diskussioner hittades för {activeActivity}.
                {spot.surfzone && (
                    <button onClick={() => window.open(spot.surfzone, '_blank')} className="block mt-4 text-cyan-400 font-bold mx-auto hover:underline">
                        Öppna Surfzone manuellt
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2">

            {/* AI Summary - Conditions */}
            {sportData.summary_cond && (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 rounded-3xl border border-indigo-500/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">SV:AI Förhållanden</span>
                    </div>
                    <p className="text-sm text-indigo-100/80 italic leading-relaxed">
                        "{sportData.summary_cond}"
                    </p>
                </div>
            )}

            {/* AI Summary - Vibe */}
            {sportData.summary_vibe && (
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-neutral-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">SV:AI Vibe</span>
                    </div>
                    <p className="text-sm text-neutral-300 italic leading-relaxed">
                        "{sportData.summary_vibe}"
                    </p>
                </div>
            )}

            {/* Threads */}
            {sportData.threads && sportData.threads.length > 0 && (
                <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-2">Relevanta Trådar ({activeActivity})</span>
                    {sportData.threads.map((thread, i) => (
                        <a
                            key={i}
                            href={thread.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h5 className="text-sm font-bold text-neutral-200 group-hover:text-cyan-400 transition-colors mb-1">{thread.title}</h5>
                                    {/* <p className="text-[11px] text-neutral-500 line-clamp-2">{thread.snippet}</p> */}
                                </div>
                                <ExternalLink size={14} className="text-neutral-600 group-hover:text-white transition-colors mt-1" />
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {/* Fallback / General Link */}
            {spot.surfzone && (
                <button
                    onClick={() => window.open(spot.surfzone, '_blank')}
                    className="w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 text-neutral-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                    <Globe size={14} />
                    Besök Surfzone.se
                </button>
            )}
        </div>
    );
};

const SpotInfoCard = ({ spot, activeActivity }) => {
    const [activeTab, setActiveTab] = useState('desc');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Tab definitions
    const TABS = [
        { id: 'desc', label: 'Om', icon: Info },
        { id: 'parking', label: 'Parkering', icon: Car },
        { id: 'access', label: 'Access', icon: Footprints },
        { id: 'vibe', label: 'Vibe', icon: Users },
        { id: 'webcam', label: 'Webcam', icon: Camera },
        { id: 'surfzone', label: 'Surfzone', icon: Globe },
    ];

    return (
        <div className="mb-12">
            <div className={`bg-neutral-900 rounded-[2.5rem] border border-neutral-800/50 flex flex-col relative overflow-hidden group shadow-2xl transition-all duration-500 ${isCollapsed ? 'min-h-[80px]' : 'min-h-[320px]'}`}>

                {/* Header / Collapse Toggle */}
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-6 lg:p-8 flex justify-between items-center cursor-pointer hover:bg-neutral-800/30 transition-colors z-20 relative select-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-500">
                            <Activity size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-neutral-200 transition-colors">Spot Info</span>
                    </div>
                    <ChevronDown size={20} className={`text-neutral-500 transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`} />
                </div>

                {/* Content Area */}
                <div className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>

                    {/* Tab Navigation */}
                    <div className="px-6 lg:px-8 flex gap-2 overflow-x-auto pb-6 custom-scrollbar no-scrollbar">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab.id
                                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105'
                                    : 'bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10 hover:text-neutral-300'
                                    }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="px-6 lg:px-8 pb-8 relative">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[150px]">

                            {/* 1. Description */}
                            {activeTab === 'desc' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-neutral-300 font-medium italic leading-relaxed max-w-2xl">
                                        "{spot.description || "Ingen beskrivning tillgänglig."}"
                                    </p>
                                    <div className="flex gap-4 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Region</span>
                                            <span className="text-xs text-neutral-400 font-bold">{spot.region}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Koordinater</span>
                                            <span className="text-xs text-neutral-400 font-bold tabular-nums">{spot.lat.toFixed(2)}, {spot.lng.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Parking */}
                            {activeTab === 'parking' && (
                                <div className="space-y-6 max-w-xl">
                                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
                                        <Car size={24} className="text-neutral-500 mt-1" />
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${spot.parking?.type === 'Free' ? 'bg-emerald-500/20 text-emerald-400' : (spot.parking?.type === 'Paid' ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400')}`}>
                                                    {spot.parking?.type === 'Free' ? 'Gratis' : (spot.parking?.type === 'Paid' ? 'Betal' : 'Okänd')}
                                                </span>
                                                <span className="text-xs text-neutral-400 font-bold flex items-center gap-1">
                                                    <Footprints size={12} /> {spot.parking?.distance || "-"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-300 italic leading-relaxed">
                                                {spot.parking?.description || "Ingen information om parkering."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Access */}
                            {activeTab === 'access' && (
                                <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 max-w-xl">
                                    <Footprints size={24} className="text-neutral-500 mt-1" />
                                    <div>
                                        <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] block mb-2">Access & Launch</span>
                                        <p className="text-sm text-neutral-300 italic leading-relaxed">
                                            {spot.access || "Ingen information tillgänglig."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 4. Vibe */}
                            {activeTab === 'vibe' && (
                                <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 max-w-xl">
                                    <Users size={24} className="text-neutral-500 mt-1" />
                                    <div>
                                        <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] block mb-2">Vibe & Crowd</span>
                                        <p className="text-sm text-neutral-300 italic leading-relaxed">
                                            {spot.vibe || "Ingen information tillgänglig."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 5. Webcam */}
                            {activeTab === 'webcam' && (
                                <div className="space-y-4 max-w-xl">
                                    {(() => {
                                        // Normalize input to array of objects
                                        let cameras = [];
                                        if (Array.isArray(spot.webcam)) {
                                            cameras = spot.webcam;
                                        } else if (spot.webcam && typeof spot.webcam === 'string' && spot.webcam.length > 0) {
                                            cameras = [{ name: 'Webbkamera', url: spot.webcam }];
                                        }

                                        if (cameras.length > 0) {
                                            return cameras.map((cam, idx) => (
                                                <div key={idx} className="p-4 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => window.open(cam.url || cam, '_blank')}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                                                            <Camera size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-white block">{cam.name || 'Öppna Webbkamera'}</span>
                                                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{cam.url ? new URL(cam.url).hostname : (typeof cam === 'string' ? new URL(cam).hostname : '')}</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                                                </div>
                                            ));
                                        } else {
                                            return (
                                                <div className="p-6 text-center text-neutral-500 italic text-sm bg-white/5 rounded-3xl border border-white/5">
                                                    Ingen webbkamera kopplad till detta spot.
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            )}

                            {/* 6. Surfzone (AI Enhanced) */}
                            {activeTab === 'surfzone' && (
                                <SurfzoneTab spot={spot} activeActivity={activeActivity} />
                            )}

                        </div>
                    </div>

                    {/* Decorative BG Icon */}
                    <div className="absolute -bottom-10 -right-10 opacity-[0.02] text-cyan-500 pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.04]">
                        {activeTab === 'webcam' ? <Camera size={240} /> :
                            activeTab === 'parking' ? <Car size={240} /> :
                                activeTab === 'vibe' ? <Users size={240} /> :
                                    <Activity size={240} />}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SpotInfoCard;
