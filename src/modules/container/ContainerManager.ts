import { Container } from "@/modules/container/ContainerTools";
import { Registry } from "@/modules/data/Registry";

export module ContainerManager {
    let containers: Record<string, Container>;
    let containersRegId = "containers";

    /**
     * Gets a container.
     */
    export function get(id: string): Container | null {
        initOnDemand();
        return containers[id] ?? null;
    }

    /**
     * Adds a container.
     */
    export function add(id: string, c: Container): void {
        initOnDemand();
        containers[id] = c;
    }

    /**
     * Removes a container from the registry, while keeping its files untouched.
     */
    export function unlink(id: string): void {
        initOnDemand();
        delete containers[id];
    }

    function initOnDemand() {
        if (!containers) {
            containers = Registry.getTable<Record<string, Container>>(containersRegId, {});
        }
    }
}