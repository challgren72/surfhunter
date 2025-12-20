import React from 'react';
import { Sparkles, Calendar, Zap, Wind, Waves, Activity } from 'lucide-react';
import { calculateSurfScore } from '../utils/score';

const AISummaryModal = ({ activeSpot, weatherData, currentRules, onClose }) => {
    const [analysis, setAnalysis] = React.useState({ text: "Laddar SV:AI analys...", trend: "stable", maxScore: 0 });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [mode, setMode] = React.useState('relaxed'); // 'relaxed' | 'deep'

    React.useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true); // Reset loading state on mode change

            if (!weatherData) {
                setAnalysis({ text: "Ingen data tillgänglig för analys.", trend: "stable", maxScore: 0 });
                setLoading(false);
                return;
            }

            // Calculate Max Score (heuristic still useful for the badge)
            const now = new Date();
            const hour = now.getHours();
            const marine = weatherData.marine?.hourly;
            const weather = weatherData.weather?.hourly;

            let maxScore = 0;
            // ... (keep maxScore calc logic same) ...
            if (!marine || !weather) {
                setAnalysis({ text: "Väderdata saknas.", trend: "stable", maxScore: 0 });
                setLoading(false);
                return;
            }

            // Scan next 72 hours for max score
            for (let i = 0; i < 72; i++) {
                const idx = hour + i;
                if (!marine.wave_height[idx]) break;

                const score = calculateSurfScore({
                    wave: marine.wave_height[idx],
                    period: marine.wave_period[idx],
                    wind: weather.wind_speed_10m[idx],
                    windDir: weather.wind_direction_10m[idx],
                    waveDir: marine.wave_direction[idx]
                }, currentRules);

                if (score > maxScore) {
                    maxScore = score;
                }
            }


            try {
                // Prepare data for backend
                // Limiting data to save tokens (just sending next 24h + current)
                const payload = {
                    spotName: activeSpot.name,
                    userRules: currentRules,
                    mode: mode, // SEND MODE
                    currentData: {
                        wave: marine.wave_height[hour],
                        period: marine.wave_period[hour],
                        wind: weather.wind_speed_10m[hour],
                        windDir: weather.wind_direction_10m[hour]
                    },
                    forecastData: {
                        summary: "Next 3 days max score: " + maxScore
                    }
                };

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.error) throw new Error(data.error);

                setAnalysis({
                    text: data.analysis,
                    trend: maxScore > 0 ? "up" : "stable",
                    maxScore: maxScore
                });
            } catch (err) {
                console.error(err);
                setError("Kunde inte hämta AI analys. Kontrollera servern.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [activeSpot, weatherData, currentRules, mode]); // Add mode dependency

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div onClick={(e) => e.stopPropagation()} className="bg-neutral-900 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
                    <div className="bg-neutral-900 rounded-t-[22px] p-6 pb-4 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Sparkles size={20} className="text-purple-400 animate-pulse" />
                                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 font-black uppercase tracking-wider text-sm">
                                    SV:AI Surf Analysis
                                </h3>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{activeSpot.name}</h2>
                        </div>

                        {/* MODE TOGGLE */}
                        <div className="flex bg-neutral-800 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setMode('relaxed')}
                                className={`px-3 py-1 rounded-md text-[10px] uppercase font-black tracking-wider transition-all ${mode === 'relaxed' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                Chill
                            </button>
                            <button
                                onClick={() => setMode('deep')}
                                className={`px-3 py-1 rounded-md text-[10px] uppercase font-black tracking-wider transition-all ${mode === 'deep' ? 'bg-indigo-500 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                Deep
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-4 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest animate-pulse">Consulting SV:AI...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="prose prose-invert prose-sm">
                                <p className="text-neutral-300 leading-relaxed whitespace-pre-line font-medium text-base">
                                    {analysis.text}
                                </p>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Trend</span>
                                    {analysis.trend === 'up' ?
                                        <span className="text-emerald-400 font-black flex items-center gap-1"><Activity size={16} /> Ökande</span> :
                                        analysis.trend === 'down' ?
                                            <span className="text-rose-400 font-black flex items-center gap-1"><Activity size={16} /> Minskande</span> :
                                            <span className="text-blue-400 font-black flex items-center gap-1"><Activity size={16} /> Stabil</span>
                                    }
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Max Score (3 dygn)</span>
                                    <span className="text-white font-black text-xl">{analysis.maxScore}/5</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                        Stäng Analys
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AISummaryModal;
