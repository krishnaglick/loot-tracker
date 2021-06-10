import {
    BattleHasRewards,
    BattleWithRewards,
    isBattleUserData,
    isGranblueResponse,
    isUserData,
} from "./response-types";

type User = { name: string; id: string };
const currentUser = {} as User;

const storeUser = (user: User) => chrome.storage.sync.set({ user });
chrome.storage.sync.get(["user"], ({ user }) => {
    if (user?.name || user?.id) {
        currentUser.name = user.name;
        currentUser.id = user.id;
    }
});

const chestMap: { [key: number]: string } = {
    1: "Wooden",
    2: "Silver",
    3: "Gold",
    4: "MVP",
    11: "Host",
    13: "Blue",
};

function normalizeLoot(battleData: BattleWithRewards) {
    const raw: any[] = [];
    console.log("Normalizing loot: ", battleData);
    const timestamp = Date.now(); // TODO: Build server to set this on incoming
    Object.entries(battleData.rewards.reward_list).forEach(([chestType, chests]) => {
        Object.entries(chests).forEach(([chestId, chestContents]) => {
            // Normalize data
            raw.push({
                ...chestContents,
                chestId,
                chestType,
                chestTypeName: chestMap[chestType as any as number],
                fightName: battleData.appearance?.quest_name || battleData.appearance?.title || "Unknown",
                battleId: "TODO - may be impossible",
                username: currentUser.name,
                userId: currentUser.id,
                timestamp,
            });
        });
    });
    console.log("Normalized loot: ", raw);
    // Save the data to firebase
    if (currentUser.id) {
        fetch(`https://drop-data-67126-default-rtdb.firebaseio.com/${currentUser.id}/drop-data.json`, {
            body: JSON.stringify(raw),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });
    }
}

function haveRequestId(v: any): v is { requestId: string } {
    return !!(v && v.hasOwnProperty("requestId"));
}

const allEventHandler: Parameters<typeof chrome.debugger.onEvent.addListener>["0"] = ({ tabId }, message, params) => {
    if (message == "Network.responseReceived" && haveRequestId(params)) {
        // This lets us get the response data from the intercepted request
        chrome.debugger.sendCommand(
            {
                tabId,
            },
            "Network.getResponseBody",
            {
                requestId: params.requestId,
            },
            (response) => {
                // There's a lotta data coming across, some we don't care about.
                if (isGranblueResponse(response)) {
                    try {
                        const data = JSON.parse(response.body);
                        console.log("Response Body: ", data);
                        // Save the user for reporting
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

                        // If we got reward data
                        if (BattleHasRewards(data)) {
                            normalizeLoot(data);
                            // Below is some basic chest logging, this isn't what's reported.
                            Object.entries(data.rewards.reward_list).forEach(([chestNumber, chestContents]) => {
                                if (Object.values(chestContents).length) {
                                    console.log(
                                        `Received ${Object.values(chestContents)
                                            .map((contents) => `${contents.count} ${contents.name}`)
                                            .join(", ")} from ${
                                            chestMap[chestNumber as unknown as number]
                                        } Chest(s) - (${chestNumber})`
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
                                            } Chest(s) - Reserved`
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
// Setup toggle functionality
chrome.browserAction.onClicked.addListener(() => {
    if (!attached) {
        chrome.debugger.getTargets((targets) => {
            // Get the Granblue Tab
            target = targets.find(
                (target) =>
                    target.type === "page" && ["Granblue Fantasy", "グランブルーファンタジー"].includes(target.title)
            );
            if (target?.tabId) {
                // Attach the debugger so we can intercept requests
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
