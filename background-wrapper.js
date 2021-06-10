try {
    var exports = {};
    var define = (_, __, f) => f(null, exports, exports);
    importScripts("background.js");
} catch (e) {
    console.error(e);
}
