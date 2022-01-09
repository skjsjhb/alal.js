import { load } from "cheerio";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { getMainWindowUATrimmed } from "../../../main/Bootstrap";
import { ModArtifact, ModMeta } from "../virtual/ModDefine";

// See https://github.com/Andy-K-Sparklight/Alicorn/issues/85 for more details about why this module exists.
// The whole part should run in main rather than in renderer.
// I'm sorry ponies, but this has to be. It just HAS to be like this!

let cWindow: BrowserWindow | null = null;
let d = false;
const FIRST_MATCH_CODE = `(()=>{const e=document.querySelector("main > div > div > ul > div > div:nth-child(1) > div > div.flex.flex-col > div > a");if(!e){return "";};return e.href||"";})()`;
const QUERY_CAPTCHA_CODE = `(()=>{const ele=document.querySelector("meta[name='captcha-bypass']");return !!ele;})()`;
const GET_DOM_CONTENT_CODE = `(()=>{return document.querySelector("html").outerHTML})()`;

let LOCK = false;
const LOCK_LISTENERS: ((value: void | PromiseLike<void>) => void)[] = [];
function acquireLock(): Promise<void> {
  if (!LOCK) {
    LOCK = true;
    return Promise.resolve();
  } else {
    return new Promise<void>((res) => {
      LOCK_LISTENERS.push(res);
    });
  }
}

function releaseLock(): void {
  LOCK = false;
  const bf = LOCK_LISTENERS.shift();
  if (bf) {
    LOCK = true;
    bf();
  }
}

export function closeCurseWindow(): void {
  cWindow?.destroy(); // Curse? Just give it a destroy! I don't care!
}

export function bindCurseListeners(): void {
  ipcMain.handle("curseQueryModByName", (_e, q) => {
    return queryModByName(q);
  });
  ipcMain.handle("curseQueryModInfoBySlug", (_e, s) => {
    return queryModInfoBySlug(s);
  });
  ipcMain.handle("curseDecideFullInformation", (_e, a) => {
    return deicdeFullInformation(a);
  });
}

function codeQueryData(code: string): Promise<string> {
  if (cWindow) {
    return cWindow.webContents.executeJavaScript(code, true);
  } else {
    return Promise.reject();
  }
}

function jmpPage(url: string): Promise<void> {
  // Jump to there and complete CAPTCHA if necessary, then callback.
  return new Promise<void>((res) => {
    const fun = async () => {
      if (!(await hasCAPTCHA()) && url === cWindow?.webContents.getURL()) {
        res();
        cWindow?.webContents.off("did-navigate", fun);
      }
    };
    cWindow?.webContents.on("did-navigate", fun);
    cWindow?.setMenu(null);
    void cWindow?.loadURL(url);
  });
}

// To get slug
export async function queryModByName(query: string): Promise<string> {
  ensureCurseWindow();
  await acquireLock();
  await jmpPage(
    `https://www.curseforge.com/minecraft/mc-mods/search?search=${encodeURIComponent(
      query
    )}`
  );
  const s = await codeQueryData(FIRST_MATCH_CODE);
  releaseLock();
  const slug = s.split("/").pop();
  return slug || "";
}

export async function queryModInfoBySlug(
  slug: string
): Promise<[ModMeta, ModArtifact[]]> {
  ensureCurseWindow();
  await acquireLock();
  await jmpPage(`https://www.curseforge.com/minecraft/mc-mods/${slug}/files`);
  const dom =
    "<!DOCTYPE html>" + String(await codeQueryData(GET_DOM_CONTENT_CODE));
  // Pull the dom out
  releaseLock();
  const $ = load(dom);
  const displayName = $(
    "main > div > header > div > div > div > div > h2"
  ).text();
  const tbn =
    $("main > div > header > div > div > figure > div > a > img").attr("src") ||
    "";
  const artifacts: ModArtifact[] = [];
  const tbody = $(
    "main > div > div > section > div > div > div > section > div > div > div > div > table > tbody"
  );
  const overs = new Set<string>();
  for (const e of tbody.children().get()) {
    const er = $(e);
    let lnk = er.find("td > a[data-action='file-link']").attr("href") || "";
    if (lnk.startsWith("/")) {
      lnk = "https://www.curseforge.com" + lnk;
    }
    const fid = lnk.split("/").pop() || "";
    const mv = er.find("td > div > div").text().trim();
    const ov =
      er
        .find("td > div > span.extra-versions")
        .attr("title")
        ?.split(/<br( )*?\/>/i) || [];
    ov.unshift(mv);
    ov.forEach((e) => {
      overs.add(e);
    });
    artifacts.push({
      downloadUrl: lnk, // This should be decided later
      modLoader: ov.includes("Fabric") ? "Fabric" : "Forge",
      gameVersion: ov,
      id: fid,
      fileName: "", // Decide later
    });
  }
  return [
    {
      provider: "CursePlusPlus",
      id: slug, // Slug as id
      slug: slug,
      displayName: displayName,
      thumbNail: tbn,
      supportVersions: [...overs],
    },
    artifacts,
  ];
}

