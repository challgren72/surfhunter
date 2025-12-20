
export const calculateSurfScore = (conditions, rules) => {
    const { wave, period, wind, windDir, waveDir } = conditions;

    // Default to 0 if data is missing
    if (wave === undefined || wave === null) return 0;

    // Normalize Directions
    const windSector = Math.round((windDir || 0) / 45) * 45 % 360;
    const waveSector = Math.round((waveDir || 0) / 45) * 45 % 360;

    // Check rules from highest score (5) down to lowest (1)
    for (let s = 5; s >= 1; s--) {
        const rule = rules[s];
        if (!rule) continue;

        const waveMatch = wave >= rule.waveMin && wave <= rule.waveMax;
        // Default periodMin to 0 and periodMax to 25 if not strict rules
        const periodMatch = period >= (rule.periodMin || 0) && period <= (rule.periodMax || 25);
        const windMatch = wind >= rule.windMin && wind <= rule.windMax;

        // Check directions if defined in rule
        const windDirMatch = rule.windDirs ? rule.windDirs.includes(windSector) : true;
        const waveDirMatch = rule.waveDirs ? rule.waveDirs.includes(waveSector) : true;

        if (waveMatch && periodMatch && windMatch && windDirMatch && waveDirMatch) {
            return s;
        }
    }

    return 0;
};
