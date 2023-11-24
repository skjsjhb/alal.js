/**
 * A task host is a more detailed record than a simple Promise.
 */
export class Task<T> {
    /**
     * Task name.
     */
    name: string;

    /**
     * Child tasks for tracing.
     */
    children: Task<any>[] = [];

    /**
     * Progress indicator. An object counts the number of completed / failed / total atomic tasks. `null` means that the
     * task has indeterminate progress.
     */
    progress: {
        success: number;
        failed: number;
        total: number;
    } | null = null;

    resolved: boolean = false;
    failed: boolean = false;
    error: any;
    value: T | null = null;

    listeners: [(v: T) => void, (v: T) => void][] = [];

    /**
     * Creates the task object.
     * @param name Task name.
     * @param total Number of total tasks. If set to `null`, an indeterminate task will be created.
     * @param executor Function to be called when the task creates. The constructor only does a plain call, but this
     * is useful for async tasks to return the task object before `async/await` execution, without extra steps.
     */
    constructor(name: string, total: number | null, executor?: (task: Task<T>) => any) {
        if (total != null) {
            this.progress = {
                success: 0,
                failed: 0,
                total: total
            };
        }
        this.name = name;
        if (executor) {
            executor(this);
        }
    }

    setName(n: string) {
        this.name = n;
    }


    /**
     * Gets a Promise which resolves when the task completes.
     */
    whenFinish(): Promise<T> {
        if (this.resolved) {
            return Promise.resolve(this.value as T);
        }
        if (this.failed) {
            return Promise.reject(this.error);
        }
        return new Promise((res, rej) => {
            this.listeners.push([res, rej]);
        });
    }

    /**
     * Mark this task as resolved.
     * @param value Value of result.
     */
    resolve(value: T): void {
        this.resolved = true;
        this.value = value;
        for (const [res] of this.listeners) {
            res(value);
        }
    }

    /**
     * Fail this task with the specified error.
     * @param error Reason why this task is destroyed, rather than resolved.
     */
    fail(error?: any): void {
        this.failed = true;
        this.error = error;
        for (const [, rej] of this.listeners) {
            rej(error);
        }
    }

    /**
     * Gets the progress as string.
     */
    getProgressString(): string {
        if (this.progress === null) {
            return "...";
        }
        if (this.progress.failed > 0) {
            return `${this.progress.success + this.progress.failed} (-${this.progress.failed}) / ${this.progress.total}`;
        } else {
            return `${this.progress.success} / ${this.progress.total}`;
        }
    }

    /**
     * Gets the progress as percentage (0 - 1).
     */
    getProgressPercent(): number {
        if (this.progress === null) {
            return -1;
        }
        return this.progress.success / this.progress.total;
    }

    setTotal(t: number) {
        if (!this.progress) {
            return;
        }
        this.progress.total = t;
    }

    setSuccess(s: number) {
        if (!this.progress) {
            return;
        }
        this.progress.success = s;
    }

    setFailed(f: number) {
        if (!this.progress) {
            return;
        }
        this.progress.failed = f;
    }

    addSuccess() {
        if (!this.progress) {
            return;
        }
        this.progress.success++;
    }

    addFailed() {
        if (!this.progress) {
            return;
        }
        this.progress.failed++;
    }


    /**
     * Link this task to specified task.
     */
    linkTo(t: Task<any>): Task<T> {
        t.linkChild(this);
        return this;
    }

    linkChild(t: Task<any>): this {
        this.children.push(t);
        return this;
    }

    /**
     * Creates an indeterminate task with the specified promise object.
     */
    static fromPromise<T>(name: string, promo: Promise<T>): Task<T> {
        return new Task<T>(name, null, (task) => {
            promo.then(task.resolve.bind(task))
                .catch(task.fail.bind(task));
        });
    }
}