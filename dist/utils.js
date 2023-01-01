"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.safeName = exports.parallel = void 0;
const parallel = (items, handler, concurrency) => {
    if (!Number.isInteger(concurrency) || concurrency < 1)
        throw new Error("concurrency must be a positive integer greater than 0");
    if (items.length === 0)
        return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const results = [];
        let i = 0;
        const next = (result) => {
            results.push(result);
            if (i < items.length) {
                try {
                    handler(items[i++]).then(next).catch(reject);
                }
                catch (error) {
                    reject(error);
                }
            }
            else if (results.length === items.length)
                resolve(results);
        };
        for (let x = 0; x < Math.min(concurrency, items.length); x++) {
            try {
                handler(items[i++]).then(next).catch(reject);
            }
            catch (error) {
                reject(error);
                break;
            }
        }
    });
};
exports.parallel = parallel;
const safeName = (name) => {
    return (String(name)
        // eslint-disable-next-line regexp/no-obscure-range
        .replace(/[^A-z\d]/g, "-")
        .slice(0, 64));
};
exports.safeName = safeName;
const getDeepVal = (object, path, defaultValue = undefined) => {
    if (typeof object === "undefined" || object === null)
        return defaultValue;
    const pathArray = path.split(/\.|\[["']?|["']?\]/);
    for (let i = 0, l = pathArray.length; i < l; i++) {
        if (pathArray[i] === "")
            continue;
        object = object[pathArray[i]];
        if (typeof object === "undefined" || object === null)
            return defaultValue;
    }
    return typeof object === "undefined" || object === null ? defaultValue : object;
};
const format = (string, args, replacer) => {
    const useReplacer = typeof replacer === "function";
    return String(string).replace(/\{([^}]+)\}/g, (m, key) => {
        // @ts-ignore
        let val = getDeepVal(args, key, useReplacer ? null : m);
        if (useReplacer)
            val = replacer(val, key, m, args);
        return val;
    });
};
exports.format = format;
