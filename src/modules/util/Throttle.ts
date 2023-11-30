/**
 * Utility to limit the concurrency.
 */
export class Pool {
    queue: (() => void)[] = [];
    limit = 0;
    size = 0;

    constructor(limit: number) {
        this.limit = limit;
    }

    /**
     * Acquire an instance. The returned `Promise` is resolved once there are vacant space.
     */
    acquire(): Promise<void> {
        return new Promise((res) => {
            if (this.size < this.limit) {
                // Fulfill now
                this.size++;
                res();
            } else {
                // Wait
                this.queue.push(res);
            }
        });
    }

    /**
     * Sets a new limit.
     * The pool won't allocate new instances until active count goes below the new limit.
     */
    setLimit(l: number) {
        this.limit = l;
    }

    /**
     * Gets the current size of the pool.
     */
    getSize() {
        return this.size;
    }

    /**
     * Release space for further acquiring.
     */
    release(): void {
        if (this.size > this.limit) {
            // Already overloaded
            this.size--;
            return;
        }
        const res = this.queue.shift();
        if (res) {
            res();
        } else {
            this.size--;
        }
        if (this.size < 0) {
            this.size = 0;
        }
    }
}