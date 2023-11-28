import { outputJSON } from "fs-extra";

/**
 * The test summarize and report module for autotest.
 *
 * Test summary runs on the renderer process and generate a file named `test-summary.json` in CWD.
 */
export namespace TestSummary {
    export type AssertType = "equals" | "notEquals" | "true" | "notTrue" | "error";

    export interface AssertRecord {
        type: AssertType;
        ok: boolean;
        expected: any;
        received: any;
        expl: string; // Explanation
    }

    export interface SingleTest {
        displayName: string;
        passed: boolean;
        assertRecord: AssertRecord[];
    }

    const tests: SingleTest[] = [];

    export function addTestRecord(rec: SingleTest) {
        tests.push(rec);
    }

    export async function writeTestSummary() {
        await outputJSON("test-summary.json", tests);
    }
}