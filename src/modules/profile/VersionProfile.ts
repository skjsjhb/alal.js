/**
 * Effective profile after synthesized the profile chain.
 *
 * Game profiles have inheritance relationships. Profiles are manipulated as `any` during
 * the load, check and synthesize step using the profile tools. The tools finally produce
 * this 'effective' profile.
 *
 * This interface is created based on Minecraft 1.20.2.
 */
export interface VersionProfile {
    arguments: {
        game: Argument[];
        jvm: Argument[];
    };
    assetIndex: Artifact & {
        id: string;
        totalSize: number;
    };
    assets: string;
    complianceLevel: number;
    downloads: {
        client: Artifact;
        client_mappings: Artifact;
        server: Artifact;
        server_mappings: Artifact;
    };
    id: string; // Profile ID.
    origin?: string; // Original ID for profile isolation
    javaVersion: JVMComponent;
    libraries: Library[];
    logging: {
        client: {
            argument: string;
            file: Artifact & {
                id: string;
            };
            type: string;
        };
    };
    mainClass: string;
    minimumLauncherVersion: number;
    releaseTime: string;
    time: string;
    type: ProfileReleaseType;
}

export interface AssetIndex {
    map_to_resources?: boolean;
    objects: Record<string, { hash: string; size: number }>;
}

export type ProfileReleaseType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha';

export interface ProfileRule {
    action: 'allow' | 'disallow';
    features?: {
        [key: string]: boolean;
    };
    os?: {
        name?: string;
        version?: string;
        arch?: string;
    };
}

export type Argument =
    | string
    | {
          rules: ProfileRule[];
          value: string | string[];
      };

export interface Library {
    downloads: {
        artifact: DownloadArtifact;
    };
    name: string;
    rules?: ProfileRule[];
}

export interface JVMComponent {
    component: string;
    majorVersion: number;
}

export interface Artifact {
    sha1: string;
    size: number;
    url: string;
}

export type DownloadArtifact = Artifact & {
    path: string;
};
