// chrome.webRequest.onCompleted.addListener(
//     function (details) {
//         console.log("asdf resource", details);
//     },
//     { urls: ["<all_urls>"] }
// );

// let currentTab;

let currentUser;
let currentFight;

const chestMap = {
    2: "Silver",
    3: "Gold",
    4: "Blue",
    11: "MVP",
    13: "Host",
};

function allEventHandler({ tabId }, message, params) {
    if (message == "Network.responseReceived") {
        //response return
        chrome.debugger.sendCommand(
            {
                tabId: tabId,
            },
            "Network.getResponseBody",
            {
                requestId: params.requestId,
            },
            (response) => {
                if (response && !response.base64Encoded && response.body) {
                    try {
                        const data = JSON.parse(response.body);
                        if (data && data.token && data.id && data.nickname) {
                            currentUser = data;
                        }
                        if (data && data.chapter_name) {
                            currentFight = data.chapter_name;
                        }
                        console.log("Data: ", data);
                        if (data && data.rewards && data.rewards.reward_list) {
                            if ((currentUser && data.values.pc_levelup.name === currentUser.nickname) || true) {
                                fetch(`https://drop-data-67126-default-rtdb.firebaseio.com/drop-data.json`, {
                                    body: JSON.stringify({
                                        [currentUser.id + "-" + Date.now()]: { ...data, fightName: currentFight },
                                    }),
                                    headers: { "Content-Type": "application/json" },
                                    method: "PATCH",
                                });
                                Object.entries(data.rewards.reward_list).forEach(([chestNumber, chestContents]) => {
                                    if (Object.values(chestContents).length) {
                                        console.log(
                                            `Received ${Object.values(chestContents)
                                                .map((contents) => `${contents.count} ${contents.name}`)
                                                .join(", ")} from ${chestMap[chestNumber]} Chest(s)`
                                        );
                                    }
                                });
                                Object.entries(data.rewards.auto_recycling_weapon_list).forEach(
                                    ([chestNumber, chestContents]) => {
                                        if (Object.values(chestContents).length) {
                                            console.log(
                                                `Reserved ${Object.values(chestContents)
                                                    .map((contents) => `${contents.count} ${contents.name}`)
                                                    .join(", ")} from ${chestMap[chestNumber]} Chest(s)`
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    } catch {}
                }
            }
        );
    }
}

let attached = false;
let target;
chrome.browserAction.onClicked.addListener(() => {
    if (!attached) {
        chrome.debugger.getTargets((targets) => {
            target = targets.find((target) => target.type === "page" && target.title === "Granblue Fantasy");
            if (target) {
                chrome.debugger.attach({ tabId: target.tabId }, "1.0", () => {
                    chrome.debugger.sendCommand({ tabId: target.tabId }, "Network.enable");
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
