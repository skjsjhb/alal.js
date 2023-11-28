/*
 * Launches the autotest build. This starts Electron in dev mode without packaging.
 */
const path = require("node:path");
const fs = require("node:fs/promises");
const fse = require("fs");
const cp = require("node:child_process");

console.log("======== ALAL AutoTest Tool ========");

const testRoot = path.resolve(__dirname, "../build/autotest");

if (!fse.existsSync(testRoot)) {
    console.error("Test target not exist: " + testRoot);
    console.error("Please run build first.");
    process.exit(1);
}

console.log("Starting Electron on test target: " + testRoot);

process.chdir(testRoot);

const proc = cp.exec("npx electron .", {
    cwd: process.cwd()
});
proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);

proc.on("exit", async () => {
    console.log("Autotest process exited. Loading test summary.");
    const testSummary = path.resolve(process.cwd(), "test-summary.json");
    try {
        const testObject = JSON.parse((await fs.readFile(testSummary)).toString());
        displayTestSummaryAndExit(testObject);
    } catch (e) {
        console.error("Cannot load test summary: " + e);
        process.exit(1);
    }
});

function displayTestSummaryAndExit(objs) {
    console.log("\n\n======== TEST SUMMARY ========\n");
    let success = 0;
    let failed = 0;
    for (const t of objs) {
        if (t.passed) {
            success++;
        } else {
            failed++;
        }
        let statusText = (t.passed ? "[PASSED]" : "[FAILED]") + '\t' + t.displayName;
        if (!t.passed) {
            let arid = 0;
            for (const ar of t.assertRecord) {
                if (!ar.ok) {
                    statusText += '\n\t\t' + (ar.type !== "error" ? `[${++arid}] ` : `[!] `);
                    switch (ar.type) {
                        case "equals":
                            statusText += `${ar.received} != ${ar.expected}`;
                            break;
                        case "notEquals":
                            statusText += `${ar.received} == ${ar.expected}`;
                            break;
                        case "true":
                            statusText += `Not true`;
                            break;
                        case "notTrue":
                            statusText += `Not false`;
                            break;
                        case "error":
                            statusText += `${ar.received}`;
                    }
                    if (ar.expl) {
                        statusText += " (" + ar.expl + ")";
                    }
                }
            }
        }

        console.log(statusText);
    }

    console.log(`\nPassed: ${success}\nFailed: ${failed}\n\nTEST ${failed ? "FAILED" : "PASSED"}`);

    process.exit(failed ? 1 : 0);
}