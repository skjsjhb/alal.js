import { TestSummary } from "./TestSummary";

export namespace TestTools {
    import AssertRecord = TestSummary.AssertRecord;
    let currentTestName = "";
    let assertRecords: AssertRecord[];

    export async function test(name: string, todo: () => Promise<void> | void): Promise<void> {
        currentTestName = name;
        assertRecords = [];
        try {
            const pr = todo();
            if (pr instanceof Promise) {
                try {
                    await pr;
                } catch (e) {
                    assertRaiseError(e);
                }
            }
        } catch (e) {
            assertRaiseError(e);
        }
        const rc: TestSummary.SingleTest = {
            displayName: currentTestName,
            passed: assertRecords.every(r => r.ok),
            assertRecord: assertRecords
        };
        TestSummary.addTestRecord(rc);
    }

    function assertRaiseError(e: any) {
        assertRecords.push({
            type: "error",
            ok: false,
            expected: null,
            received: e.toString()
        });
    }

    export function assertTrue(what: any) {
        assertRecords.push({
            type: "true",
            ok: !!what,
            expected: true,
            received: !!what
        });
    }

    export function assertFalse(what: any) {
        assertRecords.push({
            type: "notTrue",
            ok: !what,
            expected: false,
            received: !what
        });
    }

    export function assertEquals<T>(expected: T, received: T) {
        assertRecords.push({
            type: "equals",
            ok: expected == received || jsonEquals(expected, received),
            expected,
            received
        });
    }

    export function assertNotEquals<T>(expected: T, received: T) {
        assertRecords.push({
            type: "notEquals",
            ok: expected != received && !jsonEquals(expected, received),
            expected,
            received
        });
    }

    function jsonEquals(expected: any, received: any) {
        if (typeof expected == "object" && typeof received == "object") {
            return JSON.stringify(expected) == JSON.stringify(received);
        }
        return false;
    }
}
