import Keyring from '@/constra/keyring.json';
import Strategies from '@/constra/strategies.json';
import { Account } from '@/modules/auth/Account';
import { Container } from '@/modules/container/Container';
import { opt } from '@/modules/data/Options';
import { getProfileEffectiveLibraries, hasLogConfig, isLegacyAssetName } from '@/modules/profile/ProfileTools';
import { resolveRules } from '@/modules/profile/Rules';
import { Argument, AssetIndex, VersionProfile } from '@/modules/profile/VersionProfile';
import path from 'path';
import pkg from '../../../package.json';

const mainClassAlias = 'main_class';
const logConfigAlias = 'log_config_path';

/**
 * Create arguments for launching. This method automatically handles content sharing and paths locating.
 *
 * To make this method synced, asset index profile is left as a parameter.
 * // TODO profile isolation
 */
export function synthesizeArguments(ct: Container, prof: VersionProfile, ai: AssetIndex, account: Account): string[] {
    const baseArgs = createArguments(prof, []); // TODO generate user features
    const variables: Record<string, string> = {};
    const assetsRoot = createRuntimeAssetPath(ct, prof, ai);

    // Files and IDs
    variables['classpath'] = createClasspath(ct, prof);
    variables['game_assets'] = variables['assets_root'] = assetsRoot;
    variables['assets_index_name'] = prof.assetIndex.id;
    variables['user_properties'] = '[]'; // 1.7.x twitch compatibility
    variables['clientid'] = Keyring.uuid.client;
    variables['version_name'] = prof.id;
    variables['game_directory'] = ct.getRuntimeRoot(prof.origin || prof.id);
    variables['user_type'] = 'mojang';
    variables['version_type'] = opt().launch.showLauncherName ? 'alal.js' : prof.type;
    variables['natives_directory'] = ct.getNativesDirectory(prof.id);
    variables['launcher_name'] = pkg.name;
    variables['launcher_version'] = pkg.version;

    // Account
    variables['auth_player_name'] = account.playerName;
    variables['auth_access_token'] = variables['auth_session'] = account.accessToken;
    variables['auth_uuid'] = account.uuid;
    variables['auth_xuid'] = account.xuid;

    // Forge specific
    variables['classpath_separator'] = path.sep;
    variables['library_directory'] = ct.getLibraryPath('.');

    // Custom aliases & caveats
    if (hasLogConfig(prof)) {
        variables[logConfigAlias] = ct.getLogConfigPath(prof.logging.client.file.id);
    }
    variables[mainClassAlias] = prof.mainClass;
    return replaceTemplates(baseArgs, variables);
}

// Filter arguments
// Here is a caveat: instead of returning two parts of arguments, we use template ${main_class} as
// the placeholder.
function createArguments(prof: VersionProfile, features?: string[]): string[] {
    const filterFun = (a: Argument) => {
        if (typeof a == 'string') {
            return true;
        } else {
            return resolveRules(a.rules, features);
        }
    };
    const game = prof.arguments.game.filter(filterFun);
    const vm = prof.arguments.jvm.filter(filterFun);

    // Add custom args by launcher
    vm.push(...Strategies.launch.vmArgsAddon);

    // Logging
    if (hasLogConfig(prof)) {
        const logArg = prof.logging.client.argument.replaceAll('${path}', getTemplatePlaceHolder(logConfigAlias));
        vm.push(logArg);
    }

    const out: string[] = [];
    const mapFun = (a: Argument) => {
        if (typeof a == 'string') {
            out.push(a);
        } else {
            if (typeof a.value == 'string') {
                out.push(a.value);
            } else {
                out.push(...a.value);
            }
        }
    };
    vm.forEach(mapFun);
    out.push(getTemplatePlaceHolder(mainClassAlias));
    game.forEach(mapFun);
    return out;
}

function getTemplatePlaceHolder(id: string): string {
    return '${' + id + '}';
}

function replaceTemplates(args: string[], variables: Record<string, string>): string[] {
    return args.map((arg) => {
        for (const [k, v] of Object.entries(variables)) {
            arg = arg.replaceAll('${' + k + '}', v);
        }
        return arg;
    });
}

// This method does not access the filesystem.
function createClasspath(ct: Container, prof: VersionProfile): string {
    // Libraries
    const cps = getProfileEffectiveLibraries(prof).map((lib) => {
        return ct.getLibraryPath(lib.downloads.artifact.path);
    });

    // Client
    cps.push(ct.getClientPath(prof.id));
    return cps.join(path.delimiter);
}

// Get assets directory based on profile and asset index.
function createRuntimeAssetPath(ct: Container, prof: VersionProfile, ai: AssetIndex): string {
    const aiid = prof.assetIndex.id;
    if (!isLegacyAssetName(aiid)) {
        return path.join(ct.rootDir, 'assets');
    } else {
        if (ai.map_to_resources) {
            return path.join(ct.rootDir, 'resources');
        } else {
            return path.join(ct.rootDir, 'assets', 'virtual', 'legacy');
        }
    }
}
