define("response-types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isQuestStart = exports.isBattleStatus = exports.isContributionScenario = exports.BattleHasRewards = exports.RaidCompleteData = exports.isBattleUserData = exports.isUserData = exports.isQuestComplete = exports.isFightStart = exports.isGranblueResponse = void 0;
    function isGranblueResponse(v) {
        return (v?.hasOwnProperty("base64Encoded") &&
            v.base64Encoded === false &&
            v.hasOwnProperty("body") &&
            typeof v.body === "string");
    }
    exports.isGranblueResponse = isGranblueResponse;
    function isFightStart(v) {
        return (v?.hasOwnProperty("boss") &&
            v?.hasOwnProperty("raid_id") &&
            v?.hasOwnProperty("user_id") &&
            v?.hasOwnProperty("nickname"));
    }
    exports.isFightStart = isFightStart;
    function isQuestComplete(v) {
        return !!(v && v.rewards?.reward_list && v.appearance.title && v.appearance.quest_name);
    }
    exports.isQuestComplete = isQuestComplete;
    function isUserData(v) {
        return !!(v && v.nickname && v.id);
    }
    exports.isUserData = isUserData;
    function isBattleUserData(v) {
        return !!(v && v.nickname && v.user_id);
    }
    exports.isBattleUserData = isBattleUserData;
    function RaidCompleteData(v) {
        return !!(v && v.rewards?.reward_list && v.appearance === null);
    }
    exports.RaidCompleteData = RaidCompleteData;
    function BattleHasRewards(v) {
        return !!v?.rewards?.reward_list;
    }
    exports.BattleHasRewards = BattleHasRewards;
    function isContributionScenario(v) {
        return v?.cmd === "contribution";
    }
    exports.isContributionScenario = isContributionScenario;
    function isBattleStatus(v) {
        return v && Array.isArray(v.scenario) && v.status?.turn;
    }
    exports.isBattleStatus = isBattleStatus;
    function isQuestStart(v) {
        return v && v.chapter_name;
    }
    exports.isQuestStart = isQuestStart;
});
define("background", ["require", "exports", "response-types"], function (require, exports, response_types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const currentUser = {};
    const storeUser = (user) => chrome.storage.sync.set({ user });
    chrome.storage.sync.get(["user"], ({ user }) => {
        if (user?.name || user?.id) {
            currentUser.name = user.name;
            currentUser.id = user.id;
        }
    });
    const chestMap = {
        1: "Wooden",
        2: "Silver",
        3: "Gold",
        4: "Red",
        11: "Blue",
        13: "Purple",
    };
    const fightData = {};
    globalThis.fightData = fightData;
    globalThis.traverseObject = (object, value) => {
        Object.entries(object).forEach(([k, v]) => {
            if (v === value) {
                console.log("Found!: ", k, v);
            }
            else {
                if (typeof v === "object") {
                    globalThis.traverseObject(v, value);
                }
            }
        });
    };
    function normalizeLoot(battleData, battleId) {
        const lootData = [];
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
        }
        catch (err) {
            console.error(err);
        }
    }
    function haveRequestId(v) {
        return !!(v && v.hasOwnProperty("requestId"));
    }
    const getRequestData = (tabId, requestId) => Promise.all([
        new Promise((res) => chrome.debugger.sendCommand({
            tabId,
        }, "Network.getResponseBody", {
            requestId: requestId,
        }, res)),
        new Promise((res) => chrome.tabs.get(tabId, res)),
    ]);
    const allEventHandler = async (source, message, params) => {
        const { tabId } = source;
        if (message == "Network.responseReceived" && haveRequestId(params)) {
            // This lets us get the response data from the intercepted request
            const [response, tabInfo] = await getRequestData(tabId ?? 0, params.requestId);
            let battleId = NaN;
            if (tabInfo.url?.includes("raid_multi")) {
                battleId = Number(tabInfo.url?.split("/").slice(-1)[0]);
            }
            else if (tabInfo.url?.includes("result_multi")) {
                battleId = Number(tabInfo.url?.split("/").slice(-2)[0]);
            }
            if (response_types_1.isGranblueResponse(response)) {
                globalThis.reponses = globalThis.reponses || [];
                globalThis.reponses.push(response);
                try {
                    const data = JSON.parse(response.body);
                    console.log("Response Body: ", data);
                    // Save the user for reporting
                    if (response_types_1.isBattleUserData(data)) {
                        currentUser.id = data.user_id;
                        currentUser.name = data.nickname;
                        storeUser(currentUser);
                    }
                    if (response_types_1.isUserData(data)) {
                        currentUser.id = data.id;
                        currentUser.name = data.nickname;
                        storeUser(currentUser);
                    }
                    if (!isNaN(battleId)) {
                        fightData[battleId] = fightData[battleId] ?? {
                            honors: 0,
                        };
                        if (response_types_1.isBattleStatus(data)) {
                            const contribution = data.scenario.find(response_types_1.isContributionScenario);
                            if (contribution) {
                                fightData[battleId].honors += contribution.amount;
                            }
                            fightData[battleId].turnCount = data.status.turn;
                        }
                        if (response_types_1.isFightStart(data)) {
                            battleId = data.raid_id;
                            fightData[battleId].bossData = data.boss?.param;
                            currentUser.id = data.user_id;
                            currentUser.name = data.nickname;
                            storeUser(currentUser);
                        }
                        // If we got reward data
                        if (response_types_1.BattleHasRewards(data)) {
                            normalizeLoot(data, battleId);
                            // Below is some basic chest logging, this isn't what's reported.
                            Object.entries(data.rewards.reward_list).forEach(([chestNumber, chestContents]) => {
                                if (Object.values(chestContents).length) {
                                    console.log(`Received ${Object.values(chestContents)
                                        .map((contents) => `${contents.count} ${contents.name}`)
                                        .join(", ")} from ${chestMap[chestNumber]} Chest(s) - (${chestNumber})`);
                                }
                            });
                            Object.entries(data.rewards.auto_recycling_weapon_list).forEach(([chestNumber, chestContents]) => {
                                if (Object.values(chestContents).length) {
                                    console.log(`Reserved ${Object.values(chestContents)
                                        .map((contents) => `${contents.count} ${contents.name}`)
                                        .join(", ")} from ${chestMap[chestNumber]} Chest(s) - Reserved`);
                                }
                            });
                        }
                    }
                }
                catch { }
            }
        }
    };
    let attached = false;
    let target;
    // Setup toggle functionality
    // chrome.browserAction.onClicked.addListener(() => {
    //     if (!attached) {
    chrome.debugger.getTargets((targets) => {
        // Get the Granblue Tab
        target = targets.find((target) => target.type === "page" && ["Granblue Fantasy", "グランブルーファンタジー"].includes(target.title));
        if (target?.tabId) {
            // Attach the debugger so we can intercept requests
            chrome.debugger.attach({ tabId: target.tabId }, "1.0", () => {
                chrome.debugger.sendCommand({ tabId: target.tabId }, "Network.enable");
                attached = true;
            });
            chrome.debugger.onEvent.addListener(allEventHandler);
        }
    });
});
//     } else {
//         if (target) {
//             chrome.debugger.detach({ tabId: target.tabId }, () => (attached = false));
//         }
//     }
// });
