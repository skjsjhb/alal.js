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
     * Parent task
     */
    parent: Task<any> | null = null;

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

    // Standalone tasks are removed after it's finished, while linked tasks are removed by its parent and stays alive.
    standalone: boolean = true;

    waitingPromises: [(v: T) => void, (v: T) => void][] = [];
    listeners: Set<() => void> = new Set();
    static listeners: Set<() => void> = new Set();

    static tasks: Task<any>[] = [];

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
        Task.tasks.push(this);
        if (executor) {
            executor(this);
        }
        Task.listeners.forEach(f => f());
    }

    setName(n: string) {
        this.name = n;
        this.dispatch();
    }

    /**
     * Gets a Promise which resolves when the task completes.
     */
    wait(): Promise<T> {
        if (this.resolved) {
            return Promise.resolve(this.value as T);
        }
        if (this.failed) {
            return Promise.reject(this.error);
        }
        return new Promise((res, rej) => {
            this.waitingPromises.push([res, rej]);
        });
    }

    /**
     * Mark this task as resolved.
     * @param value Value of result.
     */
    resolve(value: T): void {
        this.resolved = true;
        this.value = value;
        for (const [res] of this.waitingPromises) {
            res(value);
        }
        this.parent?.success();
        if (this.standalone) {
            this.remove();
        }
        this.dispatch();
    }

    /**
     * Reject this task with the specified error.
     * @param error Reason why this task is destroyed, rather than resolved.
     */
    reject(error?: any): void {
        this.failed = true;
        this.error = error;
        this.dispatch();
        for (const [, rej] of this.waitingPromises) {
            rej(error);
        }
        this.parent?.success();
        if (this.standalone) {
            this.remove();
        }
        this.dispatch();
    }

    /**
     * Gets the progress as string.
     */
    getProgressString(): string {
        if (this.progress === null || this.progress.total == 0) {
            return '...';
        }
        if (this.progress.failed > 0) {
            return `${this.progress.success + this.progress.failed} (-${this.progress.failed}) / ${this.progress.total}`;
        } else {
            return `${this.progress.success} / ${this.progress.total}`;
        }
    }

    /**
     * Gets the progress as percentage (0 - 100). Returns -1 for indeterminate ones.
     */
    getProgressPercent(): number {
        if (this.progress === null) {
            return -1;
        }
        if (this.progress.total == 0) {
            return 100;
        }
        return this.progress.success * 100 / this.progress.total;
    }

    setTotal(t: number) {
        if (!this.progress) {
            return;
        }
        this.dispatch();
        this.progress.total = t;
    }

    setSuccess(s: number) {
        if (!this.progress) {
            return;
        }
        this.dispatch();
        this.progress.success = s;
    }

    setFailed(f: number) {
        if (!this.progress) {
            return;
        }
        this.dispatch();
        this.progress.failed = f;
    }

    success() {
        if (!this.progress) {
            return;
        }
        this.dispatch();
        this.progress.success++;
    }

    fail() {
        if (!this.progress) {
            return;
        }
        this.dispatch();
        this.progress.failed++;
    }

    /**
     * Subscribe for state updates.
     */
    subscribe(f: () => void) {
        this.listeners.add(f);
    }

    unsubscribe(f: () => void) {
        this.listeners.delete(f);
    }

    static subscribe(f: () => void) {
        Task.listeners.add(f);
    }

    static unsubscribe(f: () => void) {
        Task.listeners.delete(f);
    }

    protected dispatch() {
        this.listeners.forEach(f => f());
        Task.listeners.forEach(f => f());
    }

    /**
     * Link this task to specified task. Linked tasks will call `addSuccess` for parent when itself resolves and
     * vice versa. If the task is already resolved before being added, this happens immediately.
     */
    link(t: Task<any>): Task<T> {
        this.standalone = false;
        this.parent = t;
        t.children.push(this);
        if (this.resolved) {
            t.parent?.success();
        } else if (this.failed) {
            this.parent.fail();
        }
        return this;
    }

    // Remove this task from task list
    remove() {
        Task.tasks = Task.tasks.filter(t => t != this);
        for (const c of this.children) {
            c.remove();
        }
    }

    /**
     * Gets all tasks in an array copy.
     */
    static getTasks(): Task<any>[] {
        return Task.tasks.concat();
    }

    /**
     * Creates an indeterminate task with the specified promise object.
     */
    static fromPromise<T>(name: string, promo: Promise<T>): Task<T> {
        return new Task<T>(name, null, (task) => {
            promo.then(task.resolve.bind(task))
                .catch(task.reject.bind(task));
        });
    }
}
