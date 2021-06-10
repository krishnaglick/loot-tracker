define("response-types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BattleHasRewards = exports.RaidCompleteData = exports.isBattleUserData = exports.isUserData = exports.isQuestComplete = exports.isFightStart = exports.isGranblueResponse = void 0;
    function isGranblueResponse(v) {
        return (v?.hasOwnProperty("base64Encoded") &&
            v.base64Encoded === false &&
            v.hasOwnProperty("body") &&
            typeof v.body === "string");
    }
    exports.isGranblueResponse = isGranblueResponse;
    function isFightStart(v) {
        return (v?.hasOwnProperty("treasure") &&
            v?.hasOwnProperty("quest_id") &&
            v?.hasOwnProperty("raid_id") &&
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
        4: "MVP",
        11: "Host",
        13: "Blue",
    };
    function normalizeLoot(battleData) {
        const raw = [];
        console.log("Normalizing loot: ", battleData);
        const timestamp = Date.now(); // TODO: Build server to set this on incoming
        Object.entries(battleData.rewards.reward_list).forEach(([chestType, chests]) => {
            Object.entries(chests).forEach(([chestId, chestContents]) => {
                // Normalize data
                raw.push({
                    ...chestContents,
                    chestId,
                    chestType,
                    chestTypeName: chestMap[chestType],
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
    function haveRequestId(v) {
        return !!(v && v.hasOwnProperty("requestId"));
    }
    const allEventHandler = ({ tabId }, message, params) => {
        if (message == "Network.responseReceived" && haveRequestId(params)) {
            // This lets us get the response data from the intercepted request
            chrome.debugger.sendCommand({
                tabId,
            }, "Network.getResponseBody", {
                requestId: params.requestId,
            }, (response) => {
                // There's a lotta data coming across, some we don't care about.
                if (response_types_1.isGranblueResponse(response)) {
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
                        // If we got reward data
                        if (response_types_1.BattleHasRewards(data)) {
                            normalizeLoot(data);
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
                    catch { }
                }
            });
        }
    };
    let attached = false;
    let target;
    // Setup toggle functionality
    chrome.browserAction.onClicked.addListener(() => {
        if (!attached) {
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
        }
        else {
            if (target) {
                chrome.debugger.detach({ tabId: target.tabId }, () => (attached = false));
            }
        }
    });
});
