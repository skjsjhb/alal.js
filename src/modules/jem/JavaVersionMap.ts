import JreMap from '@/constra/jre-map.json';

export module JavaVersionMap {
    const versionMatrix = JreMap as Record<string, string>;

    /**
     * Gets the specified jre component for the specified profile.
     *
     * Note: This method only supports Mojang profiles. Consider using the jre which the profile specified first.
     * @param id Profile ID.
     */
    export function getJavaComponent(id: string): string {
        return versionMatrix[id] || 'jre-legacy';
    }
}