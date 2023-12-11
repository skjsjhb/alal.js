import { TestSummary } from "./TestSummary";

export module TestTools {
    import AssertRecord = TestSummary.AssertRecord;
    let currentTestName = "";
    let assertRecords: AssertRecord[];

    export async function test(name: string, todo: () => Promise<void> | void): Promise<void> {
        console.debug("Now testing: " + name);
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
        console.debug("Test " + name + " completed");
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
            received: e.toString(),
            expl: ""
        });
    }

    export function assertTrue(what: any, why: string) {
        assertRecords.push({
            type: "true",
            ok: !!what,
            expected: true,
            received: !!what,
            expl: why
        });
    }

    export function assertFalse(what: any, why: string) {
        assertRecords.push({
            type: "notTrue",
            ok: !what,
            expected: false,
            received: !what,
            expl: why
        });
    }

    export function assertEquals<T>(expected: T, received: T, why: string) {
        assertRecords.push({
            type: "equals",
            ok: expected == received || jsonEquals(expected, received),
            expected,
            received,
            expl: why
        });
    }

    export function assertNotEquals<T>(expected: T, received: T, why: string) {
        assertRecords.push({
            type: "notEquals",
            ok: expected != received && !jsonEquals(expected, received),
            expected,
            received,
            expl: why
        });
    }

    function jsonEquals(expected: any, received: any) {
        if (typeof expected == "object" && typeof received == "object") {
            return JSON.stringify(expected) == JSON.stringify(received);
        }
        return false;
    }

    /**
     * Running all tests is a cumbersome task for both CI and dev machine.
     *
     * This method requests tests to only do a basic subset of all tests.
     * Note: even simple tests are used for CI, a full test **MUST** pass before a release.
     */
    export function shouldSimpleTest() {
        return process.env["ALAL_TEST_SIMPLE"] == "1";
    }
}
