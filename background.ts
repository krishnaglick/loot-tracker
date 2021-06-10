// chrome.webRequest.onCompleted.addListener(
//     function (details) {
//         console.log("asdf resource", details);
//     },
//     { urls: ["<all_urls>"] }
// );

import {
    BattleHasRewards,
    BattleWithRewards,
    isBattleUserData,
    isGranblueResponse,
    isUserData,
} from "./response-types";

// let currentTab;

type User = { name: string; id: string };

const storeUser = (user: User) => chrome.storage.sync.set({ user: user });
const getUser = chrome.storage.sync.get(["user"], console.log);

const currentUser = {} as User;

const chestMap: { [key: number]: string } = {
    1: "Wooden",
    2: "Silver",
    3: "Gold",
    4: "Blue",
    11: "MVP",
    13: "Host",
};

function normalizeLoot(battleData: BattleWithRewards) {
    const raw: any[] = [];
    Object.entries(battleData.rewards.reward_list).forEach(([chestType, chests]) => {
        Object.entries(chests).forEach(([chestId, chestContents]) => {
            raw.push({
                ...chestContents,
                chestId,
                chestType,
                chestTypeName: chestMap[chestType as any as number],
                fightName: battleData.appearance?.quest_name || battleData.appearance?.title || "Unknown",
                battleId: "TODO",
            });
        });
    });
    console.log(raw);
}

function haveRequestId(v: any): v is { requestId: string } {
    return !!(v && v.hasOwnProperty("requestId"));
}

// function allEventHandler({ tabId }: { tabId?: number }, message: string, params: { requestId: string }) {
const allEventHandler: Parameters<typeof chrome.debugger.onEvent.addListener>["0"] = ({ tabId }, message, params) => {
    if (message == "Network.responseReceived" && haveRequestId(params)) {
        //response return
        chrome.debugger.sendCommand(
            {
                tabId,
            },
            "Network.getResponseBody",
            {
                requestId: params.requestId,
            },
            (response) => {
                if (isGranblueResponse(response)) {
                    try {
                        const data = JSON.parse(response.body);
                        if (isBattleUserData(data)) {
                            currentUser.id = data.user_id;
                            currentUser.name = data.nickname;
                            storeUser(currentUser);
                        }
                        if (isUserData(data)) {
                            currentUser.id = data.id;
                            currentUser.name = data.nickname;
                            storeUser(currentUser);
                        }
                        if (BattleHasRewards(data) && currentUser.id) {
                            normalizeLoot(data);
                            // fetch(`https://drop-data-67126-default-rtdb.firebaseio.com/drop-data.json`, {
                            //     body: JSON.stringify({
                            //         [currentUser.id + "-" + Date.now()]: {
                            //             ...data,
                            //             fightName: data.appearance.quest_name || data.appearance.title,
                            //         },
                            //     }),
                            //     headers: { "Content-Type": "application/json" },
                            //     method: "PATCH",
                            // });
                            Object.entries(data.rewards.reward_list).forEach(([chestNumber, chestContents]) => {
                                if (Object.values(chestContents).length) {
                                    console.log(
                                        `Received ${Object.values(chestContents)
                                            .map((contents) => `${contents.count} ${contents.name}`)
                                            .join(", ")} from ${chestMap[chestNumber as unknown as number]} Chest(s)`
                                    );
                                }
                            });
                            Object.entries(data.rewards.auto_recycling_weapon_list).forEach(
                                ([chestNumber, chestContents]) => {
                                    if (Object.values(chestContents).length) {
                                        console.log(
                                            `Reserved ${Object.values(chestContents)
                                                .map((contents) => `${contents.count} ${contents.name}`)
                                                .join(", ")} from ${
                                                chestMap[chestNumber as unknown as number]
                                            } Chest(s)`
                                        );
                                    }
                                }
                            );
                        }
                    } catch {}
                }
            }
        );
    }
};

let attached = false;
type ArrayType<T> = T extends (infer U)[] ? U : T;
let target: ArrayType<Parameters<Parameters<typeof chrome.debugger.getTargets>["0"]>["0"]> | undefined;
chrome.browserAction.onClicked.addListener(() => {
    if (!attached) {
        chrome.debugger.getTargets((targets) => {
            target = targets.find((target) => target.type === "page" && target.title === "Granblue Fantasy");
            if (target?.tabId) {
                chrome.debugger.attach({ tabId: target.tabId }, "1.0", () => {
                    chrome.debugger.sendCommand({ tabId: target!.tabId }, "Network.enable");
                    attached = true;
                });
                chrome.debugger.onEvent.addListener(allEventHandler);
            }
        });
    } else {
        if (target) {
            chrome.debugger.detach({ tabId: target.tabId }, () => (attached = false));
        }
    }
});
