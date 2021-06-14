import {
    BattleHasRewards,
    BattleWithRewards,
    BossParam,
    isBattleStatus,
    isBattleUserData,
    isContributionScenario,
    isFightStart,
    isGranblueResponse,
    isUserData,
    Weapon,
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
    4: "Red",
    11: "Blue",
    13: "Purple",
};

const fightData: {
    [battleId: string]: {
        honors: number;
        turnCount: number;
        loot: NormalizedLoot[];
        bossData: BossParam[];
        thLevel: number;
    };
} = {};

(globalThis as any).fightData = fightData;
(globalThis as any).traverseObject = (object: any, value: string | number) => {
    Object.entries(object).forEach(([k, v]) => {
        if (v === value) {
            console.log("Found!: ", k, v);
        } else {
            if (typeof v === "object") {
                (globalThis as any).traverseObject(v, value);
            }
        }
    });
};

type NormalizedLoot = {
    chestId: string;
    chestType: string;
    chestTypeName: string;
    fightName: string;
    battleId: number;
    username: string;
    userId: string;
} & Weapon;
function normalizeLoot(battleData: BattleWithRewards, battleId: number) {
    const lootData: NormalizedLoot[] = [];
    console.log("Normalizing loot: ", battleData);
    try {
        Object.entries(battleData.rewards.reward_list).forEach(([chestType, chests]) => {
            Object.entries(chests).forEach(([chestId, chestContents]) => {
                // Normalize data
                lootData.push({
                    ...chestContents,
                    chestId,
                    chestType,
                    chestTypeName: chestMap[Number(chestType)],
                    fightName: battleData.appearance?.quest_name || battleData.appearance?.title || "Unknown",
                    battleId,
                    username: currentUser.name,
                    userId: currentUser.id,
                });
            });
        });
        fightData[battleId].loot = lootData;
        console.log("Normalized loot: ", lootData);
        console.log("Fight Data: ", fightData[battleId]);
        // Save the data to firebase
        if (currentUser.id) {
            fetch(`https://drop-data-67126-default-rtdb.firebaseio.com/${currentUser.id}/drop-data.json`, {
                body: JSON.stringify(lootData),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
        }
    } catch (err) {
        console.error(err);
    }
}

function haveRequestId(v: any): v is { requestId: string } {
    return !!(v && v.hasOwnProperty("requestId"));
}

const getRequestData = (tabId: number, requestId: string) =>
    Promise.all([
        new Promise<Object | undefined>((res) =>
            chrome.debugger.sendCommand(
                {
                    tabId,
                },
                "Network.getResponseBody",
                {
                    requestId: requestId,
                },
                res
            )
        ),
        new Promise<chrome.tabs.Tab>((res) => chrome.tabs.get(tabId, res)),
    ]);

const allEventHandler: Parameters<typeof chrome.debugger.onEvent.addListener>["0"] = async (
    source,
    message,
    params
) => {
    const { tabId } = source;
    if (message == "Network.responseReceived" && haveRequestId(params)) {
        // This lets us get the response data from the intercepted request
        const [response, tabInfo] = await getRequestData(tabId ?? 0, params.requestId);
        let battleId = NaN;
        if (tabInfo.url?.includes("raid_multi")) {
            battleId = Number(tabInfo.url?.split("/").slice(-1)[0]);
        } else if (tabInfo.url?.includes("result_multi")) {
            battleId = Number(tabInfo.url?.split("/").slice(-2)[0]);
        }
        if (isGranblueResponse(response)) {
            (globalThis as any).reponses = (globalThis as any).reponses || [];
            (globalThis as any).reponses.push(response);
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

                if (!isNaN(battleId)) {
                    fightData[battleId] = fightData[battleId] ?? {
                        honors: 0,
                    };

                    if (isBattleStatus(data)) {
                        const contribution = data.scenario.find(isContributionScenario);
                        if (contribution) {
                            fightData[battleId].honors += contribution.amount;
                        }
                        fightData[battleId].turnCount = data.status.turn;
                    }

                    if (isFightStart(data)) {
                        battleId = data.raid_id;
                        fightData[battleId].bossData = data.boss?.param;
                        currentUser.id = data.user_id;
                        currentUser.name = data.nickname;
                        storeUser(currentUser);
                    }

                    // If we got reward data
                    if (BattleHasRewards(data)) {
                        normalizeLoot(data, battleId);
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
                }
            } catch {}
        }
    }
};

let attached = false;
type ArrayType<T> = T extends (infer U)[] ? U : T;
let target: ArrayType<Parameters<Parameters<typeof chrome.debugger.getTargets>["0"]>["0"]> | undefined;
// Setup toggle functionality
// chrome.browserAction.onClicked.addListener(() => {
//     if (!attached) {
chrome.debugger.getTargets((targets) => {
    // Get the Granblue Tab
    target = targets.find(
        (target) => target.type === "page" && ["Granblue Fantasy", "グランブルーファンタジー"].includes(target.title)
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
//     } else {
//         if (target) {
//             chrome.debugger.detach({ tabId: target.tabId }, () => (attached = false));
//         }
//     }
// });