export async function deicdeFullInformation(
  artifact: ModArtifact
): Promise<ModArtifact> {
  ensureCurseWindow();
  await acquireLock();
  await jmpPage(artifact.downloadUrl);
  const $ = load(
    "<!DOCTYPE html>" + (await codeQueryData(GET_DOM_CONTENT_CODE))
  );
  releaseLock();
  const fName = $(
    "main > div > div > section > div > div > div > section > section > article > div > div:nth-child(1) > span:nth-last-child(1)"
  )
    .text()
    .trim();
  let fid = artifact.downloadUrl.split("/").pop() || "";
  fid = fid.slice(0, 4) + "/" + fid.slice(4);
  artifact.downloadUrl = `https://media.forgecdn.net/files/${fid}/${encodeURIComponent(
    fName
  )}`;
  artifact.fileName = fName;
  return artifact;
}

function ensureCurseWindow(): void {
  if (!cWindow) {
    const w = new BrowserWindow({
      show: false,
      center: true,
      width: 960,
      height: 540,
      webPreferences: {
        partition: "persist:curseforge",
      },
    });
    w.webContents.setUserAgent(getMainWindowUATrimmed()); // Fake UA
    w.webContents.on("did-navigate", async () => {
      if (await hasCAPTCHA()) {
        w.show();
        if (!d) {
          void dialog.showMessageBox(w, {
            type: "info",
            title: "SOS!",
            message:
              "We've encountered a CAPTCHA, and Alicorn cannot continue.\n我们遇到了人机验证，Alicorn 需要你的帮助。\n\nComplete the CAPTCHA to continue.\n完成人机验证，然后我们可以继续。\n\nIf you don't want to see this again, try to use a proxy.\n如果你不希望再看到此窗口，请使用一个可信的代理。",
          });
          d = true;
        }
      } else {
        w.hide();
      }
    });
    w.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.includes("cdn-cgi")) {
        callback({});
        return;
      }
      const u = new URL(details.url);
      if (
        details.url.includes("jquery") &&
        u.hostname === "www.curseforge.com"
      ) {
        callback({ cancel: true });
        return;
      }
      if (
        !["mainFrame", "other"].includes(details.resourceType) &&
        (u.hostname === "www.curseforge.com" ||
          u.hostname.includes("forgecdn.net"))
      ) {
        callback({ cancel: true });
        return;
      }
      if (details.url.includes("game-cover")) {
        callback({ cancel: true });
        return;
      }
      if (details.url.includes("media.forgecdn.net")) {
        callback({ cancel: true });
        return;
      }
      if (details.url.includes("recaptcha")) {
        callback({ cancel: true });
        return;
      }
      if (
        !(
          details.url.includes("www.curseforge.com") ||
          details.url.includes("captcha")
        )
      ) {
        callback({ cancel: true }); // Block unknown domain
        return;
      }
      callback({}); // Accept
    });
    cWindow = w;
  }
}

function hasCAPTCHA(): Promise<boolean> {
  return new Promise<boolean>((res, rej) => {
    cWindow?.webContents
      .executeJavaScript(QUERY_CAPTCHA_CODE, true)
      .then((b) => {
        res(b);
      })
      .catch((e) => {
        rej(e);
      });
  });
}
