import { waitForEvent } from '@/modules/util/Promises';
import { XMLParser } from 'fast-xml-parser';
import { customAlphabet } from 'nanoid';
import { ChildProcess, spawn } from 'node:child_process';
import { TypedEmitter } from 'tiny-typed-emitter';

export interface GameInstanceEvents {
    /**
     * Triggered when the process exits. Return code is forwarded to the listener (`null`s are converted to `NaN`s).
     */
    exit: (c: number) => void;

    /**
     * Triggered when a crash event has happened.
     */
    crash: () => void;

    /**
     * Triggered when stdout has data income.
     */
    stdout: (s: string) => void;

    /**
     * Triggered when stderr has data income.
     */
    stderr: (s: string) => void;

    /**
     * Triggered when stdout / stderr has data income.
     */
    log: (s: string) => void;
}

enum GameInstanceStatus {
    SPAWNING,
    RUNNING,
    EXITED
}

const gameId = customAlphabet('0123456789abcdef', 7);

const gameInstances: Map<string, GameInstance> = new Map();

/**
 * Each running game instance owns this class as its descriptor. Manages various events for the game.
 */
export class GameInstance extends TypedEmitter<GameInstanceEvents> {
    protected readonly id = gameId();
    protected readonly proc: ChildProcess;
    protected status: GameInstanceStatus = GameInstanceStatus.SPAWNING;

    // Indicating that the game is likely to have crashed. Definitely it has when it exists with a non-zero code, but
    // this flag can be set before this happens by inferring using logs and other signals.
    protected crashed: boolean = false;

    protected constructor(bin: string, args: string[], rootDir: string) {
        super();
        this.proc = createProcess(bin, args, rootDir);
        this.proc.setMaxListeners(0);
        this.setMaxListeners(0);
        this.bindListeners();
        this.proc.once('spawn', () => {
            this.status = GameInstanceStatus.RUNNING;
        });
    }

    /**
     * Factory method for creating new game instance.
     */
    static create(bin: string, args: string[], rootDir: string) {
        const g = new GameInstance(bin, args, rootDir);
        gameInstances.set(g.id, g);
        g.on('exit', () => {
            gameInstances.delete(g.id);
        });
        return g;
    }

    protected bindListeners() {
        this.proc.on('exit', (code) => {
            console.log('Game instance %s exited with code %d.', this.id, code);
            if (code != 0) {
                this.crashed = true;
            }
            this.status = GameInstanceStatus.EXITED;
            this.emit('exit', code ?? NaN);
        });

        this.proc.stdout?.on('data', this.handleLog('stdout'));
        this.proc.stderr?.on('data', this.handleLog('stderr'));
    }

    protected handleLog(channel: 'stdout' | 'stderr'): (c: string) => void {
        return (c: string) => {
            const prompt = c == 'stdout' ? '>' : '!';
            const s = parseOutput(c.toString ? c.toString() : String(c));
            console.log(`[Game %s] ${prompt}\n%s`, this.id, s);
            this.emit(channel, s);
            this.emit('log', s);
        };
    }

    /**
     * Checks if the game has (likely) crashed.
     */
    isCrashed() {
        return this.crashed;
    }

    /**
     * Resolves when the process is created.
     */
    whenReady(): Promise<void> {
        if (this.status != GameInstanceStatus.SPAWNING) {
            return Promise.resolve();
        }
        return waitForEvent(this.proc, 'spawn');
    }

    /**
     * Stops the game forcefully.
     */
    kill(): void {
        this.proc.kill();
    }
}

function createProcess(bin: string, args: string[], rootDir: string): ChildProcess {
    console.log('Spawning process using ' + bin);
    return spawn(bin, args, { cwd: rootDir, detached: true, stdio: 'pipe' });
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function parseOutput(src: string): string {
    try {
        const log = xmlParser.parse(src);
        if (!log?.['log4j:Event']) {
            return src;
        }
        const events = log['log4j:Event'];
        let eventList;
        if (events instanceof Array) {
            eventList = events;
        } else {
            eventList = [events];
        }
        let out = '';
        eventList.forEach((e: any) => {
            const msg = e?.['log4j:Message'];
            const error = e?.['log4j:Throwable'];
            const time = new Date(parseInt(e?.['@_timestamp'])).toLocaleTimeString();
            const level = e?.['@_level'];
            const thread = e?.['@_thread'];
            out += `[${time}][${thread}][${level}] ${msg}` + (error ? '\n' + error : '');
        });
        return out;
    } catch (e) {
        console.log(e);
        return src; // Not XML
    }
}
