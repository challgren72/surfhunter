import React, { useState, useEffect } from 'react';
import { Wind, Waves, Thermometer } from 'lucide-react';

const DirectionArrow = ({ deg, size = 24, className = "" }) => (
    <div
        className={`inline-flex items-center justify-center transition-transform duration-700 ease-out ${className}`}
        style={{ transform: `rotate(${deg}deg)` }}
    >
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
        </svg>
    </div>
);

const getCardinal = (deg) => {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SV', 'V', 'NV'];
    return directions[Math.round(deg / 45) % 8];
};

const ObservationCard = ({ stations = {}, stationNames = {}, onDataLoad }) => {
    const [data, setData] = useState({
        temp: null,
        windSpeed: null,
        windDir: null,
        windGust: null,
        waveHeight: null,
        waterTemp: null,
        waveDir: null,
        wavePeriod: null,
        timestamp: null,
        secondary: { wind: null, wave: null }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Defaults
    const WIND_STATION_ID = stations.wind || '87440'; // Landsort A
    const WAVE_STATION_ID = stations.wave || '33008'; // Knolls Grund
    const WIND_SEC_ID = stations.windSecondary;
    const WAVE_SEC_ID = stations.waveSecondary;

    const fetchSMHIData = async () => {
        try {
            setLoading(true);

            // Helper for Proxy URLs
            const getProxyUrl = (type, param, station) =>
                `${import.meta.env.VITE_API_BASE_URL}/api/smhi/${type}/parameter/${param}/station/${station}/period/latest-day`;

            // 1. Fetch Air Temp & Wind from MetObs Station
            const tempRes = await fetch(getProxyUrl('metobs', 1, WIND_STATION_ID));
            const windRes = await fetch(getProxyUrl('metobs', 25, WIND_STATION_ID));
            const windDirRes = await fetch(getProxyUrl('metobs', 3, WIND_STATION_ID));
            const windGustRes = await fetch(getProxyUrl('metobs', 21, WIND_STATION_ID));

            // 2. Fetch Wave Height (Param 1), Water Temp (Param 5) & Wave Direction (Param 8), Wave Period (Param 9) from OcObs Station
            const waveRes = await fetch(getProxyUrl('ocobs', 1, WAVE_STATION_ID));
            const waterTempRes = await fetch(getProxyUrl('ocobs', 5, WAVE_STATION_ID));
            const waveDirRes = await fetch(getProxyUrl('ocobs', 8, WAVE_STATION_ID));
            const wavePeriodRes = await fetch(getProxyUrl('ocobs', 9, WAVE_STATION_ID));

            // Secondary Fetches
            let secWindRes, secWindDirRes, secWaveRes, secWaveDirRes;

            // Helper to silently fetch, returning null on error/404
            const silentFetch = async (url) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    return res;
                } catch (e) {
                    return null;
                }
            };

            if (WIND_SEC_ID) {
                secWindRes = await silentFetch(getProxyUrl('metobs', 25, WIND_SEC_ID));
                secWindDirRes = await silentFetch(getProxyUrl('metobs', 3, WIND_SEC_ID));
            }
            if (WAVE_SEC_ID) {
                secWaveRes = await silentFetch(getProxyUrl('ocobs', 1, WAVE_SEC_ID));
                secWaveDirRes = await silentFetch(getProxyUrl('ocobs', 8, WAVE_SEC_ID));
            }

            const tempData = await tempRes.ok ? await tempRes.json() : {};
            const windData = await windRes.ok ? await windRes.json() : {};
            const windDirData = await windDirRes.ok ? await windDirRes.json() : {};
            const windGustData = await windGustRes.ok ? await windGustRes.json() : {};
            const waveData = await waveRes.ok ? await waveRes.json() : {};
            const waterTempData = await waterTempRes.ok ? await waterTempRes.json() : {};
            const waveDirData = await waveDirRes.ok ? await waveDirRes.json() : {};
            const wavePeriodData = await wavePeriodRes.ok ? await wavePeriodRes.json() : {};

            // Process Secondary
            // Process Secondary (Handle potentially null responses)
            const secWindData = (WIND_SEC_ID && secWindRes?.ok) ? await secWindRes.json() : {};
            const secWindDirData = (WIND_SEC_ID && secWindDirRes?.ok) ? await secWindDirRes.json() : {};
            const secWaveData = (WAVE_SEC_ID && secWaveRes?.ok) ? await secWaveRes.json() : {};
            const secWaveDirData = (WAVE_SEC_ID && secWaveDirRes?.ok) ? await secWaveDirRes.json() : {};

            // Extract values (safely) - Get the LAST item in the value array (most recent)
            const getLatest = (json) => {
                if (!json?.value || json.value.length === 0) return null;
                return json.value[json.value.length - 1].value;
            };
            const getLatestTime = (json) => {
                if (!json?.value || json.value.length === 0) return null;
                return json.value[json.value.length - 1].date;
            };

            const newData = {
                temp: getLatest(tempData),
                windSpeed: getLatest(windData),
                windDir: getLatest(windDirData),
                windGust: getLatest(windGustData),
                waveHeight: getLatest(waveData),
                waterTemp: getLatest(waterTempData),
                waveDir: getLatest(waveDirData),
                wavePeriod: getLatest(wavePeriodData),
                timestamp: getLatestTime(windData) || Date.now(),
                secondary: {
                    wind: WIND_SEC_ID ? { speed: getLatest(secWindData), dir: getLatest(secWindDirData) } : null,
                    wave: WAVE_SEC_ID ? { height: getLatest(secWaveData), dir: getLatest(secWaveDirData) } : null
                }
            };

            setData(newData);
            if (onDataLoad) onDataLoad(newData);
            setError(null);
        } catch (err) {
            console.error("SMHI Fetch Error:", err);
            setError("Kunde inte hämta data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSMHIData();
        const interval = setInterval(fetchSMHIData, 60000 * 15); // Refresh every 15 min
        return () => clearInterval(interval);
    }, [WIND_STATION_ID, WAVE_STATION_ID, WIND_SEC_ID, WAVE_SEC_ID]);

    if (error) return (
        <div className="bg-neutral-900 p-5 lg:p-6 rounded-3xl border border-red-900/30 flex items-center justify-center h-full min-h-[160px]">
            <div className="text-red-500/50 text-[10px] uppercase font-black tracking-widest">SMHI Offline</div>
        </div>
    );

    const renderCard = (isSecondary = false) => {
        const currentData = isSecondary ? data.secondary : { wind: { speed: data.windSpeed, dir: data.windDir, gust: data.windGust }, wave: { height: data.waveHeight, dir: data.waveDir, period: data.wavePeriod }, temp: data.temp, waterTemp: data.waterTemp };
        const currentNames = isSecondary ? { wind: stationNames.windSecondary, wave: stationNames.waveSecondary } : stationNames;

        if (isSecondary && (!currentData.wind && !currentData.wave)) return null;

        return (
            <div className={`bg-neutral-900 p-4 lg:p-5 rounded-3xl border border-neutral-800/50 flex flex-col justify-between hover:bg-neutral-800/60 transition-all group shadow-xl relative overflow-hidden ${isSecondary ? 'min-h-[90px]' : 'h-full min-h-[130px]'}`}>

                {/* Live Indicator (Primary Only) */}
                {!isSecondary && (
                    <div className="absolute top-0 right-0 p-4 flex gap-2 items-center z-10">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500/90 shadow-black drop-shadow-md">Live</span>
                    </div>
                )}

                <div className="grid grid-cols-2 h-full relative">
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/5 -translate-x-1/2 hidden md:block"></div>

                    {/* Wind Section */}
                    <div className="flex flex-col justify-between py-1 pr-4 border-r border-white/5 md:border-none">
                        <div className="flex items-center gap-3">
                            <Wind size={isSecondary ? 16 : 20} className="text-blue-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400 truncate opacity-80" title={currentNames.wind}>
                                {currentNames.wind || 'Unknown'}
                            </span>
                        </div>

                        {currentData.wind ? (
                            <div>
                                {isSecondary ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">{currentData.wind.speed || '-'}</span>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest translate-y-[-2px]">m/s</span>
                                        </div>
                                        {(currentData.wind.dir !== null && currentData.wind.dir !== undefined) && (
                                            <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5">
                                                <DirectionArrow deg={currentData.wind.dir} size={12} className="text-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-300 tracking-wider">
                                                    {Math.round(currentData.wind.dir)}°
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">{currentData.wind.speed || '-'}</span>
                                            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest translate-y-[-4px]">m/s</span>
                                            {currentData.wind.gust && (
                                                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-wider ml-1 translate-y-[-6px]">(By: <span className="text-neutral-400">{currentData.wind.gust}</span>)</span>
                                            )}
                                        </div>
                                        {(currentData.wind.dir !== null && currentData.wind.dir !== undefined) && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <DirectionArrow deg={currentData.wind.dir + 180} size={16} className="text-cyan-400" />
                                                <span className="text-xs font-black text-neutral-500 tracking-widest">
                                                    {Math.round(currentData.wind.dir)}° <span className="text-neutral-600 ml-0.5">{getCardinal(currentData.wind.dir)}</span>
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : <div className="text-xs text-neutral-600 font-bold italic mt-2">Ingen data</div>}

                        {!isSecondary && (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <Thermometer size={12} className="text-orange-400" />
                                </div>
                                <span className="text-xl font-black text-white tracking-tight">{currentData.temp || '-'}°C</span>
                            </div>
                        )}
                    </div>

                    {/* Wave Section */}
                    <div className="flex flex-col justify-between py-1 pl-4">
                        <div className="flex items-center gap-3">
                            <Waves size={isSecondary ? 16 : 20} className="text-cyan-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400 truncate opacity-80" title={currentNames.wave}>
                                {currentNames.wave || 'Unknown'}
                            </span>
                        </div>

                        {currentData.wave ? (
                            <div>
                                {isSecondary ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">{currentData.wave.height || '-'}</span>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest translate-y-[-2px]">m</span>
                                        </div>
                                        {(currentData.wave.dir !== null && currentData.wave.dir !== undefined) && (
                                            <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5">
                                                <DirectionArrow deg={currentData.wave.dir} size={12} className="text-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-300 tracking-wider">
                                                    {Math.round(currentData.wave.dir)}°
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">{currentData.wave.height || '-'}</span>
                                            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest translate-y-[-4px]">m</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            {(currentData.wave.dir !== null && currentData.wave.dir !== undefined) && (
                                                <div className="flex items-center gap-2">
                                                    <DirectionArrow deg={currentData.wave.dir + 180} size={16} className="text-cyan-400" />
                                                    <span className="text-xs font-black text-neutral-500 tracking-widest">
                                                        {Math.round(currentData.wave.dir)}° <span className="text-neutral-600 ml-0.5">{getCardinal(currentData.wave.dir)}</span>
                                                    </span>
                                                </div>
                                            )}
                                            {currentData.wave.period && (
                                                <span className="text-xs font-black text-neutral-500 tracking-widest">{currentData.wave.period}s</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : <div className="text-xs text-neutral-600 font-bold italic mt-2">Ingen data</div>}

                        {!isSecondary && (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <Thermometer size={12} className="text-cyan-400" />
                                </div>
                                <span className="text-xl font-black text-white tracking-tight">{currentData.waterTemp || '-'}°C</span>
                                <span className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] opacity-60">ytskikt</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            {renderCard(false)}
            {(data.secondary?.wind || data.secondary?.wave) && renderCard(true)}
        </div>
    );
};

export default ObservationCard;
