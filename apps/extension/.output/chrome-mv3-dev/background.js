var background = (function() {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp$1 = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp$1.call(to, key) && key !== except) __defProp$1(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp$1(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	//#region ../../node_modules/.pnpm/wxt@0.20.25_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0_yaml@2.8.3/node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/serialize-error@11.0.3/node_modules/serialize-error/error-constructors.js
	var list = [
		EvalError,
		RangeError,
		ReferenceError,
		SyntaxError,
		TypeError,
		URIError,
		globalThis.DOMException,
		globalThis.AssertionError,
		globalThis.SystemError
	].filter(Boolean).map((constructor) => [constructor.name, constructor]);
	var errorConstructors = new Map(list);
	//#endregion
	//#region ../../node_modules/.pnpm/serialize-error@11.0.3/node_modules/serialize-error/index.js
	var NonError = class NonError extends Error {
		name = "NonError";
		constructor(message) {
			super(NonError._prepareSuperMessage(message));
		}
		static _prepareSuperMessage(message) {
			try {
				return JSON.stringify(message);
			} catch {
				return String(message);
			}
		}
	};
	var commonProperties = [
		{
			property: "name",
			enumerable: false
		},
		{
			property: "message",
			enumerable: false
		},
		{
			property: "stack",
			enumerable: false
		},
		{
			property: "code",
			enumerable: true
		},
		{
			property: "cause",
			enumerable: false
		}
	];
	var toJsonWasCalled = /* @__PURE__ */ new WeakSet();
	var toJSON = (from) => {
		toJsonWasCalled.add(from);
		const json = from.toJSON();
		toJsonWasCalled.delete(from);
		return json;
	};
	var getErrorConstructor = (name) => errorConstructors.get(name) ?? Error;
	var destroyCircular = ({ from, seen, to, forceEnumerable, maxDepth, depth, useToJSON, serialize }) => {
		if (!to) if (Array.isArray(from)) to = [];
		else if (!serialize && isErrorLike(from)) to = new (getErrorConstructor(from.name))();
		else to = {};
		seen.push(from);
		if (depth >= maxDepth) return to;
		if (useToJSON && typeof from.toJSON === "function" && !toJsonWasCalled.has(from)) return toJSON(from);
		const continueDestroyCircular = (value) => destroyCircular({
			from: value,
			seen: [...seen],
			forceEnumerable,
			maxDepth,
			depth,
			useToJSON,
			serialize
		});
		for (const [key, value] of Object.entries(from)) {
			if (value && value instanceof Uint8Array && value.constructor.name === "Buffer") {
				to[key] = "[object Buffer]";
				continue;
			}
			if (value !== null && typeof value === "object" && typeof value.pipe === "function") {
				to[key] = "[object Stream]";
				continue;
			}
			if (typeof value === "function") continue;
			if (!value || typeof value !== "object") {
				try {
					to[key] = value;
				} catch {}
				continue;
			}
			if (!seen.includes(from[key])) {
				depth++;
				to[key] = continueDestroyCircular(from[key]);
				continue;
			}
			to[key] = "[Circular]";
		}
		for (const { property, enumerable } of commonProperties) if (typeof from[property] !== "undefined" && from[property] !== null) Object.defineProperty(to, property, {
			value: isErrorLike(from[property]) ? continueDestroyCircular(from[property]) : from[property],
			enumerable: forceEnumerable ? true : enumerable,
			configurable: true,
			writable: true
		});
		return to;
	};
	function serializeError(value, options = {}) {
		const { maxDepth = Number.POSITIVE_INFINITY, useToJSON = true } = options;
		if (typeof value === "object" && value !== null) return destroyCircular({
			from: value,
			seen: [],
			forceEnumerable: true,
			maxDepth,
			depth: 0,
			useToJSON,
			serialize: true
		});
		if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
		return value;
	}
	function deserializeError(value, options = {}) {
		const { maxDepth = Number.POSITIVE_INFINITY } = options;
		if (value instanceof Error) return value;
		if (isMinimumViableSerializedError(value)) return destroyCircular({
			from: value,
			seen: [],
			to: new (getErrorConstructor(value.name))(),
			maxDepth,
			depth: 0,
			serialize: false
		});
		return new NonError(value);
	}
	function isErrorLike(value) {
		return Boolean(value) && typeof value === "object" && "name" in value && "message" in value && "stack" in value;
	}
	function isMinimumViableSerializedError(value) {
		return Boolean(value) && typeof value === "object" && "message" in value && !Array.isArray(value);
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@webext-core+messaging@2.3.0/node_modules/@webext-core/messaging/lib/chunk-BQLFSFFZ.js
	var __defProp = Object.defineProperty;
	var __defProps = Object.defineProperties;
	var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
	var __getOwnPropSymbols = Object.getOwnPropertySymbols;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __propIsEnum = Object.prototype.propertyIsEnumerable;
	var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
		enumerable: true,
		configurable: true,
		writable: true,
		value
	}) : obj[key] = value;
	var __spreadValues = (a, b) => {
		for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
		if (__getOwnPropSymbols) {
			for (var prop of __getOwnPropSymbols(b)) if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
		}
		return a;
	};
	var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
	var __async = (__this, __arguments, generator) => {
		return new Promise((resolve, reject) => {
			var fulfilled = (value) => {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			};
			var rejected = (value) => {
				try {
					step(generator.throw(value));
				} catch (e) {
					reject(e);
				}
			};
			var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
			step((generator = generator.apply(__this, __arguments)).next());
		});
	};
	function defineGenericMessanging(config) {
		let removeRootListener;
		let perTypeListeners = {};
		function cleanupRootListener() {
			if (Object.entries(perTypeListeners).length === 0) {
				removeRootListener?.();
				removeRootListener = void 0;
			}
		}
		let idSeq = Math.floor(Math.random() * 1e4);
		function getNextId() {
			return idSeq++;
		}
		return {
			sendMessage(type, data, ...args) {
				return __async(this, null, function* () {
					var _a2, _b, _c, _d;
					const _message = {
						id: getNextId(),
						type,
						data,
						timestamp: Date.now()
					};
					const message = (_b = yield (_a2 = config.verifyMessageData) == null ? void 0 : _a2.call(config, _message)) != null ? _b : _message;
					(_c = config.logger) == null || _c.debug(`[messaging] sendMessage {id=${message.id}} \u2500\u1405`, message, ...args);
					const response = yield config.sendMessage(message, ...args);
					const { res, err } = response != null ? response : { err: /* @__PURE__ */ new Error("No response") };
					(_d = config.logger) == null || _d.debug(`[messaging] sendMessage {id=${message.id}} \u140A\u2500`, {
						res,
						err
					});
					if (err != null) throw deserializeError(err);
					return res;
				});
			},
			onMessage(type, onReceived) {
				var _a2, _b, _c;
				if (removeRootListener == null) {
					(_a2 = config.logger) == null || _a2.debug(`[messaging] "${type}" initialized the message listener for this context`);
					removeRootListener = config.addRootListener((message) => {
						var _a3, _b2;
						if (typeof message.type != "string" || typeof message.timestamp !== "number") {
							if (config.breakError) return;
							const err = Error(`[messaging] Unknown message format, must include the 'type' & 'timestamp' fields, received: ${JSON.stringify(message)}`);
							(_a3 = config.logger) == null || _a3.error(err);
							throw err;
						}
						(_b2 = config == null ? void 0 : config.logger) == null || _b2.debug("[messaging] Received message", message);
						const listener = perTypeListeners[message.type];
						if (listener == null) return;
						const res = listener(message);
						return Promise.resolve(res).then((res2) => {
							var _a4, _b3;
							return (_b3 = (_a4 = config.verifyMessageData) == null ? void 0 : _a4.call(config, res2)) != null ? _b3 : res2;
						}).then((res2) => {
							var _a4;
							(_a4 = config == null ? void 0 : config.logger) == null || _a4.debug(`[messaging] onMessage {id=${message.id}} \u2500\u1405`, { res: res2 });
							return { res: res2 };
						}).catch((err) => {
							var _a4;
							(_a4 = config == null ? void 0 : config.logger) == null || _a4.debug(`[messaging] onMessage {id=${message.id}} \u2500\u1405`, { err });
							return { err: serializeError(err) };
						});
					});
				}
				if (perTypeListeners[type] != null) {
					const err = Error(`[messaging] In this JS context, only one listener can be setup for ${type}`);
					(_b = config.logger) == null || _b.error(err);
					throw err;
				}
				perTypeListeners[type] = onReceived;
				(_c = config.logger) == null || _c.log(`[messaging] Added listener for ${type}`);
				return () => {
					delete perTypeListeners[type];
					cleanupRootListener();
				};
			},
			removeAllListeners() {
				Object.keys(perTypeListeners).forEach((type) => {
					delete perTypeListeners[type];
				});
				cleanupRootListener();
			}
		};
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@webext-core+messaging@2.3.0/node_modules/@webext-core/messaging/lib/index.js
	var import_browser_polyfill = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		(function(global, factory) {
			if (typeof define === "function" && define.amd) define("webextension-polyfill", ["module"], factory);
			else if (typeof exports !== "undefined") factory(module);
			else {
				var mod = { exports: {} };
				factory(mod);
				global.browser = mod.exports;
			}
		})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports, function(module$1) {
			"use strict";
			if (!globalThis.chrome?.runtime?.id) throw new Error("This script should only be loaded in a browser extension.");
			if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
				const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
				const wrapAPIs = (extensionAPIs) => {
					const apiMetadata = {
						"alarms": {
							"clear": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"clearAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"get": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"getAll": {
								"minArgs": 0,
								"maxArgs": 0
							}
						},
						"bookmarks": {
							"create": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"get": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getChildren": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getRecent": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getSubTree": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getTree": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"move": {
								"minArgs": 2,
								"maxArgs": 2
							},
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeTree": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"search": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"update": {
								"minArgs": 2,
								"maxArgs": 2
							}
						},
						"browserAction": {
							"disable": {
								"minArgs": 0,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"enable": {
								"minArgs": 0,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"getBadgeBackgroundColor": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getBadgeText": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getPopup": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getTitle": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"openPopup": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"setBadgeBackgroundColor": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"setBadgeText": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"setIcon": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"setPopup": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"setTitle": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							}
						},
						"browsingData": {
							"remove": {
								"minArgs": 2,
								"maxArgs": 2
							},
							"removeCache": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeCookies": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeDownloads": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeFormData": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeHistory": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeLocalStorage": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removePasswords": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removePluginData": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"settings": {
								"minArgs": 0,
								"maxArgs": 0
							}
						},
						"commands": { "getAll": {
							"minArgs": 0,
							"maxArgs": 0
						} },
						"contextMenus": {
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"update": {
								"minArgs": 2,
								"maxArgs": 2
							}
						},
						"cookies": {
							"get": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getAll": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getAllCookieStores": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"set": {
								"minArgs": 1,
								"maxArgs": 1
							}
						},
						"devtools": {
							"inspectedWindow": { "eval": {
								"minArgs": 1,
								"maxArgs": 2,
								"singleCallbackArg": false
							} },
							"panels": {
								"create": {
									"minArgs": 3,
									"maxArgs": 3,
									"singleCallbackArg": true
								},
								"elements": { "createSidebarPane": {
									"minArgs": 1,
									"maxArgs": 1
								} }
							}
						},
						"downloads": {
							"cancel": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"download": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"erase": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getFileIcon": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"open": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"pause": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeFile": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"resume": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"search": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"show": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							}
						},
						"extension": {
							"isAllowedFileSchemeAccess": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"isAllowedIncognitoAccess": {
								"minArgs": 0,
								"maxArgs": 0
							}
						},
						"history": {
							"addUrl": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"deleteAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"deleteRange": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"deleteUrl": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getVisits": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"search": {
								"minArgs": 1,
								"maxArgs": 1
							}
						},
						"i18n": {
							"detectLanguage": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getAcceptLanguages": {
								"minArgs": 0,
								"maxArgs": 0
							}
						},
						"identity": { "launchWebAuthFlow": {
							"minArgs": 1,
							"maxArgs": 1
						} },
						"idle": { "queryState": {
							"minArgs": 1,
							"maxArgs": 1
						} },
						"management": {
							"get": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"getSelf": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"setEnabled": {
								"minArgs": 2,
								"maxArgs": 2
							},
							"uninstallSelf": {
								"minArgs": 0,
								"maxArgs": 1
							}
						},
						"notifications": {
							"clear": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"create": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"getAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"getPermissionLevel": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"update": {
								"minArgs": 2,
								"maxArgs": 2
							}
						},
						"pageAction": {
							"getPopup": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getTitle": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"hide": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"setIcon": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"setPopup": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"setTitle": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							},
							"show": {
								"minArgs": 1,
								"maxArgs": 1,
								"fallbackToNoCallback": true
							}
						},
						"permissions": {
							"contains": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getAll": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"request": {
								"minArgs": 1,
								"maxArgs": 1
							}
						},
						"runtime": {
							"getBackgroundPage": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"getPlatformInfo": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"openOptionsPage": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"requestUpdateCheck": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"sendMessage": {
								"minArgs": 1,
								"maxArgs": 3
							},
							"sendNativeMessage": {
								"minArgs": 2,
								"maxArgs": 2
							},
							"setUninstallURL": {
								"minArgs": 1,
								"maxArgs": 1
							}
						},
						"sessions": {
							"getDevices": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"getRecentlyClosed": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"restore": {
								"minArgs": 0,
								"maxArgs": 1
							}
						},
						"storage": {
							"local": {
								"clear": {
									"minArgs": 0,
									"maxArgs": 0
								},
								"get": {
									"minArgs": 0,
									"maxArgs": 1
								},
								"getBytesInUse": {
									"minArgs": 0,
									"maxArgs": 1
								},
								"remove": {
									"minArgs": 1,
									"maxArgs": 1
								},
								"set": {
									"minArgs": 1,
									"maxArgs": 1
								}
							},
							"managed": {
								"get": {
									"minArgs": 0,
									"maxArgs": 1
								},
								"getBytesInUse": {
									"minArgs": 0,
									"maxArgs": 1
								}
							},
							"sync": {
								"clear": {
									"minArgs": 0,
									"maxArgs": 0
								},
								"get": {
									"minArgs": 0,
									"maxArgs": 1
								},
								"getBytesInUse": {
									"minArgs": 0,
									"maxArgs": 1
								},
								"remove": {
									"minArgs": 1,
									"maxArgs": 1
								},
								"set": {
									"minArgs": 1,
									"maxArgs": 1
								}
							}
						},
						"tabs": {
							"captureVisibleTab": {
								"minArgs": 0,
								"maxArgs": 2
							},
							"create": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"detectLanguage": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"discard": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"duplicate": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"executeScript": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"get": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getCurrent": {
								"minArgs": 0,
								"maxArgs": 0
							},
							"getZoom": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"getZoomSettings": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"goBack": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"goForward": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"highlight": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"insertCSS": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"move": {
								"minArgs": 2,
								"maxArgs": 2
							},
							"query": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"reload": {
								"minArgs": 0,
								"maxArgs": 2
							},
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"removeCSS": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"sendMessage": {
								"minArgs": 2,
								"maxArgs": 3
							},
							"setZoom": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"setZoomSettings": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"update": {
								"minArgs": 1,
								"maxArgs": 2
							}
						},
						"topSites": { "get": {
							"minArgs": 0,
							"maxArgs": 0
						} },
						"webNavigation": {
							"getAllFrames": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"getFrame": {
								"minArgs": 1,
								"maxArgs": 1
							}
						},
						"webRequest": { "handlerBehaviorChanged": {
							"minArgs": 0,
							"maxArgs": 0
						} },
						"windows": {
							"create": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"get": {
								"minArgs": 1,
								"maxArgs": 2
							},
							"getAll": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"getCurrent": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"getLastFocused": {
								"minArgs": 0,
								"maxArgs": 1
							},
							"remove": {
								"minArgs": 1,
								"maxArgs": 1
							},
							"update": {
								"minArgs": 2,
								"maxArgs": 2
							}
						}
					};
					if (Object.keys(apiMetadata).length === 0) throw new Error("api-metadata.json has not been included in browser-polyfill");
					/**
					* A WeakMap subclass which creates and stores a value for any key which does
					* not exist when accessed, but behaves exactly as an ordinary WeakMap
					* otherwise.
					*
					* @param {function} createItem
					*        A function which will be called in order to create the value for any
					*        key which does not exist, the first time it is accessed. The
					*        function receives, as its only argument, the key being created.
					*/
					class DefaultWeakMap extends WeakMap {
						constructor(createItem, items = void 0) {
							super(items);
							this.createItem = createItem;
						}
						get(key) {
							if (!this.has(key)) this.set(key, this.createItem(key));
							return super.get(key);
						}
					}
					/**
					* Returns true if the given object is an object with a `then` method, and can
					* therefore be assumed to behave as a Promise.
					*
					* @param {*} value The value to test.
					* @returns {boolean} True if the value is thenable.
					*/
					const isThenable = (value) => {
						return value && typeof value === "object" && typeof value.then === "function";
					};
					/**
					* Creates and returns a function which, when called, will resolve or reject
					* the given promise based on how it is called:
					*
					* - If, when called, `chrome.runtime.lastError` contains a non-null object,
					*   the promise is rejected with that value.
					* - If the function is called with exactly one argument, the promise is
					*   resolved to that value.
					* - Otherwise, the promise is resolved to an array containing all of the
					*   function's arguments.
					*
					* @param {object} promise
					*        An object containing the resolution and rejection functions of a
					*        promise.
					* @param {function} promise.resolve
					*        The promise's resolution function.
					* @param {function} promise.reject
					*        The promise's rejection function.
					* @param {object} metadata
					*        Metadata about the wrapped method which has created the callback.
					* @param {boolean} metadata.singleCallbackArg
					*        Whether or not the promise is resolved with only the first
					*        argument of the callback, alternatively an array of all the
					*        callback arguments is resolved. By default, if the callback
					*        function is invoked with only a single argument, that will be
					*        resolved to the promise, while all arguments will be resolved as
					*        an array if multiple are given.
					*
					* @returns {function}
					*        The generated callback function.
					*/
					const makeCallback = (promise, metadata) => {
						return (...callbackArgs) => {
							if (extensionAPIs.runtime.lastError) promise.reject(new Error(extensionAPIs.runtime.lastError.message));
							else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) promise.resolve(callbackArgs[0]);
							else promise.resolve(callbackArgs);
						};
					};
					const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
					/**
					* Creates a wrapper function for a method with the given name and metadata.
					*
					* @param {string} name
					*        The name of the method which is being wrapped.
					* @param {object} metadata
					*        Metadata about the method being wrapped.
					* @param {integer} metadata.minArgs
					*        The minimum number of arguments which must be passed to the
					*        function. If called with fewer than this number of arguments, the
					*        wrapper will raise an exception.
					* @param {integer} metadata.maxArgs
					*        The maximum number of arguments which may be passed to the
					*        function. If called with more than this number of arguments, the
					*        wrapper will raise an exception.
					* @param {boolean} metadata.singleCallbackArg
					*        Whether or not the promise is resolved with only the first
					*        argument of the callback, alternatively an array of all the
					*        callback arguments is resolved. By default, if the callback
					*        function is invoked with only a single argument, that will be
					*        resolved to the promise, while all arguments will be resolved as
					*        an array if multiple are given.
					*
					* @returns {function(object, ...*)}
					*       The generated wrapper function.
					*/
					const wrapAsyncFunction = (name, metadata) => {
						return function asyncFunctionWrapper(target, ...args) {
							if (args.length < metadata.minArgs) throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
							if (args.length > metadata.maxArgs) throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
							return new Promise((resolve, reject) => {
								if (metadata.fallbackToNoCallback) try {
									target[name](...args, makeCallback({
										resolve,
										reject
									}, metadata));
								} catch (cbError) {
									console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
									target[name](...args);
									metadata.fallbackToNoCallback = false;
									metadata.noCallback = true;
									resolve();
								}
								else if (metadata.noCallback) {
									target[name](...args);
									resolve();
								} else target[name](...args, makeCallback({
									resolve,
									reject
								}, metadata));
							});
						};
					};
					/**
					* Wraps an existing method of the target object, so that calls to it are
					* intercepted by the given wrapper function. The wrapper function receives,
					* as its first argument, the original `target` object, followed by each of
					* the arguments passed to the original method.
					*
					* @param {object} target
					*        The original target object that the wrapped method belongs to.
					* @param {function} method
					*        The method being wrapped. This is used as the target of the Proxy
					*        object which is created to wrap the method.
					* @param {function} wrapper
					*        The wrapper function which is called in place of a direct invocation
					*        of the wrapped method.
					*
					* @returns {Proxy<function>}
					*        A Proxy object for the given method, which invokes the given wrapper
					*        method in its place.
					*/
					const wrapMethod = (target, method, wrapper) => {
						return new Proxy(method, { apply(targetMethod, thisObj, args) {
							return wrapper.call(thisObj, target, ...args);
						} });
					};
					let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
					/**
					* Wraps an object in a Proxy which intercepts and wraps certain methods
					* based on the given `wrappers` and `metadata` objects.
					*
					* @param {object} target
					*        The target object to wrap.
					*
					* @param {object} [wrappers = {}]
					*        An object tree containing wrapper functions for special cases. Any
					*        function present in this object tree is called in place of the
					*        method in the same location in the `target` object tree. These
					*        wrapper methods are invoked as described in {@see wrapMethod}.
					*
					* @param {object} [metadata = {}]
					*        An object tree containing metadata used to automatically generate
					*        Promise-based wrapper functions for asynchronous. Any function in
					*        the `target` object tree which has a corresponding metadata object
					*        in the same location in the `metadata` tree is replaced with an
					*        automatically-generated wrapper function, as described in
					*        {@see wrapAsyncFunction}
					*
					* @returns {Proxy<object>}
					*/
					const wrapObject = (target, wrappers = {}, metadata = {}) => {
						let cache = Object.create(null);
						return new Proxy(Object.create(target), {
							has(proxyTarget, prop) {
								return prop in target || prop in cache;
							},
							get(proxyTarget, prop, receiver) {
								if (prop in cache) return cache[prop];
								if (!(prop in target)) return;
								let value = target[prop];
								if (typeof value === "function") if (typeof wrappers[prop] === "function") value = wrapMethod(target, target[prop], wrappers[prop]);
								else if (hasOwnProperty(metadata, prop)) {
									let wrapper = wrapAsyncFunction(prop, metadata[prop]);
									value = wrapMethod(target, target[prop], wrapper);
								} else value = value.bind(target);
								else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) value = wrapObject(value, wrappers[prop], metadata[prop]);
								else if (hasOwnProperty(metadata, "*")) value = wrapObject(value, wrappers[prop], metadata["*"]);
								else {
									Object.defineProperty(cache, prop, {
										configurable: true,
										enumerable: true,
										get() {
											return target[prop];
										},
										set(value) {
											target[prop] = value;
										}
									});
									return value;
								}
								cache[prop] = value;
								return value;
							},
							set(proxyTarget, prop, value, receiver) {
								if (prop in cache) cache[prop] = value;
								else target[prop] = value;
								return true;
							},
							defineProperty(proxyTarget, prop, desc) {
								return Reflect.defineProperty(cache, prop, desc);
							},
							deleteProperty(proxyTarget, prop) {
								return Reflect.deleteProperty(cache, prop);
							}
						});
					};
					/**
					* Creates a set of wrapper functions for an event object, which handles
					* wrapping of listener functions that those messages are passed.
					*
					* A single wrapper is created for each listener function, and stored in a
					* map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
					* retrieve the original wrapper, so that  attempts to remove a
					* previously-added listener work as expected.
					*
					* @param {DefaultWeakMap<function, function>} wrapperMap
					*        A DefaultWeakMap object which will create the appropriate wrapper
					*        for a given listener function when one does not exist, and retrieve
					*        an existing one when it does.
					*
					* @returns {object}
					*/
					const wrapEvent = (wrapperMap) => ({
						addListener(target, listener, ...args) {
							target.addListener(wrapperMap.get(listener), ...args);
						},
						hasListener(target, listener) {
							return target.hasListener(wrapperMap.get(listener));
						},
						removeListener(target, listener) {
							target.removeListener(wrapperMap.get(listener));
						}
					});
					const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
						if (typeof listener !== "function") return listener;
						/**
						* Wraps an onRequestFinished listener function so that it will return a
						* `getContent()` property which returns a `Promise` rather than using a
						* callback API.
						*
						* @param {object} req
						*        The HAR entry object representing the network request.
						*/
						return function onRequestFinished(req) {
							listener(wrapObject(req, {}, { getContent: {
								minArgs: 0,
								maxArgs: 0
							} }));
						};
					});
					const onMessageWrappers = new DefaultWeakMap((listener) => {
						if (typeof listener !== "function") return listener;
						/**
						* Wraps a message listener function so that it may send responses based on
						* its return value, rather than by returning a sentinel value and calling a
						* callback. If the listener function returns a Promise, the response is
						* sent when the promise either resolves or rejects.
						*
						* @param {*} message
						*        The message sent by the other end of the channel.
						* @param {object} sender
						*        Details about the sender of the message.
						* @param {function(*)} sendResponse
						*        A callback which, when called with an arbitrary argument, sends
						*        that value as a response.
						* @returns {boolean}
						*        True if the wrapped listener returned a Promise, which will later
						*        yield a response. False otherwise.
						*/
						return function onMessage(message, sender, sendResponse) {
							let didCallSendResponse = false;
							let wrappedSendResponse;
							let sendResponsePromise = new Promise((resolve) => {
								wrappedSendResponse = function(response) {
									didCallSendResponse = true;
									resolve(response);
								};
							});
							let result;
							try {
								result = listener(message, sender, wrappedSendResponse);
							} catch (err) {
								result = Promise.reject(err);
							}
							const isResultThenable = result !== true && isThenable(result);
							if (result !== true && !isResultThenable && !didCallSendResponse) return false;
							const sendPromisedResult = (promise) => {
								promise.then((msg) => {
									sendResponse(msg);
								}, (error) => {
									let message;
									if (error && (error instanceof Error || typeof error.message === "string")) message = error.message;
									else message = "An unexpected error occurred";
									sendResponse({
										__mozWebExtensionPolyfillReject__: true,
										message
									});
								}).catch((err) => {
									console.error("Failed to send onMessage rejected reply", err);
								});
							};
							if (isResultThenable) sendPromisedResult(result);
							else sendPromisedResult(sendResponsePromise);
							return true;
						};
					});
					const wrappedSendMessageCallback = ({ reject, resolve }, reply) => {
						if (extensionAPIs.runtime.lastError) if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) resolve();
						else reject(new Error(extensionAPIs.runtime.lastError.message));
						else if (reply && reply.__mozWebExtensionPolyfillReject__) reject(new Error(reply.message));
						else resolve(reply);
					};
					const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
						if (args.length < metadata.minArgs) throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
						if (args.length > metadata.maxArgs) throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
						return new Promise((resolve, reject) => {
							const wrappedCb = wrappedSendMessageCallback.bind(null, {
								resolve,
								reject
							});
							args.push(wrappedCb);
							apiNamespaceObj.sendMessage(...args);
						});
					};
					const staticWrappers = {
						devtools: { network: { onRequestFinished: wrapEvent(onRequestFinishedWrappers) } },
						runtime: {
							onMessage: wrapEvent(onMessageWrappers),
							onMessageExternal: wrapEvent(onMessageWrappers),
							sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
								minArgs: 1,
								maxArgs: 3
							})
						},
						tabs: { sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
							minArgs: 2,
							maxArgs: 3
						}) }
					};
					const settingMetadata = {
						clear: {
							minArgs: 1,
							maxArgs: 1
						},
						get: {
							minArgs: 1,
							maxArgs: 1
						},
						set: {
							minArgs: 1,
							maxArgs: 1
						}
					};
					apiMetadata.privacy = {
						network: { "*": settingMetadata },
						services: { "*": settingMetadata },
						websites: { "*": settingMetadata }
					};
					return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
				};
				module$1.exports = wrapAPIs(chrome);
			} else module$1.exports = globalThis.browser;
		});
	})))(), 1);
	function defineExtensionMessaging(config) {
		return defineGenericMessanging(__spreadProps(__spreadValues({}, config), {
			sendMessage(message, arg) {
				if (arg == null) return import_browser_polyfill.default.runtime.sendMessage(message);
				const options = typeof arg === "number" ? { tabId: arg } : arg;
				return import_browser_polyfill.default.tabs.sendMessage(options.tabId, message, options.frameId != null ? { frameId: options.frameId } : void 0);
			},
			addRootListener(processMessage) {
				const listener = (message, sender) => {
					if (typeof message === "object") return processMessage(__spreadProps(__spreadValues({}, message), { sender }));
					else return processMessage(message);
				};
				import_browser_polyfill.default.runtime.onMessage.addListener(listener);
				return () => import_browser_polyfill.default.runtime.onMessage.removeListener(listener);
			}
		}));
	}
	//#endregion
	//#region utils/messaging.ts
	var { sendMessage, onMessage } = defineExtensionMessaging();
	//#endregion
	//#region utils/web-host.ts
	function webHost() {
		return ({
			"BASE_URL": "/",
			"BROWSER": "chrome",
			"CHROME": true,
			"COMMAND": "serve",
			"DEV": true,
			"EDGE": false,
			"ENTRYPOINT": "background",
			"FIREFOX": false,
			"MANIFEST_VERSION": 3,
			"MODE": "development",
			"OPERA": false,
			"PROD": false,
			"SAFARI": false,
			"SSR": false,
			"WXT_PUBLIC_LOCKER_WEB_HOST": "https://locker.dev"
		}.WXT_PUBLIC_LOCKER_WEB_HOST ?? "http://localhost:3000").replace(/\/$/, "");
	}
	//#endregion
	//#region utils/api.ts
	var TrpcError = class extends Error {
		constructor(message, status) {
			super(message);
			this.status = status;
		}
	};
	function buildHeaders(opts) {
		const h = { "Content-Type": "application/json" };
		if (opts.workspaceSlug) h["x-workspace-slug"] = opts.workspaceSlug;
		return h;
	}
	function unwrapBatch(body) {
		if (!Array.isArray(body)) throw new TrpcError("Malformed tRPC response", 0);
		const entry = body[0];
		if (!entry) throw new TrpcError("Empty tRPC batch response", 0);
		if (entry.error) throw new TrpcError(entry.error.json?.message ?? entry.error.message ?? "tRPC error", 0);
		if (!entry.result?.data) throw new TrpcError("Missing tRPC result", 0);
		return entry.result.data.json;
	}
	async function trpcQuery(path, input, opts = {}) {
		const url = new URL(`${webHost()}/api/trpc/${path}`);
		url.searchParams.set("batch", "1");
		url.searchParams.set("input", JSON.stringify({ "0": { json: input } }));
		const res = await fetch(url.toString(), {
			method: "GET",
			credentials: "include",
			headers: buildHeaders(opts),
			signal: opts.signal
		});
		if (res.status === 401) throw new TrpcError("Not signed in", 401);
		if (!res.ok) throw new TrpcError(`tRPC ${path} failed: ${res.status}`, res.status);
		return unwrapBatch(await res.json());
	}
	async function trpcMutation(path, input, opts = {}) {
		const url = `${webHost()}/api/trpc/${path}?batch=1`;
		const res = await fetch(url, {
			method: "POST",
			credentials: "include",
			headers: buildHeaders(opts),
			body: JSON.stringify({ "0": { json: input } }),
			signal: opts.signal
		});
		if (res.status === 401) throw new TrpcError("Not signed in", 401);
		if (!res.ok) throw new TrpcError(`tRPC ${path} failed: ${res.status}`, res.status);
		return unwrapBatch(await res.json());
	}
	async function probeSession() {
		const res = await fetch(`${webHost()}/api/auth/get-session`, {
			method: "GET",
			credentials: "include"
		});
		if (!res.ok) return false;
		return !!(await res.json().catch(() => null))?.user?.id;
	}
	async function downloadAsBlob(url, signal) {
		const res = await fetch(url, {
			credentials: "include",
			signal
		});
		if (!res.ok) throw new Error(`Download failed: ${res.status}`);
		return res.blob();
	}
	async function blobToBase64(blob) {
		const buf = await blob.arrayBuffer();
		const bytes = new Uint8Array(buf);
		let binary = "";
		const chunk = 32768;
		for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
		return btoa(binary);
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@wxt-dev+browser@0.1.40/node_modules/@wxt-dev/browser/src/index.mjs
	var browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region ../../node_modules/.pnpm/async-mutex@0.5.0/node_modules/async-mutex/index.mjs
	var E_CANCELED = /* @__PURE__ */ new Error("request for lock canceled");
	var __awaiter$2 = function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var Semaphore = class {
		constructor(_value, _cancelError = E_CANCELED) {
			this._value = _value;
			this._cancelError = _cancelError;
			this._queue = [];
			this._weightedWaiters = [];
		}
		acquire(weight = 1, priority = 0) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			return new Promise((resolve, reject) => {
				const task = {
					resolve,
					reject,
					weight,
					priority
				};
				const i = findIndexFromEnd(this._queue, (other) => priority <= other.priority);
				if (i === -1 && weight <= this._value) this._dispatchItem(task);
				else this._queue.splice(i + 1, 0, task);
			});
		}
		runExclusive(callback_1) {
			return __awaiter$2(this, arguments, void 0, function* (callback, weight = 1, priority = 0) {
				const [value, release] = yield this.acquire(weight, priority);
				try {
					return yield callback(value);
				} finally {
					release();
				}
			});
		}
		waitForUnlock(weight = 1, priority = 0) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			if (this._couldLockImmediately(weight, priority)) return Promise.resolve();
			else return new Promise((resolve) => {
				if (!this._weightedWaiters[weight - 1]) this._weightedWaiters[weight - 1] = [];
				insertSorted(this._weightedWaiters[weight - 1], {
					resolve,
					priority
				});
			});
		}
		isLocked() {
			return this._value <= 0;
		}
		getValue() {
			return this._value;
		}
		setValue(value) {
			this._value = value;
			this._dispatchQueue();
		}
		release(weight = 1) {
			if (weight <= 0) throw new Error(`invalid weight ${weight}: must be positive`);
			this._value += weight;
			this._dispatchQueue();
		}
		cancel() {
			this._queue.forEach((entry) => entry.reject(this._cancelError));
			this._queue = [];
		}
		_dispatchQueue() {
			this._drainUnlockWaiters();
			while (this._queue.length > 0 && this._queue[0].weight <= this._value) {
				this._dispatchItem(this._queue.shift());
				this._drainUnlockWaiters();
			}
		}
		_dispatchItem(item) {
			const previousValue = this._value;
			this._value -= item.weight;
			item.resolve([previousValue, this._newReleaser(item.weight)]);
		}
		_newReleaser(weight) {
			let called = false;
			return () => {
				if (called) return;
				called = true;
				this.release(weight);
			};
		}
		_drainUnlockWaiters() {
			if (this._queue.length === 0) for (let weight = this._value; weight > 0; weight--) {
				const waiters = this._weightedWaiters[weight - 1];
				if (!waiters) continue;
				waiters.forEach((waiter) => waiter.resolve());
				this._weightedWaiters[weight - 1] = [];
			}
			else {
				const queuedPriority = this._queue[0].priority;
				for (let weight = this._value; weight > 0; weight--) {
					const waiters = this._weightedWaiters[weight - 1];
					if (!waiters) continue;
					const i = waiters.findIndex((waiter) => waiter.priority <= queuedPriority);
					(i === -1 ? waiters : waiters.splice(0, i)).forEach(((waiter) => waiter.resolve()));
				}
			}
		}
		_couldLockImmediately(weight, priority) {
			return (this._queue.length === 0 || this._queue[0].priority < priority) && weight <= this._value;
		}
	};
	function insertSorted(a, v) {
		const i = findIndexFromEnd(a, (other) => v.priority <= other.priority);
		a.splice(i + 1, 0, v);
	}
	function findIndexFromEnd(a, predicate) {
		for (let i = a.length - 1; i >= 0; i--) if (predicate(a[i])) return i;
		return -1;
	}
	var __awaiter$1 = function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var Mutex = class {
		constructor(cancelError) {
			this._semaphore = new Semaphore(1, cancelError);
		}
		acquire() {
			return __awaiter$1(this, arguments, void 0, function* (priority = 0) {
				const [, releaser] = yield this._semaphore.acquire(1, priority);
				return releaser;
			});
		}
		runExclusive(callback, priority = 0) {
			return this._semaphore.runExclusive(() => callback(), 1, priority);
		}
		isLocked() {
			return this._semaphore.isLocked();
		}
		waitForUnlock(priority = 0) {
			return this._semaphore.waitForUnlock(1, priority);
		}
		release() {
			if (this._semaphore.isLocked()) this._semaphore.release();
		}
		cancel() {
			return this._semaphore.cancel();
		}
	};
	//#endregion
	//#region ../../node_modules/.pnpm/dequal@2.0.3/node_modules/dequal/lite/index.mjs
	var has = Object.prototype.hasOwnProperty;
	function dequal(foo, bar) {
		var ctor, len;
		if (foo === bar) return true;
		if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
			if (ctor === Date) return foo.getTime() === bar.getTime();
			if (ctor === RegExp) return foo.toString() === bar.toString();
			if (ctor === Array) {
				if ((len = foo.length) === bar.length) while (len-- && dequal(foo[len], bar[len]));
				return len === -1;
			}
			if (!ctor || typeof foo === "object") {
				len = 0;
				for (ctor in foo) {
					if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
					if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
				}
				return Object.keys(bar).length === len;
			}
		}
		return foo !== foo && bar !== bar;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@wxt-dev+storage@1.2.8/node_modules/@wxt-dev/storage/dist/index.mjs
	/**
	* Simplified storage APIs with support for versioned fields, snapshots, metadata, and item definitions.
	*
	* See [the guide](https://wxt.dev/storage.html) for more information.
	* @module @wxt-dev/storage
	*/
	var storage = createStorage();
	function createStorage() {
		const drivers = {
			local: createDriver("local"),
			session: createDriver("session"),
			sync: createDriver("sync"),
			managed: createDriver("managed")
		};
		const getDriver = (area) => {
			const driver = drivers[area];
			if (driver == null) {
				const areaNames = Object.keys(drivers).join(", ");
				throw Error(`Invalid area "${area}". Options: ${areaNames}`);
			}
			return driver;
		};
		const resolveKey = (key) => {
			const deliminatorIndex = key.indexOf(":");
			const driverArea = key.substring(0, deliminatorIndex);
			const driverKey = key.substring(deliminatorIndex + 1);
			if (driverKey == null) throw Error(`Storage key should be in the form of "area:key", but received "${key}"`);
			return {
				driverArea,
				driverKey,
				driver: getDriver(driverArea)
			};
		};
		const getMetaKey = (key) => key + "$";
		const mergeMeta = (oldMeta, newMeta) => {
			const newFields = { ...oldMeta };
			Object.entries(newMeta).forEach(([key, value]) => {
				if (value == null) delete newFields[key];
				else newFields[key] = value;
			});
			return newFields;
		};
		const getValueOrFallback = (value, fallback) => value ?? fallback ?? null;
		const getMetaValue = (properties) => typeof properties === "object" && !Array.isArray(properties) ? properties : {};
		const getItem = async (driver, driverKey, opts) => {
			return getValueOrFallback(await driver.getItem(driverKey), opts?.fallback ?? opts?.defaultValue);
		};
		const getMeta = async (driver, driverKey) => {
			const metaKey = getMetaKey(driverKey);
			return getMetaValue(await driver.getItem(metaKey));
		};
		const setItem = async (driver, driverKey, value) => {
			await driver.setItem(driverKey, value ?? null);
		};
		const setMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			const existingFields = getMetaValue(await driver.getItem(metaKey));
			await driver.setItem(metaKey, mergeMeta(existingFields, properties));
		};
		const removeItem = async (driver, driverKey, opts) => {
			await driver.removeItem(driverKey);
			if (opts?.removeMeta) {
				const metaKey = getMetaKey(driverKey);
				await driver.removeItem(metaKey);
			}
		};
		const removeMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			if (properties == null) await driver.removeItem(metaKey);
			else {
				const newFields = getMetaValue(await driver.getItem(metaKey));
				[properties].flat().forEach((field) => delete newFields[field]);
				await driver.setItem(metaKey, newFields);
			}
		};
		const watch = (driver, driverKey, cb) => driver.watch(driverKey, cb);
		return {
			getItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				return await getItem(driver, driverKey, opts);
			},
			getItems: async (keys) => {
				const areaToKeyMap = /* @__PURE__ */ new Map();
				const keyToOptsMap = /* @__PURE__ */ new Map();
				const orderedKeys = [];
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) {
						keyStr = key.key;
						opts = { fallback: key.fallback };
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					orderedKeys.push(keyStr);
					const { driverArea, driverKey } = resolveKey(keyStr);
					const areaKeys = areaToKeyMap.get(driverArea) ?? [];
					areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
					keyToOptsMap.set(keyStr, opts);
				});
				const resultsMap = /* @__PURE__ */ new Map();
				await Promise.all(Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
					(await drivers[driverArea].getItems(keys)).forEach((driverResult) => {
						const key = `${driverArea}:${driverResult.key}`;
						const opts = keyToOptsMap.get(key);
						const value = getValueOrFallback(driverResult.value, opts?.fallback ?? opts?.defaultValue);
						resultsMap.set(key, value);
					});
				}));
				return orderedKeys.map((key) => ({
					key,
					value: resultsMap.get(key)
				}));
			},
			getMeta: async (key) => {
				const { driver, driverKey } = resolveKey(key);
				return await getMeta(driver, driverKey);
			},
			getMetas: async (args) => {
				const keys = args.map((arg) => {
					const key = typeof arg === "string" ? arg : arg.key;
					const { driverArea, driverKey } = resolveKey(key);
					return {
						key,
						driverArea,
						driverKey,
						driverMetaKey: getMetaKey(driverKey)
					};
				});
				const areaToDriverMetaKeysMap = keys.reduce((map, key) => {
					map[key.driverArea] ??= [];
					map[key.driverArea].push(key);
					return map;
				}, {});
				const resultsMap = {};
				await Promise.all(Object.entries(areaToDriverMetaKeysMap).map(async ([area, keys]) => {
					const areaRes = await browser$1.storage[area].get(keys.map((key) => key.driverMetaKey));
					keys.forEach((key) => {
						resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
					});
				}));
				return keys.map((key) => ({
					key: key.key,
					meta: resultsMap[key.key]
				}));
			},
			setItem: async (key, value) => {
				const { driver, driverKey } = resolveKey(key);
				await setItem(driver, driverKey, value);
			},
			setItems: async (items) => {
				const areaToKeyValueMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToKeyValueMap[driverArea] ??= [];
					areaToKeyValueMap[driverArea].push({
						key: driverKey,
						value: item.value
					});
				});
				await Promise.all(Object.entries(areaToKeyValueMap).map(async ([driverArea, values]) => {
					await getDriver(driverArea).setItems(values);
				}));
			},
			setMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await setMeta(driver, driverKey, properties);
			},
			setMetas: async (items) => {
				const areaToMetaUpdatesMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToMetaUpdatesMap[driverArea] ??= [];
					areaToMetaUpdatesMap[driverArea].push({
						key: driverKey,
						properties: item.meta
					});
				});
				await Promise.all(Object.entries(areaToMetaUpdatesMap).map(async ([storageArea, updates]) => {
					const driver = getDriver(storageArea);
					const metaKeys = updates.map(({ key }) => getMetaKey(key));
					const existingMetas = await driver.getItems(metaKeys);
					const existingMetaMap = Object.fromEntries(existingMetas.map(({ key, value }) => [key, getMetaValue(value)]));
					const metaUpdates = updates.map(({ key, properties }) => {
						const metaKey = getMetaKey(key);
						return {
							key: metaKey,
							value: mergeMeta(existingMetaMap[metaKey] ?? {}, properties)
						};
					});
					await driver.setItems(metaUpdates);
				}));
			},
			removeItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				await removeItem(driver, driverKey, opts);
			},
			removeItems: async (keys) => {
				const areaToKeysMap = {};
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) keyStr = key.key;
					else if ("item" in key) {
						keyStr = key.item.key;
						opts = key.options;
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					const { driverArea, driverKey } = resolveKey(keyStr);
					areaToKeysMap[driverArea] ??= [];
					areaToKeysMap[driverArea].push(driverKey);
					if (opts?.removeMeta) areaToKeysMap[driverArea].push(getMetaKey(driverKey));
				});
				await Promise.all(Object.entries(areaToKeysMap).map(async ([driverArea, keys]) => {
					await getDriver(driverArea).removeItems(keys);
				}));
			},
			clear: async (base) => {
				await getDriver(base).clear();
			},
			removeMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await removeMeta(driver, driverKey, properties);
			},
			snapshot: async (base, opts) => {
				const data = await getDriver(base).snapshot();
				opts?.excludeKeys?.forEach((key) => {
					delete data[key];
					delete data[getMetaKey(key)];
				});
				return data;
			},
			restoreSnapshot: async (base, data) => {
				await getDriver(base).restoreSnapshot(data);
			},
			watch: (key, cb) => {
				const { driver, driverKey } = resolveKey(key);
				return watch(driver, driverKey, cb);
			},
			unwatch() {
				Object.values(drivers).forEach((driver) => {
					driver.unwatch();
				});
			},
			defineItem: (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				const { version: targetVersion = 1, migrations = {}, onMigrationComplete, debug = false } = opts ?? {};
				if (targetVersion < 1) throw Error("Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.");
				let needsVersionSet = false;
				const migrate = async () => {
					const driverMetaKey = getMetaKey(driverKey);
					const [{ value }, { value: meta }] = await driver.getItems([driverKey, driverMetaKey]);
					needsVersionSet = value == null && meta?.v == null && !!targetVersion;
					if (value == null) return;
					const currentVersion = meta?.v ?? 1;
					if (currentVersion > targetVersion) throw Error(`Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`);
					if (currentVersion === targetVersion) return;
					if (debug) console.debug(`[@wxt-dev/storage] Running storage migration for ${key}: v${currentVersion} -> v${targetVersion}`);
					const migrationsToRun = Array.from({ length: targetVersion - currentVersion }, (_, i) => currentVersion + i + 1);
					let migratedValue = value;
					for (const migrateToVersion of migrationsToRun) try {
						migratedValue = await migrations?.[migrateToVersion]?.(migratedValue) ?? migratedValue;
						if (debug) console.debug(`[@wxt-dev/storage] Storage migration processed for version: v${migrateToVersion}`);
					} catch (err) {
						throw new MigrationError(key, migrateToVersion, { cause: err });
					}
					await driver.setItems([{
						key: driverKey,
						value: migratedValue
					}, {
						key: driverMetaKey,
						value: {
							...meta,
							v: targetVersion
						}
					}]);
					if (debug) console.debug(`[@wxt-dev/storage] Storage migration completed for ${key} v${targetVersion}`, { migratedValue });
					onMigrationComplete?.(migratedValue, targetVersion);
				};
				const migrationsDone = opts?.migrations == null ? Promise.resolve() : migrate().catch((err) => {
					console.error(`[@wxt-dev/storage] Migration failed for ${key}`, err);
				});
				const initMutex = new Mutex();
				const getFallback = () => opts?.fallback ?? opts?.defaultValue ?? null;
				const getOrInitValue = () => initMutex.runExclusive(async () => {
					const value = await driver.getItem(driverKey);
					if (value != null || opts?.init == null) return value;
					const newValue = await opts.init();
					await driver.setItem(driverKey, newValue);
					if (value == null && targetVersion > 1) await setMeta(driver, driverKey, { v: targetVersion });
					return newValue;
				});
				migrationsDone.then(getOrInitValue);
				return {
					key,
					get defaultValue() {
						return getFallback();
					},
					get fallback() {
						return getFallback();
					},
					getValue: async () => {
						await migrationsDone;
						if (opts?.init) return await getOrInitValue();
						else return await getItem(driver, driverKey, opts);
					},
					getMeta: async () => {
						await migrationsDone;
						return await getMeta(driver, driverKey);
					},
					setValue: async (value) => {
						await migrationsDone;
						if (needsVersionSet) {
							needsVersionSet = false;
							await Promise.all([setItem(driver, driverKey, value), setMeta(driver, driverKey, { v: targetVersion })]);
						} else await setItem(driver, driverKey, value);
					},
					setMeta: async (properties) => {
						await migrationsDone;
						return await setMeta(driver, driverKey, properties);
					},
					removeValue: async (opts) => {
						await migrationsDone;
						return await removeItem(driver, driverKey, opts);
					},
					removeMeta: async (properties) => {
						await migrationsDone;
						return await removeMeta(driver, driverKey, properties);
					},
					watch: (cb) => watch(driver, driverKey, (newValue, oldValue) => cb(newValue ?? getFallback(), oldValue ?? getFallback())),
					migrate
				};
			}
		};
	}
	function createDriver(storageArea) {
		const getStorageArea = () => {
			if (browser$1.runtime == null) throw Error(`'wxt/storage' must be loaded in a web extension environment

 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371
 - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`);
			if (browser$1.storage == null) throw Error("You must add the 'storage' permission to your manifest to use 'wxt/storage'");
			const area = browser$1.storage[storageArea];
			if (area == null) throw Error(`"browser.storage.${storageArea}" is undefined`);
			return area;
		};
		const watchListeners = /* @__PURE__ */ new Set();
		return {
			getItem: async (key) => {
				return (await getStorageArea().get(key))[key];
			},
			getItems: async (keys) => {
				const result = await getStorageArea().get(keys);
				return keys.map((key) => ({
					key,
					value: result[key] ?? null
				}));
			},
			setItem: async (key, value) => {
				if (value == null) await getStorageArea().remove(key);
				else await getStorageArea().set({ [key]: value });
			},
			setItems: async (values) => {
				const map = values.reduce((map, { key, value }) => {
					map[key] = value;
					return map;
				}, {});
				await getStorageArea().set(map);
			},
			removeItem: async (key) => {
				await getStorageArea().remove(key);
			},
			removeItems: async (keys) => {
				await getStorageArea().remove(keys);
			},
			clear: async () => {
				await getStorageArea().clear();
			},
			snapshot: async () => {
				return await getStorageArea().get();
			},
			restoreSnapshot: async (data) => {
				await getStorageArea().set(data);
			},
			watch(key, cb) {
				const listener = (changes) => {
					const change = changes[key];
					if (change == null || dequal(change.newValue, change.oldValue)) return;
					cb(change.newValue ?? null, change.oldValue ?? null);
				};
				getStorageArea().onChanged.addListener(listener);
				watchListeners.add(listener);
				return () => {
					getStorageArea().onChanged.removeListener(listener);
					watchListeners.delete(listener);
				};
			},
			unwatch() {
				watchListeners.forEach((listener) => {
					getStorageArea().onChanged.removeListener(listener);
				});
				watchListeners.clear();
			}
		};
	}
	var MigrationError = class extends Error {
		constructor(key, version, options) {
			super(`v${version} migration failed for "${key}"`, options);
			this.key = key;
			this.version = version;
		}
	};
	//#endregion
	//#region utils/storage.ts
	var signedInStore = storage.defineItem("local:locker:signedIn", { fallback: false });
	var activeWorkspaceSlugStore = storage.defineItem("local:locker:activeWorkspaceSlug", { fallback: null });
	async function isSignedIn() {
		return signedInStore.getValue();
	}
	async function setSignedIn(value) {
		await signedInStore.setValue(value);
	}
	async function getActiveWorkspaceSlug() {
		return activeWorkspaceSlugStore.getValue();
	}
	async function setActiveWorkspaceSlug(slug) {
		await activeWorkspaceSlugStore.setValue(slug);
	}
	//#endregion
	//#region entrypoints/background.ts
	var background_default = defineBackground(() => {
		onMessage("getSignedIn", async () => isSignedIn());
		onMessage("refreshSession", async () => {
			const ok = await probeSession();
			await setSignedIn(ok);
			return ok;
		});
		onMessage("signOut", async () => {
			await setSignedIn(false);
			await setActiveWorkspaceSlug(null);
			try {
				await fetch(`https://locker.dev/api/auth/sign-out`, {
					method: "POST",
					credentials: "include"
				});
			} catch {}
			return true;
		});
		onMessage("listWorkspaces", async () => {
			try {
				return {
					ok: true,
					data: await trpcQuery("workspaces.list", null)
				};
			} catch (err) {
				const e = err;
				if (e.status === 401) await setSignedIn(false);
				return {
					ok: false,
					error: e.message,
					status: e.status
				};
			}
		});
		onMessage("setActiveWorkspace", async ({ data }) => {
			await setActiveWorkspaceSlug(data.slug);
			return true;
		});
		onMessage("getActiveWorkspace", async () => getActiveWorkspaceSlug());
		onMessage("listFolder", async ({ data }) => {
			try {
				const [folders, filesResp, breadcrumbs] = await Promise.all([
					trpcQuery("folders.list", { parentId: data.folderId }, { workspaceSlug: data.workspaceSlug }),
					trpcQuery("files.list", {
						folderId: data.folderId,
						page: 1,
						pageSize: 200,
						field: "name",
						direction: "asc",
						accept: data.accept
					}, { workspaceSlug: data.workspaceSlug }),
					trpcQuery("folders.getBreadcrumbs", { folderId: data.folderId }, { workspaceSlug: data.workspaceSlug })
				]);
				return {
					ok: true,
					data: {
						folders: folders.map((f) => ({
							id: f.id,
							name: f.name,
							parentId: f.parentId
						})),
						files: filesResp.items.map((f) => ({
							id: f.id,
							name: f.name,
							size: f.size,
							mimeType: f.mimeType,
							folderId: f.folderId,
							updatedAt: typeof f.updatedAt === "string" ? f.updatedAt : new Date(f.updatedAt).toISOString()
						})),
						breadcrumbs
					}
				};
			} catch (err) {
				const e = err;
				if (e.status === 401) await setSignedIn(false);
				return {
					ok: false,
					error: e.message,
					status: e.status
				};
			}
		});
		onMessage("fetchFileForUpload", async ({ data }) => {
			try {
				const meta = await trpcMutation("files.getDownloadUrl", { id: data.fileId }, { workspaceSlug: data.workspaceSlug });
				const blob = await downloadAsBlob(meta.url);
				const dataBase64 = await blobToBase64(blob);
				return {
					ok: true,
					data: {
						name: meta.filename,
						mimeType: meta.mimeType || blob.type || "application/octet-stream",
						size: blob.size,
						dataBase64
					}
				};
			} catch (err) {
				const e = err;
				const status = e.status;
				if (status === 401) await setSignedIn(false);
				return {
					ok: false,
					error: e.message,
					status
				};
			}
		});
		onMessage("listGenerationTypes", async () => {
			try {
				return {
					ok: true,
					data: await trpcQuery("assistant.generationTypes", null)
				};
			} catch (err) {
				const e = err;
				if (e.status === 401) await setSignedIn(false);
				return {
					ok: false,
					error: e.message,
					status: e.status
				};
			}
		});
		onMessage("generateFile", async ({ data }) => {
			try {
				return {
					ok: true,
					data: await callGenerateFile(data)
				};
			} catch (err) {
				const e = err;
				if (e.status === 401) await setSignedIn(false);
				return {
					ok: false,
					error: e.message,
					status: e.status
				};
			}
		});
	});
	async function callGenerateFile(input) {
		const host = ({
			"BASE_URL": "/",
			"BROWSER": "chrome",
			"CHROME": true,
			"COMMAND": "serve",
			"DEV": true,
			"EDGE": false,
			"ENTRYPOINT": "background",
			"FIREFOX": false,
			"MANIFEST_VERSION": 3,
			"MODE": "development",
			"OPERA": false,
			"PROD": false,
			"SAFARI": false,
			"SSR": false,
			"WXT_PUBLIC_LOCKER_WEB_HOST": "https://locker.dev"
		}.WXT_PUBLIC_LOCKER_WEB_HOST ?? "http://localhost:3000").replace(/\/$/, "");
		const res = await fetch(`${host}/api/ai/generate-file`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"x-workspace-slug": input.workspaceSlug
			},
			body: JSON.stringify({
				typeId: input.typeId,
				prompt: input.prompt,
				attachments: input.attachments,
				lockerFileIds: input.lockerFileIds
			})
		});
		if (!res.ok) {
			const body = await res.json().catch(() => null);
			const err = new Error(body?.error ?? `generate-file ${res.status}`);
			err.status = res.status;
			throw err;
		}
		return await res.json();
	}
	//#endregion
	//#region ../../node_modules/.pnpm/wxt@0.20.25_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0_yaml@2.8.3/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = browser$1;
	//#endregion
	//#region ../../node_modules/.pnpm/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
	var _MatchPattern = class {
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [..._MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				validatePathname(matchPattern, pathname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		includes(url) {
			if (this.isAllUrls) return true;
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isFileMatch(url) {
			throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
		}
		isFtpMatch(url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var MatchPattern = _MatchPattern;
	MatchPattern.PROTOCOLS = [
		"http",
		"https",
		"file",
		"ftp",
		"urn"
	];
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	function validatePathname(matchPattern, pathname) {}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/Users/claudius/openstore/apps/extension/entrypoints/background.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3101";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbIkJyb3dzZXIiLCJicm93c2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9zZXJpYWxpemUtZXJyb3JAMTEuMC4zL25vZGVfbW9kdWxlcy9zZXJpYWxpemUtZXJyb3IvZXJyb3ItY29uc3RydWN0b3JzLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3NlcmlhbGl6ZS1lcnJvckAxMS4wLjMvbm9kZV9tb2R1bGVzL3NlcmlhbGl6ZS1lcnJvci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad2ViZXh0LWNvcmUrbWVzc2FnaW5nQDIuMy4wL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWVzc2FnaW5nL2xpYi9jaHVuay1CUUxGU0ZGWi5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93ZWJleHRlbnNpb24tcG9seWZpbGxAMC4xMC4wL25vZGVfbW9kdWxlcy93ZWJleHRlbnNpb24tcG9seWZpbGwvZGlzdC9icm93c2VyLXBvbHlmaWxsLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3ZWJleHQtY29yZSttZXNzYWdpbmdAMi4zLjAvbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tZXNzYWdpbmcvbGliL2luZGV4LmpzIiwiLi4vLi4vdXRpbHMvbWVzc2FnaW5nLnRzIiwiLi4vLi4vdXRpbHMvd2ViLWhvc3QudHMiLCIuLi8uLi91dGlscy9hcGkudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjEuNDAvbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9hc3luYy1tdXRleEAwLjUuMC9ub2RlX21vZHVsZXMvYXN5bmMtbXV0ZXgvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2RlcXVhbEAyLjAuMy9ub2RlX21vZHVsZXMvZGVxdWFsL2xpdGUvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3eHQtZGV2K3N0b3JhZ2VAMS4yLjgvbm9kZV9tb2R1bGVzL0B3eHQtZGV2L3N0b3JhZ2UvZGlzdC9pbmRleC5tanMiLCIuLi8uLi91dGlscy9zdG9yYWdlLnRzIiwiLi4vLi4vZW50cnlwb2ludHMvYmFja2dyb3VuZC50cyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3ZWJleHQtY29yZSttYXRjaC1wYXR0ZXJuc0AxLjAuMy9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLnRzXG5mdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuXHRpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcblx0cmV0dXJuIGFyZztcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQmFja2dyb3VuZCB9O1xuIiwiY29uc3QgbGlzdCA9IFtcblx0Ly8gTmF0aXZlIEVTIGVycm9ycyBodHRwczovLzI2Mi5lY21hLWludGVybmF0aW9uYWwub3JnLzEyLjAvI3NlYy13ZWxsLWtub3duLWludHJpbnNpYy1vYmplY3RzXG5cdEV2YWxFcnJvcixcblx0UmFuZ2VFcnJvcixcblx0UmVmZXJlbmNlRXJyb3IsXG5cdFN5bnRheEVycm9yLFxuXHRUeXBlRXJyb3IsXG5cdFVSSUVycm9yLFxuXG5cdC8vIEJ1aWx0LWluIGVycm9yc1xuXHRnbG9iYWxUaGlzLkRPTUV4Y2VwdGlvbixcblxuXHQvLyBOb2RlLXNwZWNpZmljIGVycm9yc1xuXHQvLyBodHRwczovL25vZGVqcy5vcmcvYXBpL2Vycm9ycy5odG1sXG5cdGdsb2JhbFRoaXMuQXNzZXJ0aW9uRXJyb3IsXG5cdGdsb2JhbFRoaXMuU3lzdGVtRXJyb3IsXG5dXG5cdC8vIE5vbi1uYXRpdmUgRXJyb3JzIGFyZSB1c2VkIHdpdGggYGdsb2JhbFRoaXNgIGJlY2F1c2UgdGhleSBtaWdodCBiZSBtaXNzaW5nLiBUaGlzIGZpbHRlciBkcm9wcyB0aGVtIHdoZW4gdW5kZWZpbmVkLlxuXHQuZmlsdGVyKEJvb2xlYW4pXG5cdC5tYXAoXG5cdFx0Y29uc3RydWN0b3IgPT4gW2NvbnN0cnVjdG9yLm5hbWUsIGNvbnN0cnVjdG9yXSxcblx0KTtcblxuY29uc3QgZXJyb3JDb25zdHJ1Y3RvcnMgPSBuZXcgTWFwKGxpc3QpO1xuXG5leHBvcnQgZGVmYXVsdCBlcnJvckNvbnN0cnVjdG9ycztcbiIsImltcG9ydCBlcnJvckNvbnN0cnVjdG9ycyBmcm9tICcuL2Vycm9yLWNvbnN0cnVjdG9ycy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBOb25FcnJvciBleHRlbmRzIEVycm9yIHtcblx0bmFtZSA9ICdOb25FcnJvcic7XG5cblx0Y29uc3RydWN0b3IobWVzc2FnZSkge1xuXHRcdHN1cGVyKE5vbkVycm9yLl9wcmVwYXJlU3VwZXJNZXNzYWdlKG1lc3NhZ2UpKTtcblx0fVxuXG5cdHN0YXRpYyBfcHJlcGFyZVN1cGVyTWVzc2FnZShtZXNzYWdlKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBTdHJpbmcobWVzc2FnZSk7XG5cdFx0fVxuXHR9XG59XG5cbmNvbnN0IGNvbW1vblByb3BlcnRpZXMgPSBbXG5cdHtcblx0XHRwcm9wZXJ0eTogJ25hbWUnLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHR9LFxuXHR7XG5cdFx0cHJvcGVydHk6ICdtZXNzYWdlJyxcblx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0fSxcblx0e1xuXHRcdHByb3BlcnR5OiAnc3RhY2snLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHR9LFxuXHR7XG5cdFx0cHJvcGVydHk6ICdjb2RlJyxcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHR9LFxuXHR7XG5cdFx0cHJvcGVydHk6ICdjYXVzZScsXG5cdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdH0sXG5dO1xuXG5jb25zdCB0b0pzb25XYXNDYWxsZWQgPSBuZXcgV2Vha1NldCgpO1xuXG5jb25zdCB0b0pTT04gPSBmcm9tID0+IHtcblx0dG9Kc29uV2FzQ2FsbGVkLmFkZChmcm9tKTtcblx0Y29uc3QganNvbiA9IGZyb20udG9KU09OKCk7XG5cdHRvSnNvbldhc0NhbGxlZC5kZWxldGUoZnJvbSk7XG5cdHJldHVybiBqc29uO1xufTtcblxuY29uc3QgZ2V0RXJyb3JDb25zdHJ1Y3RvciA9IG5hbWUgPT4gZXJyb3JDb25zdHJ1Y3RvcnMuZ2V0KG5hbWUpID8/IEVycm9yO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuY29uc3QgZGVzdHJveUNpcmN1bGFyID0gKHtcblx0ZnJvbSxcblx0c2Vlbixcblx0dG8sXG5cdGZvcmNlRW51bWVyYWJsZSxcblx0bWF4RGVwdGgsXG5cdGRlcHRoLFxuXHR1c2VUb0pTT04sXG5cdHNlcmlhbGl6ZSxcbn0pID0+IHtcblx0aWYgKCF0bykge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KGZyb20pKSB7XG5cdFx0XHR0byA9IFtdO1xuXHRcdH0gZWxzZSBpZiAoIXNlcmlhbGl6ZSAmJiBpc0Vycm9yTGlrZShmcm9tKSkge1xuXHRcdFx0Y29uc3QgRXJyb3IgPSBnZXRFcnJvckNvbnN0cnVjdG9yKGZyb20ubmFtZSk7XG5cdFx0XHR0byA9IG5ldyBFcnJvcigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0byA9IHt9O1xuXHRcdH1cblx0fVxuXG5cdHNlZW4ucHVzaChmcm9tKTtcblxuXHRpZiAoZGVwdGggPj0gbWF4RGVwdGgpIHtcblx0XHRyZXR1cm4gdG87XG5cdH1cblxuXHRpZiAodXNlVG9KU09OICYmIHR5cGVvZiBmcm9tLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJyAmJiAhdG9Kc29uV2FzQ2FsbGVkLmhhcyhmcm9tKSkge1xuXHRcdHJldHVybiB0b0pTT04oZnJvbSk7XG5cdH1cblxuXHRjb25zdCBjb250aW51ZURlc3Ryb3lDaXJjdWxhciA9IHZhbHVlID0+IGRlc3Ryb3lDaXJjdWxhcih7XG5cdFx0ZnJvbTogdmFsdWUsXG5cdFx0c2VlbjogWy4uLnNlZW5dLFxuXHRcdGZvcmNlRW51bWVyYWJsZSxcblx0XHRtYXhEZXB0aCxcblx0XHRkZXB0aCxcblx0XHR1c2VUb0pTT04sXG5cdFx0c2VyaWFsaXplLFxuXHR9KTtcblxuXHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmcm9tKSkge1xuXHRcdGlmICh2YWx1ZSAmJiB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgJiYgdmFsdWUuY29uc3RydWN0b3IubmFtZSA9PT0gJ0J1ZmZlcicpIHtcblx0XHRcdHRvW2tleV0gPSAnW29iamVjdCBCdWZmZXJdJztcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdC8vIFRPRE86IFVzZSBgc3RyZWFtLmlzUmVhZGFibGUoKWAgd2hlbiB0YXJnZXRpbmcgTm9kZS5qcyAxOC5cblx0XHRpZiAodmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUucGlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dG9ba2V5XSA9ICdbb2JqZWN0IFN0cmVhbV0nO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBHcmFjZWZ1bGx5IGhhbmRsZSBub24tY29uZmlndXJhYmxlIGVycm9ycyBsaWtlIGBET01FeGNlcHRpb25gLlxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dG9ba2V5XSA9IHZhbHVlO1xuXHRcdFx0fSBjYXRjaCB7fVxuXG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoIXNlZW4uaW5jbHVkZXMoZnJvbVtrZXldKSkge1xuXHRcdFx0ZGVwdGgrKztcblx0XHRcdHRvW2tleV0gPSBjb250aW51ZURlc3Ryb3lDaXJjdWxhcihmcm9tW2tleV0pO1xuXG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHR0b1trZXldID0gJ1tDaXJjdWxhcl0nO1xuXHR9XG5cblx0Zm9yIChjb25zdCB7cHJvcGVydHksIGVudW1lcmFibGV9IG9mIGNvbW1vblByb3BlcnRpZXMpIHtcblx0XHRpZiAodHlwZW9mIGZyb21bcHJvcGVydHldICE9PSAndW5kZWZpbmVkJyAmJiBmcm9tW3Byb3BlcnR5XSAhPT0gbnVsbCkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRvLCBwcm9wZXJ0eSwge1xuXHRcdFx0XHR2YWx1ZTogaXNFcnJvckxpa2UoZnJvbVtwcm9wZXJ0eV0pID8gY29udGludWVEZXN0cm95Q2lyY3VsYXIoZnJvbVtwcm9wZXJ0eV0pIDogZnJvbVtwcm9wZXJ0eV0sXG5cdFx0XHRcdGVudW1lcmFibGU6IGZvcmNlRW51bWVyYWJsZSA/IHRydWUgOiBlbnVtZXJhYmxlLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUVycm9yKHZhbHVlLCBvcHRpb25zID0ge30pIHtcblx0Y29uc3Qge1xuXHRcdG1heERlcHRoID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuXHRcdHVzZVRvSlNPTiA9IHRydWUsXG5cdH0gPSBvcHRpb25zO1xuXG5cdGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG5cdFx0cmV0dXJuIGRlc3Ryb3lDaXJjdWxhcih7XG5cdFx0XHRmcm9tOiB2YWx1ZSxcblx0XHRcdHNlZW46IFtdLFxuXHRcdFx0Zm9yY2VFbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0bWF4RGVwdGgsXG5cdFx0XHRkZXB0aDogMCxcblx0XHRcdHVzZVRvSlNPTixcblx0XHRcdHNlcmlhbGl6ZTogdHJ1ZSxcblx0XHR9KTtcblx0fVxuXG5cdC8vIFBlb3BsZSBzb21ldGltZXMgdGhyb3cgdGhpbmdzIGJlc2lkZXMgRXJyb3Igb2JqZWN0c+KAplxuXHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gYEpTT04uc3RyaW5naWZ5KClgIGRpc2NhcmRzIGZ1bmN0aW9ucy4gV2UgZG8gdG9vLCB1bmxlc3MgYSBmdW5jdGlvbiBpcyB0aHJvd24gZGlyZWN0bHkuXG5cdFx0Ly8gV2UgaW50ZW50aW9uYWxseSB1c2UgYHx8YCBiZWNhdXNlIGAubmFtZWAgaXMgYW4gZW1wdHkgc3RyaW5nIGZvciBhbm9ueW1vdXMgZnVuY3Rpb25zLlxuXHRcdHJldHVybiBgW0Z1bmN0aW9uOiAke3ZhbHVlLm5hbWUgfHwgJ2Fub255bW91cyd9XWA7XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNlcmlhbGl6ZUVycm9yKHZhbHVlLCBvcHRpb25zID0ge30pIHtcblx0Y29uc3Qge21heERlcHRoID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZfSA9IG9wdGlvbnM7XG5cblx0aWYgKHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH1cblxuXHRpZiAoaXNNaW5pbXVtVmlhYmxlU2VyaWFsaXplZEVycm9yKHZhbHVlKSkge1xuXHRcdGNvbnN0IEVycm9yID0gZ2V0RXJyb3JDb25zdHJ1Y3Rvcih2YWx1ZS5uYW1lKTtcblx0XHRyZXR1cm4gZGVzdHJveUNpcmN1bGFyKHtcblx0XHRcdGZyb206IHZhbHVlLFxuXHRcdFx0c2VlbjogW10sXG5cdFx0XHR0bzogbmV3IEVycm9yKCksXG5cdFx0XHRtYXhEZXB0aCxcblx0XHRcdGRlcHRoOiAwLFxuXHRcdFx0c2VyaWFsaXplOiBmYWxzZSxcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBuZXcgTm9uRXJyb3IodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFcnJvckxpa2UodmFsdWUpIHtcblx0cmV0dXJuIEJvb2xlYW4odmFsdWUpXG5cdCYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcblx0JiYgJ25hbWUnIGluIHZhbHVlXG5cdCYmICdtZXNzYWdlJyBpbiB2YWx1ZVxuXHQmJiAnc3RhY2snIGluIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc01pbmltdW1WaWFibGVTZXJpYWxpemVkRXJyb3IodmFsdWUpIHtcblx0cmV0dXJuIEJvb2xlYW4odmFsdWUpXG5cdCYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcblx0JiYgJ21lc3NhZ2UnIGluIHZhbHVlXG5cdCYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuZXhwb3J0IHtkZWZhdWx0IGFzIGVycm9yQ29uc3RydWN0b3JzfSBmcm9tICcuL2Vycm9yLWNvbnN0cnVjdG9ycy5qcyc7XG4iLCJ2YXIgX19kZWZQcm9wID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xudmFyIF9fZGVmUHJvcHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcztcbnZhciBfX2dldE93blByb3BEZXNjcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzO1xudmFyIF9fZ2V0T3duUHJvcFN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIF9faGFzT3duUHJvcCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgX19wcm9wSXNFbnVtID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcbnZhciBfX2RlZk5vcm1hbFByb3AgPSAob2JqLCBrZXksIHZhbHVlKSA9PiBrZXkgaW4gb2JqID8gX19kZWZQcm9wKG9iaiwga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlIH0pIDogb2JqW2tleV0gPSB2YWx1ZTtcbnZhciBfX3NwcmVhZFZhbHVlcyA9IChhLCBiKSA9PiB7XG4gIGZvciAodmFyIHByb3AgaW4gYiB8fCAoYiA9IHt9KSlcbiAgICBpZiAoX19oYXNPd25Qcm9wLmNhbGwoYiwgcHJvcCkpXG4gICAgICBfX2RlZk5vcm1hbFByb3AoYSwgcHJvcCwgYltwcm9wXSk7XG4gIGlmIChfX2dldE93blByb3BTeW1ib2xzKVxuICAgIGZvciAodmFyIHByb3Agb2YgX19nZXRPd25Qcm9wU3ltYm9scyhiKSkge1xuICAgICAgaWYgKF9fcHJvcElzRW51bS5jYWxsKGIsIHByb3ApKVxuICAgICAgICBfX2RlZk5vcm1hbFByb3AoYSwgcHJvcCwgYltwcm9wXSk7XG4gICAgfVxuICByZXR1cm4gYTtcbn07XG52YXIgX19zcHJlYWRQcm9wcyA9IChhLCBiKSA9PiBfX2RlZlByb3BzKGEsIF9fZ2V0T3duUHJvcERlc2NzKGIpKTtcbnZhciBfX29ialJlc3QgPSAoc291cmNlLCBleGNsdWRlKSA9PiB7XG4gIHZhciB0YXJnZXQgPSB7fTtcbiAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpXG4gICAgaWYgKF9faGFzT3duUHJvcC5jYWxsKHNvdXJjZSwgcHJvcCkgJiYgZXhjbHVkZS5pbmRleE9mKHByb3ApIDwgMClcbiAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgaWYgKHNvdXJjZSAhPSBudWxsICYmIF9fZ2V0T3duUHJvcFN5bWJvbHMpXG4gICAgZm9yICh2YXIgcHJvcCBvZiBfX2dldE93blByb3BTeW1ib2xzKHNvdXJjZSkpIHtcbiAgICAgIGlmIChleGNsdWRlLmluZGV4T2YocHJvcCkgPCAwICYmIF9fcHJvcElzRW51bS5jYWxsKHNvdXJjZSwgcHJvcCkpXG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICB9XG4gIHJldHVybiB0YXJnZXQ7XG59O1xudmFyIF9fYXN5bmMgPSAoX190aGlzLCBfX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIGZ1bGZpbGxlZCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgcmVqZWN0ZWQgPSAodmFsdWUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzdGVwID0gKHgpID0+IHguZG9uZSA/IHJlc29sdmUoeC52YWx1ZSkgOiBQcm9taXNlLnJlc29sdmUoeC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTtcbiAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkoX190aGlzLCBfX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gIH0pO1xufTtcblxuLy8gc3JjL2dlbmVyaWMudHNcbmltcG9ydCB7IHNlcmlhbGl6ZUVycm9yLCBkZXNlcmlhbGl6ZUVycm9yIH0gZnJvbSBcInNlcmlhbGl6ZS1lcnJvclwiO1xuZnVuY3Rpb24gZGVmaW5lR2VuZXJpY01lc3NhbmdpbmcoY29uZmlnKSB7XG4gIGxldCByZW1vdmVSb290TGlzdGVuZXI7XG4gIGxldCBwZXJUeXBlTGlzdGVuZXJzID0ge307XG4gIGZ1bmN0aW9uIGNsZWFudXBSb290TGlzdGVuZXIoKSB7XG4gICAgaWYgKE9iamVjdC5lbnRyaWVzKHBlclR5cGVMaXN0ZW5lcnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmVtb3ZlUm9vdExpc3RlbmVyID09IG51bGwgPyB2b2lkIDAgOiByZW1vdmVSb290TGlzdGVuZXIoKTtcbiAgICAgIHJlbW92ZVJvb3RMaXN0ZW5lciA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbiAgbGV0IGlkU2VxID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWU0KTtcbiAgZnVuY3Rpb24gZ2V0TmV4dElkKCkge1xuICAgIHJldHVybiBpZFNlcSsrO1xuICB9XG4gIHJldHVybiB7XG4gICAgc2VuZE1lc3NhZ2UodHlwZSwgZGF0YSwgLi4uYXJncykge1xuICAgICAgcmV0dXJuIF9fYXN5bmModGhpcywgbnVsbCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgdmFyIF9hMiwgX2IsIF9jLCBfZDtcbiAgICAgICAgY29uc3QgX21lc3NhZ2UgPSB7XG4gICAgICAgICAgaWQ6IGdldE5leHRJZCgpLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IChfYiA9IHlpZWxkIChfYTIgPSBjb25maWcudmVyaWZ5TWVzc2FnZURhdGEpID09IG51bGwgPyB2b2lkIDAgOiBfYTIuY2FsbChjb25maWcsIF9tZXNzYWdlKSkgIT0gbnVsbCA/IF9iIDogX21lc3NhZ2U7XG4gICAgICAgIChfYyA9IGNvbmZpZy5sb2dnZXIpID09IG51bGwgPyB2b2lkIDAgOiBfYy5kZWJ1ZyhgW21lc3NhZ2luZ10gc2VuZE1lc3NhZ2Uge2lkPSR7bWVzc2FnZS5pZH19IFxcdTI1MDBcXHUxNDA1YCwgbWVzc2FnZSwgLi4uYXJncyk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0geWllbGQgY29uZmlnLnNlbmRNZXNzYWdlKG1lc3NhZ2UsIC4uLmFyZ3MpO1xuICAgICAgICBjb25zdCB7IHJlcywgZXJyIH0gPSByZXNwb25zZSAhPSBudWxsID8gcmVzcG9uc2UgOiB7IGVycjogbmV3IEVycm9yKFwiTm8gcmVzcG9uc2VcIikgfTtcbiAgICAgICAgKF9kID0gY29uZmlnLmxvZ2dlcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9kLmRlYnVnKGBbbWVzc2FnaW5nXSBzZW5kTWVzc2FnZSB7aWQ9JHttZXNzYWdlLmlkfX0gXFx1MTQwQVxcdTI1MDBgLCB7IHJlcywgZXJyIH0pO1xuICAgICAgICBpZiAoZXJyICE9IG51bGwpXG4gICAgICAgICAgdGhyb3cgZGVzZXJpYWxpemVFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBvbk1lc3NhZ2UodHlwZSwgb25SZWNlaXZlZCkge1xuICAgICAgdmFyIF9hMiwgX2IsIF9jO1xuICAgICAgaWYgKHJlbW92ZVJvb3RMaXN0ZW5lciA9PSBudWxsKSB7XG4gICAgICAgIChfYTIgPSBjb25maWcubG9nZ2VyKSA9PSBudWxsID8gdm9pZCAwIDogX2EyLmRlYnVnKFxuICAgICAgICAgIGBbbWVzc2FnaW5nXSBcIiR7dHlwZX1cIiBpbml0aWFsaXplZCB0aGUgbWVzc2FnZSBsaXN0ZW5lciBmb3IgdGhpcyBjb250ZXh0YFxuICAgICAgICApO1xuICAgICAgICByZW1vdmVSb290TGlzdGVuZXIgPSBjb25maWcuYWRkUm9vdExpc3RlbmVyKChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgdmFyIF9hMywgX2IyO1xuICAgICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZS50eXBlICE9IFwic3RyaW5nXCIgfHwgdHlwZW9mIG1lc3NhZ2UudGltZXN0YW1wICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmJyZWFrRXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZXJyID0gRXJyb3IoXG4gICAgICAgICAgICAgIGBbbWVzc2FnaW5nXSBVbmtub3duIG1lc3NhZ2UgZm9ybWF0LCBtdXN0IGluY2x1ZGUgdGhlICd0eXBlJyAmICd0aW1lc3RhbXAnIGZpZWxkcywgcmVjZWl2ZWQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgICApfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAoX2EzID0gY29uZmlnLmxvZ2dlcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9hMy5lcnJvcihlcnIpO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgICAoX2IyID0gY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcubG9nZ2VyKSA9PSBudWxsID8gdm9pZCAwIDogX2IyLmRlYnVnKFwiW21lc3NhZ2luZ10gUmVjZWl2ZWQgbWVzc2FnZVwiLCBtZXNzYWdlKTtcbiAgICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHBlclR5cGVMaXN0ZW5lcnNbbWVzc2FnZS50eXBlXTtcbiAgICAgICAgICBpZiAobGlzdGVuZXIgPT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICBjb25zdCByZXMgPSBsaXN0ZW5lcihtZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcykudGhlbigocmVzMikgPT4ge1xuICAgICAgICAgICAgdmFyIF9hNCwgX2IzO1xuICAgICAgICAgICAgcmV0dXJuIChfYjMgPSAoX2E0ID0gY29uZmlnLnZlcmlmeU1lc3NhZ2VEYXRhKSA9PSBudWxsID8gdm9pZCAwIDogX2E0LmNhbGwoY29uZmlnLCByZXMyKSkgIT0gbnVsbCA/IF9iMyA6IHJlczI7XG4gICAgICAgICAgfSkudGhlbigocmVzMikgPT4ge1xuICAgICAgICAgICAgdmFyIF9hNDtcbiAgICAgICAgICAgIChfYTQgPSBjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5sb2dnZXIpID09IG51bGwgPyB2b2lkIDAgOiBfYTQuZGVidWcoYFttZXNzYWdpbmddIG9uTWVzc2FnZSB7aWQ9JHttZXNzYWdlLmlkfX0gXFx1MjUwMFxcdTE0MDVgLCB7IHJlczogcmVzMiB9KTtcbiAgICAgICAgICAgIHJldHVybiB7IHJlczogcmVzMiB9O1xuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIHZhciBfYTQ7XG4gICAgICAgICAgICAoX2E0ID0gY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcubG9nZ2VyKSA9PSBudWxsID8gdm9pZCAwIDogX2E0LmRlYnVnKGBbbWVzc2FnaW5nXSBvbk1lc3NhZ2Uge2lkPSR7bWVzc2FnZS5pZH19IFxcdTI1MDBcXHUxNDA1YCwgeyBlcnIgfSk7XG4gICAgICAgICAgICByZXR1cm4geyBlcnI6IHNlcmlhbGl6ZUVycm9yKGVycikgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAocGVyVHlwZUxpc3RlbmVyc1t0eXBlXSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGVyciA9IEVycm9yKFxuICAgICAgICAgIGBbbWVzc2FnaW5nXSBJbiB0aGlzIEpTIGNvbnRleHQsIG9ubHkgb25lIGxpc3RlbmVyIGNhbiBiZSBzZXR1cCBmb3IgJHt0eXBlfWBcbiAgICAgICAgKTtcbiAgICAgICAgKF9iID0gY29uZmlnLmxvZ2dlcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9iLmVycm9yKGVycik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIHBlclR5cGVMaXN0ZW5lcnNbdHlwZV0gPSBvblJlY2VpdmVkO1xuICAgICAgKF9jID0gY29uZmlnLmxvZ2dlcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9jLmxvZyhgW21lc3NhZ2luZ10gQWRkZWQgbGlzdGVuZXIgZm9yICR7dHlwZX1gKTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBwZXJUeXBlTGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICBjbGVhbnVwUm9vdExpc3RlbmVyKCk7XG4gICAgICB9O1xuICAgIH0sXG4gICAgcmVtb3ZlQWxsTGlzdGVuZXJzKCkge1xuICAgICAgT2JqZWN0LmtleXMocGVyVHlwZUxpc3RlbmVycykuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICBkZWxldGUgcGVyVHlwZUxpc3RlbmVyc1t0eXBlXTtcbiAgICAgIH0pO1xuICAgICAgY2xlYW51cFJvb3RMaXN0ZW5lcigpO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IHtcbiAgX19zcHJlYWRWYWx1ZXMsXG4gIF9fc3ByZWFkUHJvcHMsXG4gIF9fb2JqUmVzdCxcbiAgX19hc3luYyxcbiAgZGVmaW5lR2VuZXJpY01lc3Nhbmdpbmdcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIiwgW1wibW9kdWxlXCJdLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGZhY3RvcnkobW9kdWxlKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbW9kID0ge1xuICAgICAgZXhwb3J0czoge31cbiAgICB9O1xuICAgIGZhY3RvcnkobW9kKTtcbiAgICBnbG9iYWwuYnJvd3NlciA9IG1vZC5leHBvcnRzO1xuICB9XG59KSh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0aGlzLCBmdW5jdGlvbiAobW9kdWxlKSB7XG4gIC8qIHdlYmV4dGVuc2lvbi1wb2x5ZmlsbCAtIHYwLjEwLjAgLSBGcmkgQXVnIDEyIDIwMjIgMTk6NDI6NDQgKi9cblxuICAvKiAtKi0gTW9kZTogaW5kZW50LXRhYnMtbW9kZTogbmlsOyBqcy1pbmRlbnQtbGV2ZWw6IDIgLSotICovXG5cbiAgLyogdmltOiBzZXQgc3RzPTIgc3c9MiBldCB0dz04MDogKi9cblxuICAvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gICAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAgICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4gKi9cbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgaWYgKCFnbG9iYWxUaGlzLmNocm9tZT8ucnVudGltZT8uaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIHNjcmlwdCBzaG91bGQgb25seSBiZSBsb2FkZWQgaW4gYSBicm93c2VyIGV4dGVuc2lvbi5cIik7XG4gIH1cblxuICBpZiAodHlwZW9mIGdsb2JhbFRoaXMuYnJvd3NlciA9PT0gXCJ1bmRlZmluZWRcIiB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsVGhpcy5icm93c2VyKSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGNvbnN0IENIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSA9IFwiVGhlIG1lc3NhZ2UgcG9ydCBjbG9zZWQgYmVmb3JlIGEgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkLlwiOyAvLyBXcmFwcGluZyB0aGUgYnVsayBvZiB0aGlzIHBvbHlmaWxsIGluIGEgb25lLXRpbWUtdXNlIGZ1bmN0aW9uIGlzIGEgbWlub3JcbiAgICAvLyBvcHRpbWl6YXRpb24gZm9yIEZpcmVmb3guIFNpbmNlIFNwaWRlcm1vbmtleSBkb2VzIG5vdCBmdWxseSBwYXJzZSB0aGVcbiAgICAvLyBjb250ZW50cyBvZiBhIGZ1bmN0aW9uIHVudGlsIHRoZSBmaXJzdCB0aW1lIGl0J3MgY2FsbGVkLCBhbmQgc2luY2UgaXQgd2lsbFxuICAgIC8vIG5ldmVyIGFjdHVhbGx5IG5lZWQgdG8gYmUgY2FsbGVkLCB0aGlzIGFsbG93cyB0aGUgcG9seWZpbGwgdG8gYmUgaW5jbHVkZWRcbiAgICAvLyBpbiBGaXJlZm94IG5lYXJseSBmb3IgZnJlZS5cblxuICAgIGNvbnN0IHdyYXBBUElzID0gZXh0ZW5zaW9uQVBJcyA9PiB7XG4gICAgICAvLyBOT1RFOiBhcGlNZXRhZGF0YSBpcyBhc3NvY2lhdGVkIHRvIHRoZSBjb250ZW50IG9mIHRoZSBhcGktbWV0YWRhdGEuanNvbiBmaWxlXG4gICAgICAvLyBhdCBidWlsZCB0aW1lIGJ5IHJlcGxhY2luZyB0aGUgZm9sbG93aW5nIFwiaW5jbHVkZVwiIHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlXG4gICAgICAvLyBKU09OIGZpbGUuXG4gICAgICBjb25zdCBhcGlNZXRhZGF0YSA9IHtcbiAgICAgICAgXCJhbGFybXNcIjoge1xuICAgICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjbGVhckFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImJvb2ttYXJrc1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRDaGlsZHJlblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFJlY2VudFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFN1YlRyZWVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRUcmVlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVRyZWVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJicm93c2VyQWN0aW9uXCI6IHtcbiAgICAgICAgICBcImRpc2FibGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbmFibGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRCYWRnZUJhY2tncm91bmRDb2xvclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJvcGVuUG9wdXBcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRCYWRnZUJhY2tncm91bmRDb2xvclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYnJvd3NpbmdEYXRhXCI6IHtcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUNhY2hlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlQ29va2llc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZURvd25sb2Fkc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUZvcm1EYXRhXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlSGlzdG9yeVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUxvY2FsU3RvcmFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVBhc3N3b3Jkc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVBsdWdpbkRhdGFcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImNvbW1hbmRzXCI6IHtcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImNvbnRleHRNZW51c1wiOiB7XG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJjb29raWVzXCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbENvb2tpZVN0b3Jlc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImRldnRvb2xzXCI6IHtcbiAgICAgICAgICBcImluc3BlY3RlZFdpbmRvd1wiOiB7XG4gICAgICAgICAgICBcImV2YWxcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDIsXG4gICAgICAgICAgICAgIFwic2luZ2xlQ2FsbGJhY2tBcmdcIjogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicGFuZWxzXCI6IHtcbiAgICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDMsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAzLFxuICAgICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImVsZW1lbnRzXCI6IHtcbiAgICAgICAgICAgICAgXCJjcmVhdGVTaWRlYmFyUGFuZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkb3dubG9hZHNcIjoge1xuICAgICAgICAgIFwiY2FuY2VsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZG93bmxvYWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlcmFzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEZpbGVJY29uXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwib3BlblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInBhdXNlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlRmlsZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlc3VtZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNob3dcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJleHRlbnNpb25cIjoge1xuICAgICAgICAgIFwiaXNBbGxvd2VkRmlsZVNjaGVtZUFjY2Vzc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImlzQWxsb3dlZEluY29nbml0b0FjY2Vzc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImhpc3RvcnlcIjoge1xuICAgICAgICAgIFwiYWRkVXJsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGVsZXRlQWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGVsZXRlUmFuZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkZWxldGVVcmxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRWaXNpdHNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJpMThuXCI6IHtcbiAgICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QWNjZXB0TGFuZ3VhZ2VzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaWRlbnRpdHlcIjoge1xuICAgICAgICAgIFwibGF1bmNoV2ViQXV0aEZsb3dcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJpZGxlXCI6IHtcbiAgICAgICAgICBcInF1ZXJ5U3RhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYW5hZ2VtZW50XCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFNlbGZcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRFbmFibGVkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidW5pbnN0YWxsU2VsZlwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm5vdGlmaWNhdGlvbnNcIjoge1xuICAgICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRQZXJtaXNzaW9uTGV2ZWxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwYWdlQWN0aW9uXCI6IHtcbiAgICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJoaWRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0SWNvblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicGVybWlzc2lvbnNcIjoge1xuICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXF1ZXN0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicnVudGltZVwiOiB7XG4gICAgICAgICAgXCJnZXRCYWNrZ3JvdW5kUGFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFBsYXRmb3JtSW5mb1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm9wZW5PcHRpb25zUGFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlcXVlc3RVcGRhdGVDaGVja1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNlbmRNZXNzYWdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDNcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2VuZE5hdGl2ZU1lc3NhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRVbmluc3RhbGxVUkxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXNzaW9uc1wiOiB7XG4gICAgICAgICAgXCJnZXREZXZpY2VzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0UmVjZW50bHlDbG9zZWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXN0b3JlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic3RvcmFnZVwiOiB7XG4gICAgICAgICAgXCJsb2NhbFwiOiB7XG4gICAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm1hbmFnZWRcIjoge1xuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic3luY1wiOiB7XG4gICAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRhYnNcIjoge1xuICAgICAgICAgIFwiY2FwdHVyZVZpc2libGVUYWJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkZXRlY3RMYW5ndWFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImRpc2NhcmRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkdXBsaWNhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJleGVjdXRlU2NyaXB0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFpvb21cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnb0JhY2tcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnb0ZvcndhcmRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJoaWdobGlnaHRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJpbnNlcnRDU1NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicXVlcnlcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZWxvYWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVDU1NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFpvb21cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0b3BTaXRlc1wiOiB7XG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ3ZWJOYXZpZ2F0aW9uXCI6IHtcbiAgICAgICAgICBcImdldEFsbEZyYW1lc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEZyYW1lXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwid2ViUmVxdWVzdFwiOiB7XG4gICAgICAgICAgXCJoYW5kbGVyQmVoYXZpb3JDaGFuZ2VkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwid2luZG93c1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRDdXJyZW50XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0TGFzdEZvY3VzZWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKE9iamVjdC5rZXlzKGFwaU1ldGFkYXRhKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXBpLW1ldGFkYXRhLmpzb24gaGFzIG5vdCBiZWVuIGluY2x1ZGVkIGluIGJyb3dzZXItcG9seWZpbGxcIik7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEEgV2Vha01hcCBzdWJjbGFzcyB3aGljaCBjcmVhdGVzIGFuZCBzdG9yZXMgYSB2YWx1ZSBmb3IgYW55IGtleSB3aGljaCBkb2VzXG4gICAgICAgKiBub3QgZXhpc3Qgd2hlbiBhY2Nlc3NlZCwgYnV0IGJlaGF2ZXMgZXhhY3RseSBhcyBhbiBvcmRpbmFyeSBXZWFrTWFwXG4gICAgICAgKiBvdGhlcndpc2UuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY3JlYXRlSXRlbVxuICAgICAgICogICAgICAgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSB2YWx1ZSBmb3IgYW55XG4gICAgICAgKiAgICAgICAga2V5IHdoaWNoIGRvZXMgbm90IGV4aXN0LCB0aGUgZmlyc3QgdGltZSBpdCBpcyBhY2Nlc3NlZC4gVGhlXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZXMsIGFzIGl0cyBvbmx5IGFyZ3VtZW50LCB0aGUga2V5IGJlaW5nIGNyZWF0ZWQuXG4gICAgICAgKi9cblxuXG4gICAgICBjbGFzcyBEZWZhdWx0V2Vha01hcCBleHRlbmRzIFdlYWtNYXAge1xuICAgICAgICBjb25zdHJ1Y3RvcihjcmVhdGVJdGVtLCBpdGVtcyA9IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHN1cGVyKGl0ZW1zKTtcbiAgICAgICAgICB0aGlzLmNyZWF0ZUl0ZW0gPSBjcmVhdGVJdGVtO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0KGtleSkge1xuICAgICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhpcy5zZXQoa2V5LCB0aGlzLmNyZWF0ZUl0ZW0oa2V5KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBvYmplY3QgaXMgYW4gb2JqZWN0IHdpdGggYSBgdGhlbmAgbWV0aG9kLCBhbmQgY2FuXG4gICAgICAgKiB0aGVyZWZvcmUgYmUgYXNzdW1lZCB0byBiZWhhdmUgYXMgYSBQcm9taXNlLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHRlc3QuXG4gICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgdGhlbmFibGUuXG4gICAgICAgKi9cblxuXG4gICAgICBjb25zdCBpc1RoZW5hYmxlID0gdmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICB9O1xuICAgICAgLyoqXG4gICAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0XG4gICAgICAgKiB0aGUgZ2l2ZW4gcHJvbWlzZSBiYXNlZCBvbiBob3cgaXQgaXMgY2FsbGVkOlxuICAgICAgICpcbiAgICAgICAqIC0gSWYsIHdoZW4gY2FsbGVkLCBgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yYCBjb250YWlucyBhIG5vbi1udWxsIG9iamVjdCxcbiAgICAgICAqICAgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQgd2l0aCB0aGF0IHZhbHVlLlxuICAgICAgICogLSBJZiB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggZXhhY3RseSBvbmUgYXJndW1lbnQsIHRoZSBwcm9taXNlIGlzXG4gICAgICAgKiAgIHJlc29sdmVkIHRvIHRoYXQgdmFsdWUuXG4gICAgICAgKiAtIE90aGVyd2lzZSwgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgdG8gYW4gYXJyYXkgY29udGFpbmluZyBhbGwgb2YgdGhlXG4gICAgICAgKiAgIGZ1bmN0aW9uJ3MgYXJndW1lbnRzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9taXNlXG4gICAgICAgKiAgICAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHJlc29sdXRpb24gYW5kIHJlamVjdGlvbiBmdW5jdGlvbnMgb2YgYVxuICAgICAgICogICAgICAgIHByb21pc2UuXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlc29sdmVcbiAgICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlc29sdXRpb24gZnVuY3Rpb24uXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlamVjdFxuICAgICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVqZWN0aW9uIGZ1bmN0aW9uLlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IG1ldGFkYXRhXG4gICAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIHdyYXBwZWQgbWV0aG9kIHdoaWNoIGhhcyBjcmVhdGVkIHRoZSBjYWxsYmFjay5cbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgICAqICAgICAgICBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIG9ubHkgdGhlIGZpcnN0XG4gICAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAgICogICAgICAgIGZ1bmN0aW9uIGlzIGludm9rZWQgd2l0aCBvbmx5IGEgc2luZ2xlIGFyZ3VtZW50LCB0aGF0IHdpbGwgYmVcbiAgICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cbiAgICAgICAqICAgICAgICBUaGUgZ2VuZXJhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgICovXG5cblxuICAgICAgY29uc3QgbWFrZUNhbGxiYWNrID0gKHByb21pc2UsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiAoLi4uY2FsbGJhY2tBcmdzKSA9PiB7XG4gICAgICAgICAgaWYgKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgIHByb21pc2UucmVqZWN0KG5ldyBFcnJvcihleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnIHx8IGNhbGxiYWNrQXJncy5sZW5ndGggPD0gMSAmJiBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UucmVzb2x2ZShjYWxsYmFja0FyZ3NbMF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlLnJlc29sdmUoY2FsbGJhY2tBcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwbHVyYWxpemVBcmd1bWVudHMgPSBudW1BcmdzID0+IG51bUFyZ3MgPT0gMSA/IFwiYXJndW1lbnRcIiA6IFwiYXJndW1lbnRzXCI7XG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYSB3cmFwcGVyIGZ1bmN0aW9uIGZvciBhIG1ldGhvZCB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBtZXRhZGF0YS5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAgICogICAgICAgIFRoZSBuYW1lIG9mIHRoZSBtZXRob2Qgd2hpY2ggaXMgYmVpbmcgd3JhcHBlZC5cbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtZXRhZGF0YVxuICAgICAgICogICAgICAgIE1ldGFkYXRhIGFib3V0IHRoZSBtZXRob2QgYmVpbmcgd3JhcHBlZC5cbiAgICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbWV0YWRhdGEubWluQXJnc1xuICAgICAgICogICAgICAgIFRoZSBtaW5pbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbXVzdCBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24uIElmIGNhbGxlZCB3aXRoIGZld2VyIHRoYW4gdGhpcyBudW1iZXIgb2YgYXJndW1lbnRzLCB0aGVcbiAgICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5tYXhBcmdzXG4gICAgICAgKiAgICAgICAgVGhlIG1heGltdW0gbnVtYmVyIG9mIGFyZ3VtZW50cyB3aGljaCBtYXkgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBtb3JlIHRoYW4gdGhpcyBudW1iZXIgb2YgYXJndW1lbnRzLCB0aGVcbiAgICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAgICogQHBhcmFtIHtib29sZWFufSBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZ1xuICAgICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgICAqICAgICAgICBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2ssIGFsdGVybmF0aXZlbHkgYW4gYXJyYXkgb2YgYWxsIHRoZVxuICAgICAgICogICAgICAgIGNhbGxiYWNrIGFyZ3VtZW50cyBpcyByZXNvbHZlZC4gQnkgZGVmYXVsdCwgaWYgdGhlIGNhbGxiYWNrXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAgICogICAgICAgIHJlc29sdmVkIHRvIHRoZSBwcm9taXNlLCB3aGlsZSBhbGwgYXJndW1lbnRzIHdpbGwgYmUgcmVzb2x2ZWQgYXNcbiAgICAgICAqICAgICAgICBhbiBhcnJheSBpZiBtdWx0aXBsZSBhcmUgZ2l2ZW4uXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge2Z1bmN0aW9uKG9iamVjdCwgLi4uKil9XG4gICAgICAgKiAgICAgICBUaGUgZ2VuZXJhdGVkIHdyYXBwZXIgZnVuY3Rpb24uXG4gICAgICAgKi9cblxuXG4gICAgICBjb25zdCB3cmFwQXN5bmNGdW5jdGlvbiA9IChuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gYXN5bmNGdW5jdGlvbldyYXBwZXIodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDwgbWV0YWRhdGEubWluQXJncykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPiBtZXRhZGF0YS5tYXhBcmdzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IG1vc3QgJHttZXRhZGF0YS5tYXhBcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5tYXhBcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5mYWxsYmFja1RvTm9DYWxsYmFjaykge1xuICAgICAgICAgICAgICAvLyBUaGlzIEFQSSBtZXRob2QgaGFzIGN1cnJlbnRseSBubyBjYWxsYmFjayBvbiBDaHJvbWUsIGJ1dCBpdCByZXR1cm4gYSBwcm9taXNlIG9uIEZpcmVmb3gsXG4gICAgICAgICAgICAgIC8vIGFuZCBzbyB0aGUgcG9seWZpbGwgd2lsbCB0cnkgdG8gY2FsbCBpdCB3aXRoIGEgY2FsbGJhY2sgZmlyc3QsIGFuZCBpdCB3aWxsIGZhbGxiYWNrXG4gICAgICAgICAgICAgIC8vIHRvIG5vdCBwYXNzaW5nIHRoZSBjYWxsYmFjayBpZiB0aGUgZmlyc3QgY2FsbCBmYWlscy5cbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncywgbWFrZUNhbGxiYWNrKHtcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICByZWplY3RcbiAgICAgICAgICAgICAgICB9LCBtZXRhZGF0YSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChjYkVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAke25hbWV9IEFQSSBtZXRob2QgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciwgYCArIFwiZmFsbGluZyBiYWNrIHRvIGNhbGwgaXQgd2l0aG91dCBhIGNhbGxiYWNrOiBcIiwgY2JFcnJvcik7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MpOyAvLyBVcGRhdGUgdGhlIEFQSSBtZXRob2QgbWV0YWRhdGEsIHNvIHRoYXQgdGhlIG5leHQgQVBJIGNhbGxzIHdpbGwgbm90IHRyeSB0b1xuICAgICAgICAgICAgICAgIC8vIHVzZSB0aGUgdW5zdXBwb3J0ZWQgY2FsbGJhY2sgYW55bW9yZS5cblxuICAgICAgICAgICAgICAgIG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGEubm9DYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLm5vQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MpO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncywgbWFrZUNhbGxiYWNrKHtcbiAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgIHJlamVjdFxuICAgICAgICAgICAgICB9LCBtZXRhZGF0YSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIC8qKlxuICAgICAgICogV3JhcHMgYW4gZXhpc3RpbmcgbWV0aG9kIG9mIHRoZSB0YXJnZXQgb2JqZWN0LCBzbyB0aGF0IGNhbGxzIHRvIGl0IGFyZVxuICAgICAgICogaW50ZXJjZXB0ZWQgYnkgdGhlIGdpdmVuIHdyYXBwZXIgZnVuY3Rpb24uIFRoZSB3cmFwcGVyIGZ1bmN0aW9uIHJlY2VpdmVzLFxuICAgICAgICogYXMgaXRzIGZpcnN0IGFyZ3VtZW50LCB0aGUgb3JpZ2luYWwgYHRhcmdldGAgb2JqZWN0LCBmb2xsb3dlZCBieSBlYWNoIG9mXG4gICAgICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgb3JpZ2luYWwgbWV0aG9kLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAgICAgICAqICAgICAgICBUaGUgb3JpZ2luYWwgdGFyZ2V0IG9iamVjdCB0aGF0IHRoZSB3cmFwcGVkIG1ldGhvZCBiZWxvbmdzIHRvLlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWV0aG9kXG4gICAgICAgKiAgICAgICAgVGhlIG1ldGhvZCBiZWluZyB3cmFwcGVkLiBUaGlzIGlzIHVzZWQgYXMgdGhlIHRhcmdldCBvZiB0aGUgUHJveHlcbiAgICAgICAqICAgICAgICBvYmplY3Qgd2hpY2ggaXMgY3JlYXRlZCB0byB3cmFwIHRoZSBtZXRob2QuXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB3cmFwcGVyXG4gICAgICAgKiAgICAgICAgVGhlIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggaXMgY2FsbGVkIGluIHBsYWNlIG9mIGEgZGlyZWN0IGludm9jYXRpb25cbiAgICAgICAqICAgICAgICBvZiB0aGUgd3JhcHBlZCBtZXRob2QuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge1Byb3h5PGZ1bmN0aW9uPn1cbiAgICAgICAqICAgICAgICBBIFByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCwgd2hpY2ggaW52b2tlcyB0aGUgZ2l2ZW4gd3JhcHBlclxuICAgICAgICogICAgICAgIG1ldGhvZCBpbiBpdHMgcGxhY2UuXG4gICAgICAgKi9cblxuXG4gICAgICBjb25zdCB3cmFwTWV0aG9kID0gKHRhcmdldCwgbWV0aG9kLCB3cmFwcGVyKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkobWV0aG9kLCB7XG4gICAgICAgICAgYXBwbHkodGFyZ2V0TWV0aG9kLCB0aGlzT2JqLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlci5jYWxsKHRoaXNPYmosIHRhcmdldCwgLi4uYXJncyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgbGV0IGhhc093blByb3BlcnR5ID0gRnVuY3Rpb24uY2FsbC5iaW5kKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuICAgICAgLyoqXG4gICAgICAgKiBXcmFwcyBhbiBvYmplY3QgaW4gYSBQcm94eSB3aGljaCBpbnRlcmNlcHRzIGFuZCB3cmFwcyBjZXJ0YWluIG1ldGhvZHNcbiAgICAgICAqIGJhc2VkIG9uIHRoZSBnaXZlbiBgd3JhcHBlcnNgIGFuZCBgbWV0YWRhdGFgIG9iamVjdHMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAgICogICAgICAgIFRoZSB0YXJnZXQgb2JqZWN0IHRvIHdyYXAuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IFt3cmFwcGVycyA9IHt9XVxuICAgICAgICogICAgICAgIEFuIG9iamVjdCB0cmVlIGNvbnRhaW5pbmcgd3JhcHBlciBmdW5jdGlvbnMgZm9yIHNwZWNpYWwgY2FzZXMuIEFueVxuICAgICAgICogICAgICAgIGZ1bmN0aW9uIHByZXNlbnQgaW4gdGhpcyBvYmplY3QgdHJlZSBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgdGhlXG4gICAgICAgKiAgICAgICAgbWV0aG9kIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZS4gVGhlc2VcbiAgICAgICAqICAgICAgICB3cmFwcGVyIG1ldGhvZHMgYXJlIGludm9rZWQgYXMgZGVzY3JpYmVkIGluIHtAc2VlIHdyYXBNZXRob2R9LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbbWV0YWRhdGEgPSB7fV1cbiAgICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIG1ldGFkYXRhIHVzZWQgdG8gYXV0b21hdGljYWxseSBnZW5lcmF0ZVxuICAgICAgICogICAgICAgIFByb21pc2UtYmFzZWQgd3JhcHBlciBmdW5jdGlvbnMgZm9yIGFzeW5jaHJvbm91cy4gQW55IGZ1bmN0aW9uIGluXG4gICAgICAgKiAgICAgICAgdGhlIGB0YXJnZXRgIG9iamVjdCB0cmVlIHdoaWNoIGhhcyBhIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgb2JqZWN0XG4gICAgICAgKiAgICAgICAgaW4gdGhlIHNhbWUgbG9jYXRpb24gaW4gdGhlIGBtZXRhZGF0YWAgdHJlZSBpcyByZXBsYWNlZCB3aXRoIGFuXG4gICAgICAgKiAgICAgICAgYXV0b21hdGljYWxseS1nZW5lcmF0ZWQgd3JhcHBlciBmdW5jdGlvbiwgYXMgZGVzY3JpYmVkIGluXG4gICAgICAgKiAgICAgICAge0BzZWUgd3JhcEFzeW5jRnVuY3Rpb259XG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge1Byb3h5PG9iamVjdD59XG4gICAgICAgKi9cblxuICAgICAgY29uc3Qgd3JhcE9iamVjdCA9ICh0YXJnZXQsIHdyYXBwZXJzID0ge30sIG1ldGFkYXRhID0ge30pID0+IHtcbiAgICAgICAgbGV0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgbGV0IGhhbmRsZXJzID0ge1xuICAgICAgICAgIGhhcyhwcm94eVRhcmdldCwgcHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb3AgaW4gdGFyZ2V0IHx8IHByb3AgaW4gY2FjaGU7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIGdldChwcm94eVRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWNoZVtwcm9wXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEocHJvcCBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRhcmdldFtwcm9wXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBtZXRob2Qgb24gdGhlIHVuZGVybHlpbmcgb2JqZWN0LiBDaGVjayBpZiB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAgIC8vIGFueSB3cmFwcGluZy5cbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3cmFwcGVyc1twcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHNwZWNpYWwtY2FzZSB3cmFwcGVyIGZvciB0aGlzIG1ldGhvZC5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBNZXRob2QodGFyZ2V0LCB0YXJnZXRbcHJvcF0sIHdyYXBwZXJzW3Byb3BdKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFuIGFzeW5jIG1ldGhvZCB0aGF0IHdlIGhhdmUgbWV0YWRhdGEgZm9yLiBDcmVhdGUgYVxuICAgICAgICAgICAgICAgIC8vIFByb21pc2Ugd3JhcHBlciBmb3IgaXQuXG4gICAgICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSB3cmFwQXN5bmNGdW5jdGlvbihwcm9wLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwTWV0aG9kKHRhcmdldCwgdGFyZ2V0W3Byb3BdLCB3cmFwcGVyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWV0aG9kIHRoYXQgd2UgZG9uJ3Qga25vdyBvciBjYXJlIGFib3V0LiBSZXR1cm4gdGhlXG4gICAgICAgICAgICAgICAgLy8gb3JpZ2luYWwgbWV0aG9kLCBib3VuZCB0byB0aGUgdW5kZXJseWluZyBvYmplY3QuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5iaW5kKHRhcmdldCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIChoYXNPd25Qcm9wZXJ0eSh3cmFwcGVycywgcHJvcCkgfHwgaGFzT3duUHJvcGVydHkobWV0YWRhdGEsIHByb3ApKSkge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFuIG9iamVjdCB0aGF0IHdlIG5lZWQgdG8gZG8gc29tZSB3cmFwcGluZyBmb3IgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICAgIC8vIG9mLiBDcmVhdGUgYSBzdWItb2JqZWN0IHdyYXBwZXIgZm9yIGl0IHdpdGggdGhlIGFwcHJvcHJpYXRlIGNoaWxkXG4gICAgICAgICAgICAgIC8vIG1ldGFkYXRhLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIipcIikpIHtcbiAgICAgICAgICAgICAgLy8gV3JhcCBhbGwgcHJvcGVydGllcyBpbiAqIG5hbWVzcGFjZS5cbiAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwT2JqZWN0KHZhbHVlLCB3cmFwcGVyc1twcm9wXSwgbWV0YWRhdGFbXCIqXCJdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gZG8gYW55IHdyYXBwaW5nIGZvciB0aGlzIHByb3BlcnR5LFxuICAgICAgICAgICAgICAvLyBzbyBqdXN0IGZvcndhcmQgYWxsIGFjY2VzcyB0byB0aGUgdW5kZXJseWluZyBvYmplY3QuXG4gICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwge1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgc2V0KHByb3h5VGFyZ2V0LCBwcm9wLCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgIGNhY2hlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIGRlZmluZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wLCBkZXNjKSB7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwgZGVzYyk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIGRlbGV0ZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eShjYWNoZSwgcHJvcCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH07IC8vIFBlciBjb250cmFjdCBvZiB0aGUgUHJveHkgQVBJLCB0aGUgXCJnZXRcIiBwcm94eSBoYW5kbGVyIG11c3QgcmV0dXJuIHRoZVxuICAgICAgICAvLyBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgdGFyZ2V0IGlmIHRoYXQgdmFsdWUgaXMgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZFxuICAgICAgICAvLyBub24tY29uZmlndXJhYmxlLiBGb3IgdGhpcyByZWFzb24sIHdlIGNyZWF0ZSBhbiBvYmplY3Qgd2l0aCB0aGVcbiAgICAgICAgLy8gcHJvdG90eXBlIHNldCB0byBgdGFyZ2V0YCBpbnN0ZWFkIG9mIHVzaW5nIGB0YXJnZXRgIGRpcmVjdGx5LlxuICAgICAgICAvLyBPdGhlcndpc2Ugd2UgY2Fubm90IHJldHVybiBhIGN1c3RvbSBvYmplY3QgZm9yIEFQSXMgdGhhdFxuICAgICAgICAvLyBhcmUgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZCBub24tY29uZmlndXJhYmxlLCBzdWNoIGFzIGBjaHJvbWUuZGV2dG9vbHNgLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHJveHkgaGFuZGxlcnMgdGhlbXNlbHZlcyB3aWxsIHN0aWxsIHVzZSB0aGUgb3JpZ2luYWwgYHRhcmdldGBcbiAgICAgICAgLy8gaW5zdGVhZCBvZiB0aGUgYHByb3h5VGFyZ2V0YCwgc28gdGhhdCB0aGUgbWV0aG9kcyBhbmQgcHJvcGVydGllcyBhcmVcbiAgICAgICAgLy8gZGVyZWZlcmVuY2VkIHZpYSB0aGUgb3JpZ2luYWwgdGFyZ2V0cy5cblxuICAgICAgICBsZXQgcHJveHlUYXJnZXQgPSBPYmplY3QuY3JlYXRlKHRhcmdldCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkocHJveHlUYXJnZXQsIGhhbmRsZXJzKTtcbiAgICAgIH07XG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYSBzZXQgb2Ygd3JhcHBlciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IG9iamVjdCwgd2hpY2ggaGFuZGxlc1xuICAgICAgICogd3JhcHBpbmcgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRoYXQgdGhvc2UgbWVzc2FnZXMgYXJlIHBhc3NlZC5cbiAgICAgICAqXG4gICAgICAgKiBBIHNpbmdsZSB3cmFwcGVyIGlzIGNyZWF0ZWQgZm9yIGVhY2ggbGlzdGVuZXIgZnVuY3Rpb24sIGFuZCBzdG9yZWQgaW4gYVxuICAgICAgICogbWFwLiBTdWJzZXF1ZW50IGNhbGxzIHRvIGBhZGRMaXN0ZW5lcmAsIGBoYXNMaXN0ZW5lcmAsIG9yIGByZW1vdmVMaXN0ZW5lcmBcbiAgICAgICAqIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB3cmFwcGVyLCBzbyB0aGF0ICBhdHRlbXB0cyB0byByZW1vdmUgYVxuICAgICAgICogcHJldmlvdXNseS1hZGRlZCBsaXN0ZW5lciB3b3JrIGFzIGV4cGVjdGVkLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7RGVmYXVsdFdlYWtNYXA8ZnVuY3Rpb24sIGZ1bmN0aW9uPn0gd3JhcHBlck1hcFxuICAgICAgICogICAgICAgIEEgRGVmYXVsdFdlYWtNYXAgb2JqZWN0IHdoaWNoIHdpbGwgY3JlYXRlIHRoZSBhcHByb3ByaWF0ZSB3cmFwcGVyXG4gICAgICAgKiAgICAgICAgZm9yIGEgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gd2hlbiBvbmUgZG9lcyBub3QgZXhpc3QsIGFuZCByZXRyaWV2ZVxuICAgICAgICogICAgICAgIGFuIGV4aXN0aW5nIG9uZSB3aGVuIGl0IGRvZXMuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgICAqL1xuXG5cbiAgICAgIGNvbnN0IHdyYXBFdmVudCA9IHdyYXBwZXJNYXAgPT4gKHtcbiAgICAgICAgYWRkTGlzdGVuZXIodGFyZ2V0LCBsaXN0ZW5lciwgLi4uYXJncykge1xuICAgICAgICAgIHRhcmdldC5hZGRMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lciksIC4uLmFyZ3MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhc0xpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0Lmhhc0xpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlTGlzdGVuZXIodGFyZ2V0LCBsaXN0ZW5lcikge1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lcikpO1xuICAgICAgICB9XG5cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBvblJlcXVlc3RGaW5pc2hlZFdyYXBwZXJzID0gbmV3IERlZmF1bHRXZWFrTWFwKGxpc3RlbmVyID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXcmFwcyBhbiBvblJlcXVlc3RGaW5pc2hlZCBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IHdpbGwgcmV0dXJuIGFcbiAgICAgICAgICogYGdldENvbnRlbnQoKWAgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIGBQcm9taXNlYCByYXRoZXIgdGhhbiB1c2luZyBhXG4gICAgICAgICAqIGNhbGxiYWNrIEFQSS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgICAgICAgKiAgICAgICAgVGhlIEhBUiBlbnRyeSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBuZXR3b3JrIHJlcXVlc3QuXG4gICAgICAgICAqL1xuXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG9uUmVxdWVzdEZpbmlzaGVkKHJlcSkge1xuICAgICAgICAgIGNvbnN0IHdyYXBwZWRSZXEgPSB3cmFwT2JqZWN0KHJlcSwge31cbiAgICAgICAgICAvKiB3cmFwcGVycyAqL1xuICAgICAgICAgICwge1xuICAgICAgICAgICAgZ2V0Q29udGVudDoge1xuICAgICAgICAgICAgICBtaW5BcmdzOiAwLFxuICAgICAgICAgICAgICBtYXhBcmdzOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGlzdGVuZXIod3JhcHBlZFJlcSk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uTWVzc2FnZVdyYXBwZXJzID0gbmV3IERlZmF1bHRXZWFrTWFwKGxpc3RlbmVyID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXcmFwcyBhIG1lc3NhZ2UgbGlzdGVuZXIgZnVuY3Rpb24gc28gdGhhdCBpdCBtYXkgc2VuZCByZXNwb25zZXMgYmFzZWQgb25cbiAgICAgICAgICogaXRzIHJldHVybiB2YWx1ZSwgcmF0aGVyIHRoYW4gYnkgcmV0dXJuaW5nIGEgc2VudGluZWwgdmFsdWUgYW5kIGNhbGxpbmcgYVxuICAgICAgICAgKiBjYWxsYmFjay4gSWYgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHJldHVybnMgYSBQcm9taXNlLCB0aGUgcmVzcG9uc2UgaXNcbiAgICAgICAgICogc2VudCB3aGVuIHRoZSBwcm9taXNlIGVpdGhlciByZXNvbHZlcyBvciByZWplY3RzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0geyp9IG1lc3NhZ2VcbiAgICAgICAgICogICAgICAgIFRoZSBtZXNzYWdlIHNlbnQgYnkgdGhlIG90aGVyIGVuZCBvZiB0aGUgY2hhbm5lbC5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHNlbmRlclxuICAgICAgICAgKiAgICAgICAgRGV0YWlscyBhYm91dCB0aGUgc2VuZGVyIG9mIHRoZSBtZXNzYWdlLlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCopfSBzZW5kUmVzcG9uc2VcbiAgICAgICAgICogICAgICAgIEEgY2FsbGJhY2sgd2hpY2gsIHdoZW4gY2FsbGVkIHdpdGggYW4gYXJiaXRyYXJ5IGFyZ3VtZW50LCBzZW5kc1xuICAgICAgICAgKiAgICAgICAgdGhhdCB2YWx1ZSBhcyBhIHJlc3BvbnNlLlxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICogICAgICAgIFRydWUgaWYgdGhlIHdyYXBwZWQgbGlzdGVuZXIgcmV0dXJuZWQgYSBQcm9taXNlLCB3aGljaCB3aWxsIGxhdGVyXG4gICAgICAgICAqICAgICAgICB5aWVsZCBhIHJlc3BvbnNlLiBGYWxzZSBvdGhlcndpc2UuXG4gICAgICAgICAqL1xuXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG9uTWVzc2FnZShtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICAgICAgICAgIGxldCBkaWRDYWxsU2VuZFJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHdyYXBwZWRTZW5kUmVzcG9uc2U7XG4gICAgICAgICAgbGV0IHNlbmRSZXNwb25zZVByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHdyYXBwZWRTZW5kUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgZGlkQ2FsbFNlbmRSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsZXQgcmVzdWx0O1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGxpc3RlbmVyKG1lc3NhZ2UsIHNlbmRlciwgd3JhcHBlZFNlbmRSZXNwb25zZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGlzUmVzdWx0VGhlbmFibGUgPSByZXN1bHQgIT09IHRydWUgJiYgaXNUaGVuYWJsZShyZXN1bHQpOyAvLyBJZiB0aGUgbGlzdGVuZXIgZGlkbid0IHJldHVybmVkIHRydWUgb3IgYSBQcm9taXNlLCBvciBjYWxsZWRcbiAgICAgICAgICAvLyB3cmFwcGVkU2VuZFJlc3BvbnNlIHN5bmNocm9ub3VzbHksIHdlIGNhbiBleGl0IGVhcmxpZXJcbiAgICAgICAgICAvLyBiZWNhdXNlIHRoZXJlIHdpbGwgYmUgbm8gcmVzcG9uc2Ugc2VudCBmcm9tIHRoaXMgbGlzdGVuZXIuXG5cbiAgICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlICYmICFpc1Jlc3VsdFRoZW5hYmxlICYmICFkaWRDYWxsU2VuZFJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSAvLyBBIHNtYWxsIGhlbHBlciB0byBzZW5kIHRoZSBtZXNzYWdlIGlmIHRoZSBwcm9taXNlIHJlc29sdmVzXG4gICAgICAgICAgLy8gYW5kIGFuIGVycm9yIGlmIHRoZSBwcm9taXNlIHJlamVjdHMgKGEgd3JhcHBlZCBzZW5kTWVzc2FnZSBoYXNcbiAgICAgICAgICAvLyB0byB0cmFuc2xhdGUgdGhlIG1lc3NhZ2UgaW50byBhIHJlc29sdmVkIHByb21pc2Ugb3IgYSByZWplY3RlZFxuICAgICAgICAgIC8vIHByb21pc2UpLlxuXG5cbiAgICAgICAgICBjb25zdCBzZW5kUHJvbWlzZWRSZXN1bHQgPSBwcm9taXNlID0+IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihtc2cgPT4ge1xuICAgICAgICAgICAgICAvLyBzZW5kIHRoZSBtZXNzYWdlIHZhbHVlLlxuICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UobXNnKTtcbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgLy8gU2VuZCBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIGVycm9yIGlmIHRoZSByZWplY3RlZCB2YWx1ZVxuICAgICAgICAgICAgICAvLyBpcyBhbiBpbnN0YW5jZSBvZiBlcnJvciwgb3IgdGhlIG9iamVjdCBpdHNlbGYgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICBsZXQgbWVzc2FnZTtcblxuICAgICAgICAgICAgICBpZiAoZXJyb3IgJiYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgfHwgdHlwZW9mIGVycm9yLm1lc3NhZ2UgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZFwiO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICBfX21veldlYkV4dGVuc2lvblBvbHlmaWxsUmVqZWN0X186IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIC8vIFByaW50IGFuIGVycm9yIG9uIHRoZSBjb25zb2xlIGlmIHVuYWJsZSB0byBzZW5kIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzZW5kIG9uTWVzc2FnZSByZWplY3RlZCByZXBseVwiLCBlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTsgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybmVkIGEgUHJvbWlzZSwgc2VuZCB0aGUgcmVzb2x2ZWQgdmFsdWUgYXMgYVxuICAgICAgICAgIC8vIHJlc3VsdCwgb3RoZXJ3aXNlIHdhaXQgdGhlIHByb21pc2UgcmVsYXRlZCB0byB0aGUgd3JhcHBlZFNlbmRSZXNwb25zZVxuICAgICAgICAgIC8vIGNhbGxiYWNrIHRvIHJlc29sdmUgYW5kIHNlbmQgaXQgYXMgYSByZXNwb25zZS5cblxuXG4gICAgICAgICAgaWYgKGlzUmVzdWx0VGhlbmFibGUpIHtcbiAgICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChyZXN1bHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kUHJvbWlzZWRSZXN1bHQoc2VuZFJlc3BvbnNlUHJvbWlzZSk7XG4gICAgICAgICAgfSAvLyBMZXQgQ2hyb21lIGtub3cgdGhhdCB0aGUgbGlzdGVuZXIgaXMgcmVwbHlpbmcuXG5cblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHdyYXBwZWRTZW5kTWVzc2FnZUNhbGxiYWNrID0gKHtcbiAgICAgICAgcmVqZWN0LFxuICAgICAgICByZXNvbHZlXG4gICAgICB9LCByZXBseSkgPT4ge1xuICAgICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgIC8vIERldGVjdCB3aGVuIG5vbmUgb2YgdGhlIGxpc3RlbmVycyByZXBsaWVkIHRvIHRoZSBzZW5kTWVzc2FnZSBjYWxsIGFuZCByZXNvbHZlXG4gICAgICAgICAgLy8gdGhlIHByb21pc2UgdG8gdW5kZWZpbmVkIGFzIGluIEZpcmVmb3guXG4gICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3dlYmV4dGVuc2lvbi1wb2x5ZmlsbC9pc3N1ZXMvMTMwXG4gICAgICAgICAgaWYgKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSA9PT0gQ0hST01FX1NFTkRfTUVTU0FHRV9DQUxMQkFDS19OT19SRVNQT05TRV9NRVNTQUdFKSB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlcGx5ICYmIHJlcGx5Ll9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXykge1xuICAgICAgICAgIC8vIENvbnZlcnQgYmFjayB0aGUgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IgaW50b1xuICAgICAgICAgIC8vIGFuIEVycm9yIGluc3RhbmNlLlxuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVwbHkubWVzc2FnZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUocmVwbHkpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCB3cmFwcGVkU2VuZE1lc3NhZ2UgPSAobmFtZSwgbWV0YWRhdGEsIGFwaU5hbWVzcGFjZU9iaiwgLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPCBtZXRhZGF0YS5taW5BcmdzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IG1vc3QgJHttZXRhZGF0YS5tYXhBcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5tYXhBcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHdyYXBwZWRDYiA9IHdyYXBwZWRTZW5kTWVzc2FnZUNhbGxiYWNrLmJpbmQobnVsbCwge1xuICAgICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAgIHJlamVjdFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFyZ3MucHVzaCh3cmFwcGVkQ2IpO1xuICAgICAgICAgIGFwaU5hbWVzcGFjZU9iai5zZW5kTWVzc2FnZSguLi5hcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBzdGF0aWNXcmFwcGVycyA9IHtcbiAgICAgICAgZGV2dG9vbHM6IHtcbiAgICAgICAgICBuZXR3b3JrOiB7XG4gICAgICAgICAgICBvblJlcXVlc3RGaW5pc2hlZDogd3JhcEV2ZW50KG9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMpXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBydW50aW1lOiB7XG4gICAgICAgICAgb25NZXNzYWdlOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICAgIG9uTWVzc2FnZUV4dGVybmFsOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHtcbiAgICAgICAgICAgIG1pbkFyZ3M6IDEsXG4gICAgICAgICAgICBtYXhBcmdzOiAzXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgdGFiczoge1xuICAgICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHtcbiAgICAgICAgICAgIG1pbkFyZ3M6IDIsXG4gICAgICAgICAgICBtYXhBcmdzOiAzXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHNldHRpbmdNZXRhZGF0YSA9IHtcbiAgICAgICAgY2xlYXI6IHtcbiAgICAgICAgICBtaW5BcmdzOiAxLFxuICAgICAgICAgIG1heEFyZ3M6IDFcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgbWluQXJnczogMSxcbiAgICAgICAgICBtYXhBcmdzOiAxXG4gICAgICAgIH0sXG4gICAgICAgIHNldDoge1xuICAgICAgICAgIG1pbkFyZ3M6IDEsXG4gICAgICAgICAgbWF4QXJnczogMVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgYXBpTWV0YWRhdGEucHJpdmFjeSA9IHtcbiAgICAgICAgbmV0d29yazoge1xuICAgICAgICAgIFwiKlwiOiBzZXR0aW5nTWV0YWRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmljZXM6IHtcbiAgICAgICAgICBcIipcIjogc2V0dGluZ01ldGFkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHdlYnNpdGVzOiB7XG4gICAgICAgICAgXCIqXCI6IHNldHRpbmdNZXRhZGF0YVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHdyYXBPYmplY3QoZXh0ZW5zaW9uQVBJcywgc3RhdGljV3JhcHBlcnMsIGFwaU1ldGFkYXRhKTtcbiAgICB9OyAvLyBUaGUgYnVpbGQgcHJvY2VzcyBhZGRzIGEgVU1EIHdyYXBwZXIgYXJvdW5kIHRoaXMgZmlsZSwgd2hpY2ggbWFrZXMgdGhlXG4gICAgLy8gYG1vZHVsZWAgdmFyaWFibGUgYXZhaWxhYmxlLlxuXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdyYXBBUElzKGNocm9tZSk7XG4gIH0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxUaGlzLmJyb3dzZXI7XG4gIH1cbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnJvd3Nlci1wb2x5ZmlsbC5qcy5tYXBcbiIsImltcG9ydCB7XG4gIF9fc3ByZWFkUHJvcHMsXG4gIF9fc3ByZWFkVmFsdWVzLFxuICBkZWZpbmVHZW5lcmljTWVzc2FuZ2luZ1xufSBmcm9tIFwiLi9jaHVuay1CUUxGU0ZGWi5qc1wiO1xuXG4vLyBzcmMvZXh0ZW5zaW9uLnRzXG5pbXBvcnQgQnJvd3NlciBmcm9tIFwid2ViZXh0ZW5zaW9uLXBvbHlmaWxsXCI7XG5mdW5jdGlvbiBkZWZpbmVFeHRlbnNpb25NZXNzYWdpbmcoY29uZmlnKSB7XG4gIHJldHVybiBkZWZpbmVHZW5lcmljTWVzc2FuZ2luZyhfX3NwcmVhZFByb3BzKF9fc3ByZWFkVmFsdWVzKHt9LCBjb25maWcpLCB7XG4gICAgc2VuZE1lc3NhZ2UobWVzc2FnZSwgYXJnKSB7XG4gICAgICBpZiAoYXJnID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIEJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB0eXBlb2YgYXJnID09PSBcIm51bWJlclwiID8geyB0YWJJZDogYXJnIH0gOiBhcmc7XG4gICAgICByZXR1cm4gQnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKFxuICAgICAgICBvcHRpb25zLnRhYklkLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICAvLyBQYXNzIGZyYW1lSWQgaWYgc3BlY2lmaWVkXG4gICAgICAgIG9wdGlvbnMuZnJhbWVJZCAhPSBudWxsID8geyBmcmFtZUlkOiBvcHRpb25zLmZyYW1lSWQgfSA6IHZvaWQgMFxuICAgICAgKTtcbiAgICB9LFxuICAgIGFkZFJvb3RMaXN0ZW5lcihwcm9jZXNzTWVzc2FnZSkge1xuICAgICAgY29uc3QgbGlzdGVuZXIgPSAobWVzc2FnZSwgc2VuZGVyKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc01lc3NhZ2UoX19zcHJlYWRQcm9wcyhfX3NwcmVhZFZhbHVlcyh7fSwgbWVzc2FnZSksIHsgc2VuZGVyIH0pKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwcm9jZXNzTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH07XG4gICAgICBCcm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBCcm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB9XG4gIH0pKTtcbn1cbmV4cG9ydCB7XG4gIGRlZmluZUV4dGVuc2lvbk1lc3NhZ2luZ1xufTtcbiIsImltcG9ydCB7IGRlZmluZUV4dGVuc2lvbk1lc3NhZ2luZyB9IGZyb20gXCJAd2ViZXh0LWNvcmUvbWVzc2FnaW5nXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV29ya3NwYWNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBzbHVnOiBzdHJpbmc7XG4gIHJvbGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGb2xkZXJSb3cge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHBhcmVudElkOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVSb3cge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgbWltZVR5cGU6IHN0cmluZztcbiAgZm9sZGVySWQ6IHN0cmluZyB8IG51bGw7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFkY3J1bWIge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIEFwaVJlc3VsdDxUPiA9XG4gIHwgeyBvazogdHJ1ZTsgZGF0YTogVCB9XG4gIHwgeyBvazogZmFsc2U7IGVycm9yOiBzdHJpbmc7IHN0YXR1cz86IG51bWJlciB9O1xuXG5pbnRlcmZhY2UgUHJvdG9jb2xNYXAge1xuICAvLyBBdXRoIGhhbmRzaGFrZVxuICBnZXRTaWduZWRJbigpOiBib29sZWFuO1xuICByZWZyZXNoU2Vzc2lvbigpOiBib29sZWFuO1xuICBzaWduT3V0KCk6IGJvb2xlYW47XG5cbiAgLy8gV29ya3NwYWNlICsgYnJvd3NlXG4gIGxpc3RXb3Jrc3BhY2VzKCk6IEFwaVJlc3VsdDxXb3Jrc3BhY2VbXT47XG4gIHNldEFjdGl2ZVdvcmtzcGFjZShkYXRhOiB7IHNsdWc6IHN0cmluZyB9KTogYm9vbGVhbjtcbiAgZ2V0QWN0aXZlV29ya3NwYWNlKCk6IHN0cmluZyB8IG51bGw7XG4gIGxpc3RGb2xkZXIoZGF0YToge1xuICAgIHdvcmtzcGFjZVNsdWc6IHN0cmluZztcbiAgICBmb2xkZXJJZDogc3RyaW5nIHwgbnVsbDtcbiAgICAvLyBIVE1MNSBpbnB1dC5hY2NlcHQgdG9rZW5zIGZvcndhcmRlZCBhcy1pcy4gRmlsdGVyaW5nIGhhcHBlbnMgc2VydmVyLVxuICAgIC8vIHNpZGUgaW4gZmlsZXMubGlzdCDigJQgZm9sZGVycyBhcmUgbmV2ZXIgZmlsdGVyZWQgYnkgYWNjZXB0IHNpbmNlIHlvdVxuICAgIC8vIG1heSBuZWVkIHRvIGRyaWxsIGludG8gYSBzdWJmb2xkZXIgdG8gZmluZCBhIG1hdGNoaW5nIGZpbGUuXG4gICAgYWNjZXB0Pzogc3RyaW5nW107XG4gIH0pOiBBcGlSZXN1bHQ8e1xuICAgIGZvbGRlcnM6IEZvbGRlclJvd1tdO1xuICAgIGZpbGVzOiBGaWxlUm93W107XG4gICAgYnJlYWRjcnVtYnM6IEJyZWFkY3J1bWJbXTtcbiAgfT47XG5cbiAgLy8gRm9yIHRoZSBjb250ZW50LXNjcmlwdCBwaWNrZXI6IGhhbmQgYmFjayBhIGJhc2U2NCBkYXRhIFVSTCB0aGUgcGFnZSBjYW5cbiAgLy8gdHVybiBpbnRvIGEgRmlsZS4gR29pbmcgdGhyb3VnaCBiYXNlNjQga2VlcHMgdGhlIHBvc3RNZXNzYWdlIHBhdGggc2ltcGxlXG4gIC8vIChCbG9iIGNhbid0IGNyb3NzIHRoZSBzdHJ1Y3R1cmVkLWNsb25lIGJvdW5kYXJ5IGludG8gYWxsIGNvbnRleHRzIGNsZWFubHlcbiAgLy8gd2hlbiB0aGUgZGlhbG9nIGlzIHJlbmRlcmVkIGluc2lkZSB0aGUgcGFnZSdzIGZyYW1lKS5cbiAgZmV0Y2hGaWxlRm9yVXBsb2FkKGRhdGE6IHtcbiAgICB3b3Jrc3BhY2VTbHVnOiBzdHJpbmc7XG4gICAgZmlsZUlkOiBzdHJpbmc7XG4gIH0pOiBBcGlSZXN1bHQ8e1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBtaW1lVHlwZTogc3RyaW5nO1xuICAgIHNpemU6IG51bWJlcjtcbiAgICBkYXRhQmFzZTY0OiBzdHJpbmc7XG4gIH0+O1xuXG4gIC8vIFRoZSBHZW5lcmF0ZSBmbG93LlxuICBsaXN0R2VuZXJhdGlvblR5cGVzKCk6IEFwaVJlc3VsdDxHZW5lcmF0aW9uVHlwZVJvd1tdPjtcbiAgZ2VuZXJhdGVGaWxlKGRhdGE6IHtcbiAgICB3b3Jrc3BhY2VTbHVnOiBzdHJpbmc7XG4gICAgdHlwZUlkOiBzdHJpbmc7XG4gICAgcHJvbXB0OiBzdHJpbmc7XG4gICAgYXR0YWNobWVudHM/OiB7IG5hbWU6IHN0cmluZzsgbWltZVR5cGU6IHN0cmluZzsgZGF0YUJhc2U2NDogc3RyaW5nIH1bXTtcbiAgICBsb2NrZXJGaWxlSWRzPzogc3RyaW5nW107XG4gIH0pOiBBcGlSZXN1bHQ8e1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBtaW1lVHlwZTogc3RyaW5nO1xuICAgIHNpemU6IG51bWJlcjtcbiAgICBkYXRhQmFzZTY0OiBzdHJpbmc7XG4gIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyYXRpb25UeXBlUm93IHtcbiAgaWQ6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gIG1pbWVUeXBlOiBzdHJpbmc7XG4gIGtpbmQ6IFwidGV4dFwiIHwgXCJpbWFnZVwiO1xufVxuXG5leHBvcnQgY29uc3QgeyBzZW5kTWVzc2FnZSwgb25NZXNzYWdlIH0gPVxuICBkZWZpbmVFeHRlbnNpb25NZXNzYWdpbmc8UHJvdG9jb2xNYXA+KCk7XG4iLCJleHBvcnQgZnVuY3Rpb24gd2ViSG9zdCgpOiBzdHJpbmcge1xuICBjb25zdCBlbnYgPSBpbXBvcnQubWV0YS5lbnYgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICBjb25zdCBmcm9tRW52ID0gZW52LldYVF9QVUJMSUNfTE9DS0VSX1dFQl9IT1NUO1xuICByZXR1cm4gKGZyb21FbnYgPz8gXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIikucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xufVxuIiwiaW1wb3J0IHsgd2ViSG9zdCB9IGZyb20gXCIuL3dlYi1ob3N0XCI7XG5cbi8vIFRoZSB3ZWIgYXBwJ3MgdFJQQyBzZXJ2ZXIgaXMgY29uZmlndXJlZCB3aXRoIHRoZSBzdXBlcmpzb24gdHJhbnNmb3JtZXIuXG4vLyBUaGUgSFRUUCB3aXJlIGZvcm1hdCBmb3IgYSBzaW5nbGUgYmF0Y2hlZCBjYWxsIGlzOlxuLy8gICBHRVQgIC9hcGkvdHJwYy88cGF0aD4/YmF0Y2g9MSZpbnB1dD17XCIwXCI6e1wianNvblwiOjxpbnB1dD59fVxuLy8gICBQT1NUIC9hcGkvdHJwYy88cGF0aD4/YmF0Y2g9MSAgIGJvZHk6IHtcIjBcIjp7XCJqc29uXCI6PGlucHV0Pn19XG4vLyBhbmQgdGhlIHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGB7cmVzdWx0OntkYXRhOntqc29uLG1ldGE/fX19YCBlbnRyaWVzLlxuLy9cbi8vIEZvciB0aGUgaW5wdXRzIGFuZCBvdXRwdXRzIHdlIGFjdHVhbGx5IG5lZWQgKGZvbGRlciBsaXN0cywgZmlsZXMsIHNpZ25lZFxuLy8gVVJMcyksIG5vdGhpbmcgcmVxdWlyZXMgc3VwZXJqc29uJ3MgcmV2aXZlciBob29rcyDigJQgRGF0ZXMgY29tZSBiYWNrIGFzIElTT1xuLy8gc3RyaW5ncyBpbnNpZGUgdGhlIGBqc29uYCBwYXlsb2FkIGFuZCB3ZSBrZWVwIHRoZW0gYXMgc3RyaW5ncy4gU28gd2Ugc2VuZFxuLy8gYHsganNvbjogaW5wdXQgfWAgd2l0aCBubyBtZXRhIGFuZCByZWFkIGJhY2sgYGRhdGEuanNvbmAgZGlyZWN0bHkuIElmIGFcbi8vIGZ1dHVyZSBjYWxsIGV2ZXIgbmVlZHMgRGF0ZSByb3VuZC10cmlwcGluZyB3ZSBjYW4gcGx1ZyBpbiBzdXBlcmpzb24gdGhlbi5cblxuaW50ZXJmYWNlIFRycGNPcHRpb25zIHtcbiAgd29ya3NwYWNlU2x1Zz86IHN0cmluZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG59XG5cbmV4cG9ydCBjbGFzcyBUcnBjRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBwdWJsaWMgc3RhdHVzOiBudW1iZXIsXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkSGVhZGVycyhvcHRzOiBUcnBjT3B0aW9ucyk6IEhlYWRlcnNJbml0IHtcbiAgY29uc3QgaDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgfTtcbiAgaWYgKG9wdHMud29ya3NwYWNlU2x1ZykgaFtcIngtd29ya3NwYWNlLXNsdWdcIl0gPSBvcHRzLndvcmtzcGFjZVNsdWc7XG4gIHJldHVybiBoO1xufVxuXG5mdW5jdGlvbiB1bndyYXBCYXRjaDxUPihib2R5OiB1bmtub3duKTogVCB7XG4gIGlmICghQXJyYXkuaXNBcnJheShib2R5KSkge1xuICAgIHRocm93IG5ldyBUcnBjRXJyb3IoXCJNYWxmb3JtZWQgdFJQQyByZXNwb25zZVwiLCAwKTtcbiAgfVxuICBjb25zdCBlbnRyeSA9IGJvZHlbMF0gYXNcbiAgICB8IHtcbiAgICAgICAgcmVzdWx0PzogeyBkYXRhPzogeyBqc29uOiB1bmtub3duIH0gfTtcbiAgICAgICAgZXJyb3I/OiB7IGpzb24/OiB7IG1lc3NhZ2U/OiBzdHJpbmcgfTsgbWVzc2FnZT86IHN0cmluZyB9O1xuICAgICAgfVxuICAgIHwgdW5kZWZpbmVkO1xuICBpZiAoIWVudHJ5KSB0aHJvdyBuZXcgVHJwY0Vycm9yKFwiRW1wdHkgdFJQQyBiYXRjaCByZXNwb25zZVwiLCAwKTtcbiAgaWYgKGVudHJ5LmVycm9yKSB7XG4gICAgY29uc3QgbXNnID1cbiAgICAgIGVudHJ5LmVycm9yLmpzb24/Lm1lc3NhZ2UgPz8gZW50cnkuZXJyb3IubWVzc2FnZSA/PyBcInRSUEMgZXJyb3JcIjtcbiAgICB0aHJvdyBuZXcgVHJwY0Vycm9yKG1zZywgMCk7XG4gIH1cbiAgaWYgKCFlbnRyeS5yZXN1bHQ/LmRhdGEpIHRocm93IG5ldyBUcnBjRXJyb3IoXCJNaXNzaW5nIHRSUEMgcmVzdWx0XCIsIDApO1xuICByZXR1cm4gZW50cnkucmVzdWx0LmRhdGEuanNvbiBhcyBUO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJwY1F1ZXJ5PFQ+KFxuICBwYXRoOiBzdHJpbmcsXG4gIGlucHV0OiB1bmtub3duLFxuICBvcHRzOiBUcnBjT3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoYCR7d2ViSG9zdCgpfS9hcGkvdHJwYy8ke3BhdGh9YCk7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwiYmF0Y2hcIiwgXCIxXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcImlucHV0XCIsIEpTT04uc3RyaW5naWZ5KHsgXCIwXCI6IHsganNvbjogaW5wdXQgfSB9KSk7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybC50b1N0cmluZygpLCB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICBoZWFkZXJzOiBidWlsZEhlYWRlcnMob3B0cyksXG4gICAgc2lnbmFsOiBvcHRzLnNpZ25hbCxcbiAgfSk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBUcnBjRXJyb3IoXCJOb3Qgc2lnbmVkIGluXCIsIDQwMSk7XG4gIGlmICghcmVzLm9rKVxuICAgIHRocm93IG5ldyBUcnBjRXJyb3IoYHRSUEMgJHtwYXRofSBmYWlsZWQ6ICR7cmVzLnN0YXR1c31gLCByZXMuc3RhdHVzKTtcbiAgcmV0dXJuIHVud3JhcEJhdGNoPFQ+KGF3YWl0IHJlcy5qc29uKCkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJwY011dGF0aW9uPFQ+KFxuICBwYXRoOiBzdHJpbmcsXG4gIGlucHV0OiB1bmtub3duLFxuICBvcHRzOiBUcnBjT3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHVybCA9IGAke3dlYkhvc3QoKX0vYXBpL3RycGMvJHtwYXRofT9iYXRjaD0xYDtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgaGVhZGVyczogYnVpbGRIZWFkZXJzKG9wdHMpLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgXCIwXCI6IHsganNvbjogaW5wdXQgfSB9KSxcbiAgICBzaWduYWw6IG9wdHMuc2lnbmFsLFxuICB9KTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IFRycGNFcnJvcihcIk5vdCBzaWduZWQgaW5cIiwgNDAxKTtcbiAgaWYgKCFyZXMub2spXG4gICAgdGhyb3cgbmV3IFRycGNFcnJvcihgdFJQQyAke3BhdGh9IGZhaWxlZDogJHtyZXMuc3RhdHVzfWAsIHJlcy5zdGF0dXMpO1xuICByZXR1cm4gdW53cmFwQmF0Y2g8VD4oYXdhaXQgcmVzLmpzb24oKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9iZVNlc3Npb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIC8vIGJldHRlci1hdXRoIGV4cG9zZXMgL2FwaS9hdXRoL2dldC1zZXNzaW9uIGZvciBjb29raWUtYmVhcmluZyBwcm9iZXMuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke3dlYkhvc3QoKX0vYXBpL2F1dGgvZ2V0LXNlc3Npb25gLCB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgfSk7XG4gIGlmICghcmVzLm9rKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKSkgYXMge1xuICAgIHVzZXI/OiB7IGlkPzogc3RyaW5nIH07XG4gIH0gfCBudWxsO1xuICByZXR1cm4gISFib2R5Py51c2VyPy5pZDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQXNCbG9iKFxuICB1cmw6IHN0cmluZyxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPEJsb2I+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIiwgc2lnbmFsIH0pO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBEb3dubG9hZCBmYWlsZWQ6ICR7cmVzLnN0YXR1c31gKTtcbiAgcmV0dXJuIHJlcy5ibG9iKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBibG9iVG9CYXNlNjQoYmxvYjogQmxvYik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGJ1ZiA9IGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWYpO1xuICBsZXQgYmluYXJ5ID0gXCJcIjtcbiAgY29uc3QgY2h1bmsgPSAweDgwMDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IGNodW5rKSB7XG4gICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoLi4uYnl0ZXMuc3ViYXJyYXkoaSwgaSArIGNodW5rKSk7XG4gIH1cbiAgcmV0dXJuIGJ0b2EoYmluYXJ5KTtcbn1cbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImNvbnN0IEVfVElNRU9VVCA9IG5ldyBFcnJvcigndGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBtdXRleCB0byBiZWNvbWUgYXZhaWxhYmxlJyk7XG5jb25zdCBFX0FMUkVBRFlfTE9DS0VEID0gbmV3IEVycm9yKCdtdXRleCBhbHJlYWR5IGxvY2tlZCcpO1xuY29uc3QgRV9DQU5DRUxFRCA9IG5ldyBFcnJvcigncmVxdWVzdCBmb3IgbG9jayBjYW5jZWxlZCcpO1xuXG52YXIgX19hd2FpdGVyJDIgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNsYXNzIFNlbWFwaG9yZSB7XG4gICAgY29uc3RydWN0b3IoX3ZhbHVlLCBfY2FuY2VsRXJyb3IgPSBFX0NBTkNFTEVEKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gX3ZhbHVlO1xuICAgICAgICB0aGlzLl9jYW5jZWxFcnJvciA9IF9jYW5jZWxFcnJvcjtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzID0gW107XG4gICAgfVxuICAgIGFjcXVpcmUod2VpZ2h0ID0gMSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXNrID0geyByZXNvbHZlLCByZWplY3QsIHdlaWdodCwgcHJpb3JpdHkgfTtcbiAgICAgICAgICAgIGNvbnN0IGkgPSBmaW5kSW5kZXhGcm9tRW5kKHRoaXMuX3F1ZXVlLCAob3RoZXIpID0+IHByaW9yaXR5IDw9IG90aGVyLnByaW9yaXR5KTtcbiAgICAgICAgICAgIGlmIChpID09PSAtMSAmJiB3ZWlnaHQgPD0gdGhpcy5fdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvLyBOZWVkcyBpbW1lZGlhdGUgZGlzcGF0Y2gsIHNraXAgdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hJdGVtKHRhc2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuc3BsaWNlKGkgKyAxLCAwLCB0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJ1bkV4Y2x1c2l2ZShjYWxsYmFja18xKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIkMih0aGlzLCBhcmd1bWVudHMsIHZvaWQgMCwgZnVuY3Rpb24qIChjYWxsYmFjaywgd2VpZ2h0ID0gMSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgICAgICBjb25zdCBbdmFsdWUsIHJlbGVhc2VdID0geWllbGQgdGhpcy5hY3F1aXJlKHdlaWdodCwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgcmVsZWFzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgd2FpdEZvclVubG9jayh3ZWlnaHQgPSAxLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgaWYgKHdlaWdodCA8PSAwKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgaWYgKHRoaXMuX2NvdWxkTG9ja0ltbWVkaWF0ZWx5KHdlaWdodCwgcHJpb3JpdHkpKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzW3dlaWdodCAtIDFdID0gW107XG4gICAgICAgICAgICAgICAgaW5zZXJ0U29ydGVkKHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSwgeyByZXNvbHZlLCBwcmlvcml0eSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWUgPD0gMDtcbiAgICB9XG4gICAgZ2V0VmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hRdWV1ZSgpO1xuICAgIH1cbiAgICByZWxlYXNlKHdlaWdodCA9IDEpIHtcbiAgICAgICAgaWYgKHdlaWdodCA8PSAwKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgKz0gd2VpZ2h0O1xuICAgICAgICB0aGlzLl9kaXNwYXRjaFF1ZXVlKCk7XG4gICAgfVxuICAgIGNhbmNlbCgpIHtcbiAgICAgICAgdGhpcy5fcXVldWUuZm9yRWFjaCgoZW50cnkpID0+IGVudHJ5LnJlamVjdCh0aGlzLl9jYW5jZWxFcnJvcikpO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIH1cbiAgICBfZGlzcGF0Y2hRdWV1ZSgpIHtcbiAgICAgICAgdGhpcy5fZHJhaW5VbmxvY2tXYWl0ZXJzKCk7XG4gICAgICAgIHdoaWxlICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwICYmIHRoaXMuX3F1ZXVlWzBdLndlaWdodCA8PSB0aGlzLl92YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hJdGVtKHRoaXMuX3F1ZXVlLnNoaWZ0KCkpO1xuICAgICAgICAgICAgdGhpcy5fZHJhaW5VbmxvY2tXYWl0ZXJzKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2Rpc3BhdGNoSXRlbShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSB0aGlzLl92YWx1ZTtcbiAgICAgICAgdGhpcy5fdmFsdWUgLT0gaXRlbS53ZWlnaHQ7XG4gICAgICAgIGl0ZW0ucmVzb2x2ZShbcHJldmlvdXNWYWx1ZSwgdGhpcy5fbmV3UmVsZWFzZXIoaXRlbS53ZWlnaHQpXSk7XG4gICAgfVxuICAgIF9uZXdSZWxlYXNlcih3ZWlnaHQpIHtcbiAgICAgICAgbGV0IGNhbGxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNhbGxlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZWxlYXNlKHdlaWdodCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIF9kcmFpblVubG9ja1dhaXRlcnMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IHdlaWdodCA9IHRoaXMuX3ZhbHVlOyB3ZWlnaHQgPiAwOyB3ZWlnaHQtLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhaXRlcnMgPSB0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0ZXJzKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB3YWl0ZXJzLmZvckVhY2goKHdhaXRlcikgPT4gd2FpdGVyLnJlc29sdmUoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzW3dlaWdodCAtIDFdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZWRQcmlvcml0eSA9IHRoaXMuX3F1ZXVlWzBdLnByaW9yaXR5O1xuICAgICAgICAgICAgZm9yIChsZXQgd2VpZ2h0ID0gdGhpcy5fdmFsdWU7IHdlaWdodCA+IDA7IHdlaWdodC0tKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FpdGVycyA9IHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAoIXdhaXRlcnMpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGkgPSB3YWl0ZXJzLmZpbmRJbmRleCgod2FpdGVyKSA9PiB3YWl0ZXIucHJpb3JpdHkgPD0gcXVldWVkUHJpb3JpdHkpO1xuICAgICAgICAgICAgICAgIChpID09PSAtMSA/IHdhaXRlcnMgOiB3YWl0ZXJzLnNwbGljZSgwLCBpKSlcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKHdhaXRlciA9PiB3YWl0ZXIucmVzb2x2ZSgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2NvdWxkTG9ja0ltbWVkaWF0ZWx5KHdlaWdodCwgcHJpb3JpdHkpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDAgfHwgdGhpcy5fcXVldWVbMF0ucHJpb3JpdHkgPCBwcmlvcml0eSkgJiZcbiAgICAgICAgICAgIHdlaWdodCA8PSB0aGlzLl92YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbnNlcnRTb3J0ZWQoYSwgdikge1xuICAgIGNvbnN0IGkgPSBmaW5kSW5kZXhGcm9tRW5kKGEsIChvdGhlcikgPT4gdi5wcmlvcml0eSA8PSBvdGhlci5wcmlvcml0eSk7XG4gICAgYS5zcGxpY2UoaSArIDEsIDAsIHYpO1xufVxuZnVuY3Rpb24gZmluZEluZGV4RnJvbUVuZChhLCBwcmVkaWNhdGUpIHtcbiAgICBmb3IgKGxldCBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAocHJlZGljYXRlKGFbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbnZhciBfX2F3YWl0ZXIkMSA9ICh1bmRlZmluZWQgJiYgdW5kZWZpbmVkLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY2xhc3MgTXV0ZXgge1xuICAgIGNvbnN0cnVjdG9yKGNhbmNlbEVycm9yKSB7XG4gICAgICAgIHRoaXMuX3NlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoMSwgY2FuY2VsRXJyb3IpO1xuICAgIH1cbiAgICBhY3F1aXJlKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyJDEodGhpcywgYXJndW1lbnRzLCB2b2lkIDAsIGZ1bmN0aW9uKiAocHJpb3JpdHkgPSAwKSB7XG4gICAgICAgICAgICBjb25zdCBbLCByZWxlYXNlcl0gPSB5aWVsZCB0aGlzLl9zZW1hcGhvcmUuYWNxdWlyZSgxLCBwcmlvcml0eSk7XG4gICAgICAgICAgICByZXR1cm4gcmVsZWFzZXI7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBydW5FeGNsdXNpdmUoY2FsbGJhY2ssIHByaW9yaXR5ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VtYXBob3JlLnJ1bkV4Y2x1c2l2ZSgoKSA9PiBjYWxsYmFjaygpLCAxLCBwcmlvcml0eSk7XG4gICAgfVxuICAgIGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VtYXBob3JlLmlzTG9ja2VkKCk7XG4gICAgfVxuICAgIHdhaXRGb3JVbmxvY2socHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZW1hcGhvcmUud2FpdEZvclVubG9jaygxLCBwcmlvcml0eSk7XG4gICAgfVxuICAgIHJlbGVhc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZW1hcGhvcmUuaXNMb2NrZWQoKSlcbiAgICAgICAgICAgIHRoaXMuX3NlbWFwaG9yZS5yZWxlYXNlKCk7XG4gICAgfVxuICAgIGNhbmNlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5jYW5jZWwoKTtcbiAgICB9XG59XG5cbnZhciBfX2F3YWl0ZXIgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmZ1bmN0aW9uIHdpdGhUaW1lb3V0KHN5bmMsIHRpbWVvdXQsIHRpbWVvdXRFcnJvciA9IEVfVElNRU9VVCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFjcXVpcmU6ICh3ZWlnaHRPclByaW9yaXR5LCBwcmlvcml0eSkgPT4ge1xuICAgICAgICAgICAgbGV0IHdlaWdodDtcbiAgICAgICAgICAgIGlmIChpc1NlbWFwaG9yZShzeW5jKSkge1xuICAgICAgICAgICAgICAgIHdlaWdodCA9IHdlaWdodE9yUHJpb3JpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcHJpb3JpdHkgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdlaWdodCAhPT0gdW5kZWZpbmVkICYmIHdlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlzVGltZW91dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpc1RpbWVvdXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QodGltZW91dEVycm9yKTtcbiAgICAgICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aWNrZXQgPSB5aWVsZCAoaXNTZW1hcGhvcmUoc3luYylcbiAgICAgICAgICAgICAgICAgICAgICAgID8gc3luYy5hY3F1aXJlKHdlaWdodCwgcHJpb3JpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHN5bmMuYWNxdWlyZShwcmlvcml0eSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWxlYXNlID0gQXJyYXkuaXNBcnJheSh0aWNrZXQpID8gdGlja2V0WzFdIDogdGlja2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRpY2tldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1RpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuICAgICAgICBydW5FeGNsdXNpdmUoY2FsbGJhY2ssIHdlaWdodCwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlbGVhc2UgPSAoKSA9PiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGlja2V0ID0geWllbGQgdGhpcy5hY3F1aXJlKHdlaWdodCwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aWNrZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWxlYXNlID0gdGlja2V0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGNhbGxiYWNrKHRpY2tldFswXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWxlYXNlID0gdGlja2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVsZWFzZSh3ZWlnaHQpIHtcbiAgICAgICAgICAgIHN5bmMucmVsZWFzZSh3ZWlnaHQpO1xuICAgICAgICB9LFxuICAgICAgICBjYW5jZWwoKSB7XG4gICAgICAgICAgICByZXR1cm4gc3luYy5jYW5jZWwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgd2FpdEZvclVubG9jazogKHdlaWdodE9yUHJpb3JpdHksIHByaW9yaXR5KSA9PiB7XG4gICAgICAgICAgICBsZXQgd2VpZ2h0O1xuICAgICAgICAgICAgaWYgKGlzU2VtYXBob3JlKHN5bmMpKSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0ID0gd2VpZ2h0T3JQcmlvcml0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHdlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBwcmlvcml0eSA9IHdlaWdodE9yUHJpb3JpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2VpZ2h0ICE9PSB1bmRlZmluZWQgJiYgd2VpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgd2VpZ2h0ICR7d2VpZ2h0fTogbXVzdCBiZSBwb3NpdGl2ZWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdCh0aW1lb3V0RXJyb3IpLCB0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICAoaXNTZW1hcGhvcmUoc3luYylcbiAgICAgICAgICAgICAgICAgICAgPyBzeW5jLndhaXRGb3JVbmxvY2sod2VpZ2h0LCBwcmlvcml0eSlcbiAgICAgICAgICAgICAgICAgICAgOiBzeW5jLndhaXRGb3JVbmxvY2socHJpb3JpdHkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBpc0xvY2tlZDogKCkgPT4gc3luYy5pc0xvY2tlZCgpLFxuICAgICAgICBnZXRWYWx1ZTogKCkgPT4gc3luYy5nZXRWYWx1ZSgpLFxuICAgICAgICBzZXRWYWx1ZTogKHZhbHVlKSA9PiBzeW5jLnNldFZhbHVlKHZhbHVlKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gaXNTZW1hcGhvcmUoc3luYykge1xuICAgIHJldHVybiBzeW5jLmdldFZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGlzbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlc1xuZnVuY3Rpb24gdHJ5QWNxdWlyZShzeW5jLCBhbHJlYWR5QWNxdWlyZWRFcnJvciA9IEVfQUxSRUFEWV9MT0NLRUQpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIHJldHVybiB3aXRoVGltZW91dChzeW5jLCAwLCBhbHJlYWR5QWNxdWlyZWRFcnJvcik7XG59XG5cbmV4cG9ydCB7IEVfQUxSRUFEWV9MT0NLRUQsIEVfQ0FOQ0VMRUQsIEVfVElNRU9VVCwgTXV0ZXgsIFNlbWFwaG9yZSwgdHJ5QWNxdWlyZSwgd2l0aFRpbWVvdXQgfTtcbiIsInZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5leHBvcnQgZnVuY3Rpb24gZGVxdWFsKGZvbywgYmFyKSB7XG5cdHZhciBjdG9yLCBsZW47XG5cdGlmIChmb28gPT09IGJhcikgcmV0dXJuIHRydWU7XG5cblx0aWYgKGZvbyAmJiBiYXIgJiYgKGN0b3I9Zm9vLmNvbnN0cnVjdG9yKSA9PT0gYmFyLmNvbnN0cnVjdG9yKSB7XG5cdFx0aWYgKGN0b3IgPT09IERhdGUpIHJldHVybiBmb28uZ2V0VGltZSgpID09PSBiYXIuZ2V0VGltZSgpO1xuXHRcdGlmIChjdG9yID09PSBSZWdFeHApIHJldHVybiBmb28udG9TdHJpbmcoKSA9PT0gYmFyLnRvU3RyaW5nKCk7XG5cblx0XHRpZiAoY3RvciA9PT0gQXJyYXkpIHtcblx0XHRcdGlmICgobGVuPWZvby5sZW5ndGgpID09PSBiYXIubGVuZ3RoKSB7XG5cdFx0XHRcdHdoaWxlIChsZW4tLSAmJiBkZXF1YWwoZm9vW2xlbl0sIGJhcltsZW5dKSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbGVuID09PSAtMTtcblx0XHR9XG5cblx0XHRpZiAoIWN0b3IgfHwgdHlwZW9mIGZvbyA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGxlbiA9IDA7XG5cdFx0XHRmb3IgKGN0b3IgaW4gZm9vKSB7XG5cdFx0XHRcdGlmIChoYXMuY2FsbChmb28sIGN0b3IpICYmICsrbGVuICYmICFoYXMuY2FsbChiYXIsIGN0b3IpKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICghKGN0b3IgaW4gYmFyKSB8fCAhZGVxdWFsKGZvb1tjdG9yXSwgYmFyW2N0b3JdKSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIE9iamVjdC5rZXlzKGJhcikubGVuZ3RoID09PSBsZW47XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZvbyAhPT0gZm9vICYmIGJhciAhPT0gYmFyO1xufVxuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG5pbXBvcnQgeyBNdXRleCB9IGZyb20gXCJhc3luYy1tdXRleFwiO1xuaW1wb3J0IHsgZGVxdWFsIH0gZnJvbSBcImRlcXVhbC9saXRlXCI7XG5cbi8vI3JlZ2lvbiBzcmMvaW5kZXgudHNcbi8qKlxuKiBTaW1wbGlmaWVkIHN0b3JhZ2UgQVBJcyB3aXRoIHN1cHBvcnQgZm9yIHZlcnNpb25lZCBmaWVsZHMsIHNuYXBzaG90cywgbWV0YWRhdGEsIGFuZCBpdGVtIGRlZmluaXRpb25zLlxuKlxuKiBTZWUgW3RoZSBndWlkZV0oaHR0cHM6Ly93eHQuZGV2L3N0b3JhZ2UuaHRtbCkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4qIEBtb2R1bGUgQHd4dC1kZXYvc3RvcmFnZVxuKi9cbmNvbnN0IHN0b3JhZ2UgPSBjcmVhdGVTdG9yYWdlKCk7XG5mdW5jdGlvbiBjcmVhdGVTdG9yYWdlKCkge1xuXHRjb25zdCBkcml2ZXJzID0ge1xuXHRcdGxvY2FsOiBjcmVhdGVEcml2ZXIoXCJsb2NhbFwiKSxcblx0XHRzZXNzaW9uOiBjcmVhdGVEcml2ZXIoXCJzZXNzaW9uXCIpLFxuXHRcdHN5bmM6IGNyZWF0ZURyaXZlcihcInN5bmNcIiksXG5cdFx0bWFuYWdlZDogY3JlYXRlRHJpdmVyKFwibWFuYWdlZFwiKVxuXHR9O1xuXHRjb25zdCBnZXREcml2ZXIgPSAoYXJlYSkgPT4ge1xuXHRcdGNvbnN0IGRyaXZlciA9IGRyaXZlcnNbYXJlYV07XG5cdFx0aWYgKGRyaXZlciA9PSBudWxsKSB7XG5cdFx0XHRjb25zdCBhcmVhTmFtZXMgPSBPYmplY3Qua2V5cyhkcml2ZXJzKS5qb2luKFwiLCBcIik7XG5cdFx0XHR0aHJvdyBFcnJvcihgSW52YWxpZCBhcmVhIFwiJHthcmVhfVwiLiBPcHRpb25zOiAke2FyZWFOYW1lc31gKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRyaXZlcjtcblx0fTtcblx0Y29uc3QgcmVzb2x2ZUtleSA9IChrZXkpID0+IHtcblx0XHRjb25zdCBkZWxpbWluYXRvckluZGV4ID0ga2V5LmluZGV4T2YoXCI6XCIpO1xuXHRcdGNvbnN0IGRyaXZlckFyZWEgPSBrZXkuc3Vic3RyaW5nKDAsIGRlbGltaW5hdG9ySW5kZXgpO1xuXHRcdGNvbnN0IGRyaXZlcktleSA9IGtleS5zdWJzdHJpbmcoZGVsaW1pbmF0b3JJbmRleCArIDEpO1xuXHRcdGlmIChkcml2ZXJLZXkgPT0gbnVsbCkgdGhyb3cgRXJyb3IoYFN0b3JhZ2Uga2V5IHNob3VsZCBiZSBpbiB0aGUgZm9ybSBvZiBcImFyZWE6a2V5XCIsIGJ1dCByZWNlaXZlZCBcIiR7a2V5fVwiYCk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRyaXZlckFyZWEsXG5cdFx0XHRkcml2ZXJLZXksXG5cdFx0XHRkcml2ZXI6IGdldERyaXZlcihkcml2ZXJBcmVhKVxuXHRcdH07XG5cdH07XG5cdGNvbnN0IGdldE1ldGFLZXkgPSAoa2V5KSA9PiBrZXkgKyBcIiRcIjtcblx0Y29uc3QgbWVyZ2VNZXRhID0gKG9sZE1ldGEsIG5ld01ldGEpID0+IHtcblx0XHRjb25zdCBuZXdGaWVsZHMgPSB7IC4uLm9sZE1ldGEgfTtcblx0XHRPYmplY3QuZW50cmllcyhuZXdNZXRhKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcblx0XHRcdGlmICh2YWx1ZSA9PSBudWxsKSBkZWxldGUgbmV3RmllbGRzW2tleV07XG5cdFx0XHRlbHNlIG5ld0ZpZWxkc1trZXldID0gdmFsdWU7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG5ld0ZpZWxkcztcblx0fTtcblx0Y29uc3QgZ2V0VmFsdWVPckZhbGxiYWNrID0gKHZhbHVlLCBmYWxsYmFjaykgPT4gdmFsdWUgPz8gZmFsbGJhY2sgPz8gbnVsbDtcblx0Y29uc3QgZ2V0TWV0YVZhbHVlID0gKHByb3BlcnRpZXMpID0+IHR5cGVvZiBwcm9wZXJ0aWVzID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KHByb3BlcnRpZXMpID8gcHJvcGVydGllcyA6IHt9O1xuXHRjb25zdCBnZXRJdGVtID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKSA9PiB7XG5cdFx0cmV0dXJuIGdldFZhbHVlT3JGYWxsYmFjayhhd2FpdCBkcml2ZXIuZ2V0SXRlbShkcml2ZXJLZXkpLCBvcHRzPy5mYWxsYmFjayA/PyBvcHRzPy5kZWZhdWx0VmFsdWUpO1xuXHR9O1xuXHRjb25zdCBnZXRNZXRhID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5KSA9PiB7XG5cdFx0Y29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcblx0XHRyZXR1cm4gZ2V0TWV0YVZhbHVlKGF3YWl0IGRyaXZlci5nZXRJdGVtKG1ldGFLZXkpKTtcblx0fTtcblx0Y29uc3Qgc2V0SXRlbSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgdmFsdWUpID0+IHtcblx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbShkcml2ZXJLZXksIHZhbHVlID8/IG51bGwpO1xuXHR9O1xuXHRjb25zdCBzZXRNZXRhID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCBwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0Y29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcblx0XHRjb25zdCBleGlzdGluZ0ZpZWxkcyA9IGdldE1ldGFWYWx1ZShhd2FpdCBkcml2ZXIuZ2V0SXRlbShtZXRhS2V5KSk7XG5cdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW0obWV0YUtleSwgbWVyZ2VNZXRhKGV4aXN0aW5nRmllbGRzLCBwcm9wZXJ0aWVzKSk7XG5cdH07XG5cdGNvbnN0IHJlbW92ZUl0ZW0gPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpID0+IHtcblx0XHRhd2FpdCBkcml2ZXIucmVtb3ZlSXRlbShkcml2ZXJLZXkpO1xuXHRcdGlmIChvcHRzPy5yZW1vdmVNZXRhKSB7XG5cdFx0XHRjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShkcml2ZXJLZXkpO1xuXHRcdFx0YXdhaXQgZHJpdmVyLnJlbW92ZUl0ZW0obWV0YUtleSk7XG5cdFx0fVxuXHR9O1xuXHRjb25zdCByZW1vdmVNZXRhID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCBwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0Y29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcblx0XHRpZiAocHJvcGVydGllcyA9PSBudWxsKSBhd2FpdCBkcml2ZXIucmVtb3ZlSXRlbShtZXRhS2V5KTtcblx0XHRlbHNlIHtcblx0XHRcdGNvbnN0IG5ld0ZpZWxkcyA9IGdldE1ldGFWYWx1ZShhd2FpdCBkcml2ZXIuZ2V0SXRlbShtZXRhS2V5KSk7XG5cdFx0XHRbcHJvcGVydGllc10uZmxhdCgpLmZvckVhY2goKGZpZWxkKSA9PiBkZWxldGUgbmV3RmllbGRzW2ZpZWxkXSk7XG5cdFx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbShtZXRhS2V5LCBuZXdGaWVsZHMpO1xuXHRcdH1cblx0fTtcblx0Y29uc3Qgd2F0Y2ggPSAoZHJpdmVyLCBkcml2ZXJLZXksIGNiKSA9PiBkcml2ZXIud2F0Y2goZHJpdmVyS2V5LCBjYik7XG5cdHJldHVybiB7XG5cdFx0Z2V0SXRlbTogYXN5bmMgKGtleSwgb3B0cykgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0cmV0dXJuIGF3YWl0IGdldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpO1xuXHRcdH0sXG5cdFx0Z2V0SXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRjb25zdCBhcmVhVG9LZXlNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRcdFx0Y29uc3Qga2V5VG9PcHRzTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcblx0XHRcdGNvbnN0IG9yZGVyZWRLZXlzID0gW107XG5cdFx0XHRrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRsZXQga2V5U3RyO1xuXHRcdFx0XHRsZXQgb3B0cztcblx0XHRcdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpIGtleVN0ciA9IGtleTtcblx0XHRcdFx0ZWxzZSBpZiAoXCJnZXRWYWx1ZVwiIGluIGtleSkge1xuXHRcdFx0XHRcdGtleVN0ciA9IGtleS5rZXk7XG5cdFx0XHRcdFx0b3B0cyA9IHsgZmFsbGJhY2s6IGtleS5mYWxsYmFjayB9O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGtleVN0ciA9IGtleS5rZXk7XG5cdFx0XHRcdFx0b3B0cyA9IGtleS5vcHRpb25zO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG9yZGVyZWRLZXlzLnB1c2goa2V5U3RyKTtcblx0XHRcdFx0Y29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5U3RyKTtcblx0XHRcdFx0Y29uc3QgYXJlYUtleXMgPSBhcmVhVG9LZXlNYXAuZ2V0KGRyaXZlckFyZWEpID8/IFtdO1xuXHRcdFx0XHRhcmVhVG9LZXlNYXAuc2V0KGRyaXZlckFyZWEsIGFyZWFLZXlzLmNvbmNhdChkcml2ZXJLZXkpKTtcblx0XHRcdFx0a2V5VG9PcHRzTWFwLnNldChrZXlTdHIsIG9wdHMpO1xuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCByZXN1bHRzTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKEFycmF5LmZyb20oYXJlYVRvS2V5TWFwLmVudHJpZXMoKSkubWFwKGFzeW5jIChbZHJpdmVyQXJlYSwga2V5c10pID0+IHtcblx0XHRcdFx0KGF3YWl0IGRyaXZlcnNbZHJpdmVyQXJlYV0uZ2V0SXRlbXMoa2V5cykpLmZvckVhY2goKGRyaXZlclJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGtleSA9IGAke2RyaXZlckFyZWF9OiR7ZHJpdmVyUmVzdWx0LmtleX1gO1xuXHRcdFx0XHRcdGNvbnN0IG9wdHMgPSBrZXlUb09wdHNNYXAuZ2V0KGtleSk7XG5cdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBnZXRWYWx1ZU9yRmFsbGJhY2soZHJpdmVyUmVzdWx0LnZhbHVlLCBvcHRzPy5mYWxsYmFjayA/PyBvcHRzPy5kZWZhdWx0VmFsdWUpO1xuXHRcdFx0XHRcdHJlc3VsdHNNYXAuc2V0KGtleSwgdmFsdWUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pKTtcblx0XHRcdHJldHVybiBvcmRlcmVkS2V5cy5tYXAoKGtleSkgPT4gKHtcblx0XHRcdFx0a2V5LFxuXHRcdFx0XHR2YWx1ZTogcmVzdWx0c01hcC5nZXQoa2V5KVxuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0Z2V0TWV0YTogYXN5bmMgKGtleSkgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0cmV0dXJuIGF3YWl0IGdldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXkpO1xuXHRcdH0sXG5cdFx0Z2V0TWV0YXM6IGFzeW5jIChhcmdzKSA9PiB7XG5cdFx0XHRjb25zdCBrZXlzID0gYXJncy5tYXAoKGFyZykgPT4ge1xuXHRcdFx0XHRjb25zdCBrZXkgPSB0eXBlb2YgYXJnID09PSBcInN0cmluZ1wiID8gYXJnIDogYXJnLmtleTtcblx0XHRcdFx0Y29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRrZXksXG5cdFx0XHRcdFx0ZHJpdmVyQXJlYSxcblx0XHRcdFx0XHRkcml2ZXJLZXksXG5cdFx0XHRcdFx0ZHJpdmVyTWV0YUtleTogZ2V0TWV0YUtleShkcml2ZXJLZXkpXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblx0XHRcdGNvbnN0IGFyZWFUb0RyaXZlck1ldGFLZXlzTWFwID0ga2V5cy5yZWR1Y2UoKG1hcCwga2V5KSA9PiB7XG5cdFx0XHRcdG1hcFtrZXkuZHJpdmVyQXJlYV0gPz89IFtdO1xuXHRcdFx0XHRtYXBba2V5LmRyaXZlckFyZWFdLnB1c2goa2V5KTtcblx0XHRcdFx0cmV0dXJuIG1hcDtcblx0XHRcdH0sIHt9KTtcblx0XHRcdGNvbnN0IHJlc3VsdHNNYXAgPSB7fTtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKGFyZWFUb0RyaXZlck1ldGFLZXlzTWFwKS5tYXAoYXN5bmMgKFthcmVhLCBrZXlzXSkgPT4ge1xuXHRcdFx0XHRjb25zdCBhcmVhUmVzID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlW2FyZWFdLmdldChrZXlzLm1hcCgoa2V5KSA9PiBrZXkuZHJpdmVyTWV0YUtleSkpO1xuXHRcdFx0XHRrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRcdHJlc3VsdHNNYXBba2V5LmtleV0gPSBhcmVhUmVzW2tleS5kcml2ZXJNZXRhS2V5XSA/PyB7fTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSk7XG5cdFx0XHRyZXR1cm4ga2V5cy5tYXAoKGtleSkgPT4gKHtcblx0XHRcdFx0a2V5OiBrZXkua2V5LFxuXHRcdFx0XHRtZXRhOiByZXN1bHRzTWFwW2tleS5rZXldXG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRzZXRJdGVtOiBhc3luYyAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0YXdhaXQgc2V0SXRlbShkcml2ZXIsIGRyaXZlcktleSwgdmFsdWUpO1xuXHRcdH0sXG5cdFx0c2V0SXRlbXM6IGFzeW5jIChpdGVtcykgPT4ge1xuXHRcdFx0Y29uc3QgYXJlYVRvS2V5VmFsdWVNYXAgPSB7fTtcblx0XHRcdGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcblx0XHRcdFx0Y29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoXCJrZXlcIiBpbiBpdGVtID8gaXRlbS5rZXkgOiBpdGVtLml0ZW0ua2V5KTtcblx0XHRcdFx0YXJlYVRvS2V5VmFsdWVNYXBbZHJpdmVyQXJlYV0gPz89IFtdO1xuXHRcdFx0XHRhcmVhVG9LZXlWYWx1ZU1hcFtkcml2ZXJBcmVhXS5wdXNoKHtcblx0XHRcdFx0XHRrZXk6IGRyaXZlcktleSxcblx0XHRcdFx0XHR2YWx1ZTogaXRlbS52YWx1ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmVudHJpZXMoYXJlYVRvS2V5VmFsdWVNYXApLm1hcChhc3luYyAoW2RyaXZlckFyZWEsIHZhbHVlc10pID0+IHtcblx0XHRcdFx0YXdhaXQgZ2V0RHJpdmVyKGRyaXZlckFyZWEpLnNldEl0ZW1zKHZhbHVlcyk7XG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRzZXRNZXRhOiBhc3luYyAoa2V5LCBwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRhd2FpdCBzZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5LCBwcm9wZXJ0aWVzKTtcblx0XHR9LFxuXHRcdHNldE1ldGFzOiBhc3luYyAoaXRlbXMpID0+IHtcblx0XHRcdGNvbnN0IGFyZWFUb01ldGFVcGRhdGVzTWFwID0ge307XG5cdFx0XHRpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHsgZHJpdmVyQXJlYSwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KFwia2V5XCIgaW4gaXRlbSA/IGl0ZW0ua2V5IDogaXRlbS5pdGVtLmtleSk7XG5cdFx0XHRcdGFyZWFUb01ldGFVcGRhdGVzTWFwW2RyaXZlckFyZWFdID8/PSBbXTtcblx0XHRcdFx0YXJlYVRvTWV0YVVwZGF0ZXNNYXBbZHJpdmVyQXJlYV0ucHVzaCh7XG5cdFx0XHRcdFx0a2V5OiBkcml2ZXJLZXksXG5cdFx0XHRcdFx0cHJvcGVydGllczogaXRlbS5tZXRhXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChPYmplY3QuZW50cmllcyhhcmVhVG9NZXRhVXBkYXRlc01hcCkubWFwKGFzeW5jIChbc3RvcmFnZUFyZWEsIHVwZGF0ZXNdKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRyaXZlciA9IGdldERyaXZlcihzdG9yYWdlQXJlYSk7XG5cdFx0XHRcdGNvbnN0IG1ldGFLZXlzID0gdXBkYXRlcy5tYXAoKHsga2V5IH0pID0+IGdldE1ldGFLZXkoa2V5KSk7XG5cdFx0XHRcdGNvbnN0IGV4aXN0aW5nTWV0YXMgPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbXMobWV0YUtleXMpO1xuXHRcdFx0XHRjb25zdCBleGlzdGluZ01ldGFNYXAgPSBPYmplY3QuZnJvbUVudHJpZXMoZXhpc3RpbmdNZXRhcy5tYXAoKHsga2V5LCB2YWx1ZSB9KSA9PiBba2V5LCBnZXRNZXRhVmFsdWUodmFsdWUpXSkpO1xuXHRcdFx0XHRjb25zdCBtZXRhVXBkYXRlcyA9IHVwZGF0ZXMubWFwKCh7IGtleSwgcHJvcGVydGllcyB9KSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoa2V5KTtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0a2V5OiBtZXRhS2V5LFxuXHRcdFx0XHRcdFx0dmFsdWU6IG1lcmdlTWV0YShleGlzdGluZ01ldGFNYXBbbWV0YUtleV0gPz8ge30sIHByb3BlcnRpZXMpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGF3YWl0IGRyaXZlci5zZXRJdGVtcyhtZXRhVXBkYXRlcyk7XG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRyZW1vdmVJdGVtOiBhc3luYyAoa2V5LCBvcHRzKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRhd2FpdCByZW1vdmVJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZUl0ZW1zOiBhc3luYyAoa2V5cykgPT4ge1xuXHRcdFx0Y29uc3QgYXJlYVRvS2V5c01hcCA9IHt9O1xuXHRcdFx0a2V5cy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0bGV0IGtleVN0cjtcblx0XHRcdFx0bGV0IG9wdHM7XG5cdFx0XHRcdGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSBrZXlTdHIgPSBrZXk7XG5cdFx0XHRcdGVsc2UgaWYgKFwiZ2V0VmFsdWVcIiBpbiBrZXkpIGtleVN0ciA9IGtleS5rZXk7XG5cdFx0XHRcdGVsc2UgaWYgKFwiaXRlbVwiIGluIGtleSkge1xuXHRcdFx0XHRcdGtleVN0ciA9IGtleS5pdGVtLmtleTtcblx0XHRcdFx0XHRvcHRzID0ga2V5Lm9wdGlvbnM7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0a2V5U3RyID0ga2V5LmtleTtcblx0XHRcdFx0XHRvcHRzID0ga2V5Lm9wdGlvbnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5U3RyKTtcblx0XHRcdFx0YXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXSA/Pz0gW107XG5cdFx0XHRcdGFyZWFUb0tleXNNYXBbZHJpdmVyQXJlYV0ucHVzaChkcml2ZXJLZXkpO1xuXHRcdFx0XHRpZiAob3B0cz8ucmVtb3ZlTWV0YSkgYXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXS5wdXNoKGdldE1ldGFLZXkoZHJpdmVyS2V5KSk7XG5cdFx0XHR9KTtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKGFyZWFUb0tleXNNYXApLm1hcChhc3luYyAoW2RyaXZlckFyZWEsIGtleXNdKSA9PiB7XG5cdFx0XHRcdGF3YWl0IGdldERyaXZlcihkcml2ZXJBcmVhKS5yZW1vdmVJdGVtcyhrZXlzKTtcblx0XHRcdH0pKTtcblx0XHR9LFxuXHRcdGNsZWFyOiBhc3luYyAoYmFzZSkgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0RHJpdmVyKGJhc2UpLmNsZWFyKCk7XG5cdFx0fSxcblx0XHRyZW1vdmVNZXRhOiBhc3luYyAoa2V5LCBwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRhd2FpdCByZW1vdmVNZXRhKGRyaXZlciwgZHJpdmVyS2V5LCBwcm9wZXJ0aWVzKTtcblx0XHR9LFxuXHRcdHNuYXBzaG90OiBhc3luYyAoYmFzZSwgb3B0cykgPT4ge1xuXHRcdFx0Y29uc3QgZGF0YSA9IGF3YWl0IGdldERyaXZlcihiYXNlKS5zbmFwc2hvdCgpO1xuXHRcdFx0b3B0cz8uZXhjbHVkZUtleXM/LmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRkZWxldGUgZGF0YVtrZXldO1xuXHRcdFx0XHRkZWxldGUgZGF0YVtnZXRNZXRhS2V5KGtleSldO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gZGF0YTtcblx0XHR9LFxuXHRcdHJlc3RvcmVTbmFwc2hvdDogYXN5bmMgKGJhc2UsIGRhdGEpID0+IHtcblx0XHRcdGF3YWl0IGdldERyaXZlcihiYXNlKS5yZXN0b3JlU25hcHNob3QoZGF0YSk7XG5cdFx0fSxcblx0XHR3YXRjaDogKGtleSwgY2IpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdHJldHVybiB3YXRjaChkcml2ZXIsIGRyaXZlcktleSwgY2IpO1xuXHRcdH0sXG5cdFx0dW53YXRjaCgpIHtcblx0XHRcdE9iamVjdC52YWx1ZXMoZHJpdmVycykuZm9yRWFjaCgoZHJpdmVyKSA9PiB7XG5cdFx0XHRcdGRyaXZlci51bndhdGNoKCk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdGRlZmluZUl0ZW06IChrZXksIG9wdHMpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdGNvbnN0IHsgdmVyc2lvbjogdGFyZ2V0VmVyc2lvbiA9IDEsIG1pZ3JhdGlvbnMgPSB7fSwgb25NaWdyYXRpb25Db21wbGV0ZSwgZGVidWcgPSBmYWxzZSB9ID0gb3B0cyA/PyB7fTtcblx0XHRcdGlmICh0YXJnZXRWZXJzaW9uIDwgMSkgdGhyb3cgRXJyb3IoXCJTdG9yYWdlIGl0ZW0gdmVyc2lvbiBjYW5ub3QgYmUgbGVzcyB0aGFuIDEuIEluaXRpYWwgdmVyc2lvbnMgc2hvdWxkIGJlIHNldCB0byAxLCBub3QgMC5cIik7XG5cdFx0XHRsZXQgbmVlZHNWZXJzaW9uU2V0ID0gZmFsc2U7XG5cdFx0XHRjb25zdCBtaWdyYXRlID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBkcml2ZXJNZXRhS2V5ID0gZ2V0TWV0YUtleShkcml2ZXJLZXkpO1xuXHRcdFx0XHRjb25zdCBbeyB2YWx1ZSB9LCB7IHZhbHVlOiBtZXRhIH1dID0gYXdhaXQgZHJpdmVyLmdldEl0ZW1zKFtkcml2ZXJLZXksIGRyaXZlck1ldGFLZXldKTtcblx0XHRcdFx0bmVlZHNWZXJzaW9uU2V0ID0gdmFsdWUgPT0gbnVsbCAmJiBtZXRhPy52ID09IG51bGwgJiYgISF0YXJnZXRWZXJzaW9uO1xuXHRcdFx0XHRpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuXHRcdFx0XHRjb25zdCBjdXJyZW50VmVyc2lvbiA9IG1ldGE/LnYgPz8gMTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWZXJzaW9uID4gdGFyZ2V0VmVyc2lvbikgdGhyb3cgRXJyb3IoYFZlcnNpb24gZG93bmdyYWRlIGRldGVjdGVkICh2JHtjdXJyZW50VmVyc2lvbn0gLT4gdiR7dGFyZ2V0VmVyc2lvbn0pIGZvciBcIiR7a2V5fVwiYCk7XG5cdFx0XHRcdGlmIChjdXJyZW50VmVyc2lvbiA9PT0gdGFyZ2V0VmVyc2lvbikgcmV0dXJuO1xuXHRcdFx0XHRpZiAoZGVidWcpIGNvbnNvbGUuZGVidWcoYFtAd3h0LWRldi9zdG9yYWdlXSBSdW5uaW5nIHN0b3JhZ2UgbWlncmF0aW9uIGZvciAke2tleX06IHYke2N1cnJlbnRWZXJzaW9ufSAtPiB2JHt0YXJnZXRWZXJzaW9ufWApO1xuXHRcdFx0XHRjb25zdCBtaWdyYXRpb25zVG9SdW4gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0YXJnZXRWZXJzaW9uIC0gY3VycmVudFZlcnNpb24gfSwgKF8sIGkpID0+IGN1cnJlbnRWZXJzaW9uICsgaSArIDEpO1xuXHRcdFx0XHRsZXQgbWlncmF0ZWRWYWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRmb3IgKGNvbnN0IG1pZ3JhdGVUb1ZlcnNpb24gb2YgbWlncmF0aW9uc1RvUnVuKSB0cnkge1xuXHRcdFx0XHRcdG1pZ3JhdGVkVmFsdWUgPSBhd2FpdCBtaWdyYXRpb25zPy5bbWlncmF0ZVRvVmVyc2lvbl0/LihtaWdyYXRlZFZhbHVlKSA/PyBtaWdyYXRlZFZhbHVlO1xuXHRcdFx0XHRcdGlmIChkZWJ1ZykgY29uc29sZS5kZWJ1ZyhgW0B3eHQtZGV2L3N0b3JhZ2VdIFN0b3JhZ2UgbWlncmF0aW9uIHByb2Nlc3NlZCBmb3IgdmVyc2lvbjogdiR7bWlncmF0ZVRvVmVyc2lvbn1gKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1pZ3JhdGlvbkVycm9yKGtleSwgbWlncmF0ZVRvVmVyc2lvbiwgeyBjYXVzZTogZXJyIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGF3YWl0IGRyaXZlci5zZXRJdGVtcyhbe1xuXHRcdFx0XHRcdGtleTogZHJpdmVyS2V5LFxuXHRcdFx0XHRcdHZhbHVlOiBtaWdyYXRlZFZhbHVlXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRrZXk6IGRyaXZlck1ldGFLZXksXG5cdFx0XHRcdFx0dmFsdWU6IHtcblx0XHRcdFx0XHRcdC4uLm1ldGEsXG5cdFx0XHRcdFx0XHR2OiB0YXJnZXRWZXJzaW9uXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XSk7XG5cdFx0XHRcdGlmIChkZWJ1ZykgY29uc29sZS5kZWJ1ZyhgW0B3eHQtZGV2L3N0b3JhZ2VdIFN0b3JhZ2UgbWlncmF0aW9uIGNvbXBsZXRlZCBmb3IgJHtrZXl9IHYke3RhcmdldFZlcnNpb259YCwgeyBtaWdyYXRlZFZhbHVlIH0pO1xuXHRcdFx0XHRvbk1pZ3JhdGlvbkNvbXBsZXRlPy4obWlncmF0ZWRWYWx1ZSwgdGFyZ2V0VmVyc2lvbik7XG5cdFx0XHR9O1xuXHRcdFx0Y29uc3QgbWlncmF0aW9uc0RvbmUgPSBvcHRzPy5taWdyYXRpb25zID09IG51bGwgPyBQcm9taXNlLnJlc29sdmUoKSA6IG1pZ3JhdGUoKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtAd3h0LWRldi9zdG9yYWdlXSBNaWdyYXRpb24gZmFpbGVkIGZvciAke2tleX1gLCBlcnIpO1xuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBpbml0TXV0ZXggPSBuZXcgTXV0ZXgoKTtcblx0XHRcdGNvbnN0IGdldEZhbGxiYWNrID0gKCkgPT4gb3B0cz8uZmFsbGJhY2sgPz8gb3B0cz8uZGVmYXVsdFZhbHVlID8/IG51bGw7XG5cdFx0XHRjb25zdCBnZXRPckluaXRWYWx1ZSA9ICgpID0+IGluaXRNdXRleC5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IGF3YWl0IGRyaXZlci5nZXRJdGVtKGRyaXZlcktleSk7XG5cdFx0XHRcdGlmICh2YWx1ZSAhPSBudWxsIHx8IG9wdHM/LmluaXQgPT0gbnVsbCkgcmV0dXJuIHZhbHVlO1xuXHRcdFx0XHRjb25zdCBuZXdWYWx1ZSA9IGF3YWl0IG9wdHMuaW5pdCgpO1xuXHRcdFx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbShkcml2ZXJLZXksIG5ld1ZhbHVlKTtcblx0XHRcdFx0aWYgKHZhbHVlID09IG51bGwgJiYgdGFyZ2V0VmVyc2lvbiA+IDEpIGF3YWl0IHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHsgdjogdGFyZ2V0VmVyc2lvbiB9KTtcblx0XHRcdFx0cmV0dXJuIG5ld1ZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0XHRtaWdyYXRpb25zRG9uZS50aGVuKGdldE9ySW5pdFZhbHVlKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGtleSxcblx0XHRcdFx0Z2V0IGRlZmF1bHRWYWx1ZSgpIHtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0RmFsbGJhY2soKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Z2V0IGZhbGxiYWNrKCkge1xuXHRcdFx0XHRcdHJldHVybiBnZXRGYWxsYmFjaygpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRnZXRWYWx1ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdGlmIChvcHRzPy5pbml0KSByZXR1cm4gYXdhaXQgZ2V0T3JJbml0VmFsdWUoKTtcblx0XHRcdFx0XHRlbHNlIHJldHVybiBhd2FpdCBnZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Z2V0TWV0YTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCBnZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V0VmFsdWU6IGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdGlmIChuZWVkc1ZlcnNpb25TZXQpIHtcblx0XHRcdFx0XHRcdG5lZWRzVmVyc2lvblNldCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW3NldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKSwgc2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSwgeyB2OiB0YXJnZXRWZXJzaW9uIH0pXSk7XG5cdFx0XHRcdFx0fSBlbHNlIGF3YWl0IHNldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V0TWV0YTogYXN5bmMgKHByb3BlcnRpZXMpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgc2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJlbW92ZVZhbHVlOiBhc3luYyAob3B0cykgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCByZW1vdmVJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlTWV0YTogYXN5bmMgKHByb3BlcnRpZXMpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgcmVtb3ZlTWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHdhdGNoOiAoY2IpID0+IHdhdGNoKGRyaXZlciwgZHJpdmVyS2V5LCAobmV3VmFsdWUsIG9sZFZhbHVlKSA9PiBjYihuZXdWYWx1ZSA/PyBnZXRGYWxsYmFjaygpLCBvbGRWYWx1ZSA/PyBnZXRGYWxsYmFjaygpKSksXG5cdFx0XHRcdG1pZ3JhdGVcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xufVxuZnVuY3Rpb24gY3JlYXRlRHJpdmVyKHN0b3JhZ2VBcmVhKSB7XG5cdGNvbnN0IGdldFN0b3JhZ2VBcmVhID0gKCkgPT4ge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWUgPT0gbnVsbCkgdGhyb3cgRXJyb3IoYCd3eHQvc3RvcmFnZScgbXVzdCBiZSBsb2FkZWQgaW4gYSB3ZWIgZXh0ZW5zaW9uIGVudmlyb25tZW50XG5cbiAtIElmIHRocm93biBkdXJpbmcgYSBidWlsZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93eHQtZGV2L3d4dC9pc3N1ZXMvMzcxXG4gLSBJZiB0aHJvd24gZHVyaW5nIHRlc3RzLCBtb2NrICd3eHQvYnJvd3NlcicgY29ycmVjdGx5LiBTZWUgaHR0cHM6Ly93eHQuZGV2L2d1aWRlL2dvLWZ1cnRoZXIvdGVzdGluZy5odG1sXG5gKTtcblx0XHRpZiAoYnJvd3Nlci5zdG9yYWdlID09IG51bGwpIHRocm93IEVycm9yKFwiWW91IG11c3QgYWRkIHRoZSAnc3RvcmFnZScgcGVybWlzc2lvbiB0byB5b3VyIG1hbmlmZXN0IHRvIHVzZSAnd3h0L3N0b3JhZ2UnXCIpO1xuXHRcdGNvbnN0IGFyZWEgPSBicm93c2VyLnN0b3JhZ2Vbc3RvcmFnZUFyZWFdO1xuXHRcdGlmIChhcmVhID09IG51bGwpIHRocm93IEVycm9yKGBcImJyb3dzZXIuc3RvcmFnZS4ke3N0b3JhZ2VBcmVhfVwiIGlzIHVuZGVmaW5lZGApO1xuXHRcdHJldHVybiBhcmVhO1xuXHR9O1xuXHRjb25zdCB3YXRjaExpc3RlbmVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG5cdHJldHVybiB7XG5cdFx0Z2V0SXRlbTogYXN5bmMgKGtleSkgPT4ge1xuXHRcdFx0cmV0dXJuIChhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXkpKVtrZXldO1xuXHRcdH0sXG5cdFx0Z2V0SXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXlzKTtcblx0XHRcdHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiAoe1xuXHRcdFx0XHRrZXksXG5cdFx0XHRcdHZhbHVlOiByZXN1bHRba2V5XSA/PyBudWxsXG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRzZXRJdGVtOiBhc3luYyAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlID09IG51bGwpIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkucmVtb3ZlKGtleSk7XG5cdFx0XHRlbHNlIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuc2V0KHsgW2tleV06IHZhbHVlIH0pO1xuXHRcdH0sXG5cdFx0c2V0SXRlbXM6IGFzeW5jICh2YWx1ZXMpID0+IHtcblx0XHRcdGNvbnN0IG1hcCA9IHZhbHVlcy5yZWR1Y2UoKG1hcCwgeyBrZXksIHZhbHVlIH0pID0+IHtcblx0XHRcdFx0bWFwW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0cmV0dXJuIG1hcDtcblx0XHRcdH0sIHt9KTtcblx0XHRcdGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuc2V0KG1hcCk7XG5cdFx0fSxcblx0XHRyZW1vdmVJdGVtOiBhc3luYyAoa2V5KSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXkpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlSXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXlzKTtcblx0XHR9LFxuXHRcdGNsZWFyOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmNsZWFyKCk7XG5cdFx0fSxcblx0XHRzbmFwc2hvdDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0cmV0dXJuIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuZ2V0KCk7XG5cdFx0fSxcblx0XHRyZXN0b3JlU25hcHNob3Q6IGFzeW5jIChkYXRhKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnNldChkYXRhKTtcblx0XHR9LFxuXHRcdHdhdGNoKGtleSwgY2IpIHtcblx0XHRcdGNvbnN0IGxpc3RlbmVyID0gKGNoYW5nZXMpID0+IHtcblx0XHRcdFx0Y29uc3QgY2hhbmdlID0gY2hhbmdlc1trZXldO1xuXHRcdFx0XHRpZiAoY2hhbmdlID09IG51bGwgfHwgZGVxdWFsKGNoYW5nZS5uZXdWYWx1ZSwgY2hhbmdlLm9sZFZhbHVlKSkgcmV0dXJuO1xuXHRcdFx0XHRjYihjaGFuZ2UubmV3VmFsdWUgPz8gbnVsbCwgY2hhbmdlLm9sZFZhbHVlID8/IG51bGwpO1xuXHRcdFx0fTtcblx0XHRcdGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcblx0XHRcdHdhdGNoTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG5cdFx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0XHRnZXRTdG9yYWdlQXJlYSgpLm9uQ2hhbmdlZC5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG5cdFx0XHRcdHdhdGNoTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0dW53YXRjaCgpIHtcblx0XHRcdHdhdGNoTGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG5cdFx0XHRcdGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcblx0XHRcdH0pO1xuXHRcdFx0d2F0Y2hMaXN0ZW5lcnMuY2xlYXIoKTtcblx0XHR9XG5cdH07XG59XG52YXIgTWlncmF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3Ioa2V5LCB2ZXJzaW9uLCBvcHRpb25zKSB7XG5cdFx0c3VwZXIoYHYke3ZlcnNpb259IG1pZ3JhdGlvbiBmYWlsZWQgZm9yIFwiJHtrZXl9XCJgLCBvcHRpb25zKTtcblx0XHR0aGlzLmtleSA9IGtleTtcblx0XHR0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuXHR9XG59O1xuXG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IE1pZ3JhdGlvbkVycm9yLCBzdG9yYWdlIH07IiwiaW1wb3J0IHsgc3RvcmFnZSB9IGZyb20gXCJ3eHQvdXRpbHMvc3RvcmFnZVwiO1xuXG4vLyBXaGV0aGVyIHRoZSB1c2VyIGhhcyBjb21wbGV0ZWQgdGhlIC9leHRlbnNpb24tc2lnbmluIGhhbmRzaGFrZS4gV2UgZG9uJ3Rcbi8vIHN0b3JlIHRoZSBhdXRoIHRva2VuIGl0c2VsZiDigJQgYmV0dGVyLWF1dGgga2VlcHMgaXQgYXMgYW4gSHR0cE9ubHkgY29va2llIG9uXG4vLyB0aGUgd2ViIGhvc3QgYW5kIHRoZSBzZXJ2aWNlIHdvcmtlciByaWRlcyB0aGF0IGNvb2tpZSB2aWEgaG9zdF9wZXJtaXNzaW9ucy5cbmV4cG9ydCBjb25zdCBzaWduZWRJblN0b3JlID0gc3RvcmFnZS5kZWZpbmVJdGVtPGJvb2xlYW4+KFxuICBcImxvY2FsOmxvY2tlcjpzaWduZWRJblwiLFxuICB7XG4gICAgZmFsbGJhY2s6IGZhbHNlLFxuICB9LFxuKTtcblxuLy8gTGFzdC1zZWxlY3RlZCB3b3Jrc3BhY2Ugc2x1Zywgc28gdGhlIHBvcHVwIGFuZCBpbnRlcmNlcHQgZGlhbG9nIGRlZmF1bHQgdG9cbi8vIHRoZSBzYW1lIHdvcmtzcGFjZSBhY3Jvc3Mgc2Vzc2lvbnMuXG5leHBvcnQgY29uc3QgYWN0aXZlV29ya3NwYWNlU2x1Z1N0b3JlID0gc3RvcmFnZS5kZWZpbmVJdGVtPHN0cmluZyB8IG51bGw+KFxuICBcImxvY2FsOmxvY2tlcjphY3RpdmVXb3Jrc3BhY2VTbHVnXCIsXG4gIHsgZmFsbGJhY2s6IG51bGwgfSxcbik7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc1NpZ25lZEluKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICByZXR1cm4gc2lnbmVkSW5TdG9yZS5nZXRWYWx1ZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0U2lnbmVkSW4odmFsdWU6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgc2lnbmVkSW5TdG9yZS5zZXRWYWx1ZSh2YWx1ZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBY3RpdmVXb3Jrc3BhY2VTbHVnKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICByZXR1cm4gYWN0aXZlV29ya3NwYWNlU2x1Z1N0b3JlLmdldFZhbHVlKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRBY3RpdmVXb3Jrc3BhY2VTbHVnKFxuICBzbHVnOiBzdHJpbmcgfCBudWxsLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGFjdGl2ZVdvcmtzcGFjZVNsdWdTdG9yZS5zZXRWYWx1ZShzbHVnKTtcbn1cbiIsImltcG9ydCB7IGRlZmluZUJhY2tncm91bmQgfSBmcm9tIFwid3h0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kXCI7XG5pbXBvcnQgeyBvbk1lc3NhZ2UgfSBmcm9tIFwiLi4vdXRpbHMvbWVzc2FnaW5nXCI7XG5pbXBvcnQge1xuICBibG9iVG9CYXNlNjQsXG4gIGRvd25sb2FkQXNCbG9iLFxuICBwcm9iZVNlc3Npb24sXG4gIFRycGNFcnJvcixcbiAgdHJwY011dGF0aW9uLFxuICB0cnBjUXVlcnksXG59IGZyb20gXCIuLi91dGlscy9hcGlcIjtcbmltcG9ydCB7XG4gIGdldEFjdGl2ZVdvcmtzcGFjZVNsdWcsXG4gIGlzU2lnbmVkSW4sXG4gIHNldEFjdGl2ZVdvcmtzcGFjZVNsdWcsXG4gIHNldFNpZ25lZEluLFxufSBmcm9tIFwiLi4vdXRpbHMvc3RvcmFnZVwiO1xuXG5pbnRlcmZhY2UgUmF3V29ya3NwYWNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBzbHVnOiBzdHJpbmc7XG4gIHJvbGU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFJhd0ZvbGRlciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgcGFyZW50SWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmludGVyZmFjZSBSYXdGaWxlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG4gIG1pbWVUeXBlOiBzdHJpbmc7XG4gIGZvbGRlcklkOiBzdHJpbmcgfCBudWxsO1xuICAvLyB0UlBDIHNlbmRzIERhdGUgYXMgSVNPIHN0cmluZyBpbnNpZGUgdGhlIGpzb24gcGF5bG9hZCAobm8gc3VwZXJqc29uIHJldml2ZXIgaGVyZSkuXG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRmlsZXNMaXN0UmVzcG9uc2Uge1xuICBpdGVtczogUmF3RmlsZVtdO1xuICB0b3RhbDogbnVtYmVyO1xuICBwYWdlOiBudW1iZXI7XG4gIHBhZ2VTaXplOiBudW1iZXI7XG4gIHRvdGFsUGFnZXM6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIEJyZWFkY3J1bWJSb3cge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBEb3dubG9hZFVybFJlc3VsdCB7XG4gIHVybDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtaW1lVHlwZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcbiAgb25NZXNzYWdlKFwiZ2V0U2lnbmVkSW5cIiwgYXN5bmMgKCkgPT4gaXNTaWduZWRJbigpKTtcblxuICBvbk1lc3NhZ2UoXCJyZWZyZXNoU2Vzc2lvblwiLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgb2sgPSBhd2FpdCBwcm9iZVNlc3Npb24oKTtcbiAgICBhd2FpdCBzZXRTaWduZWRJbihvayk7XG4gICAgcmV0dXJuIG9rO1xuICB9KTtcblxuICBvbk1lc3NhZ2UoXCJzaWduT3V0XCIsIGFzeW5jICgpID0+IHtcbiAgICAvLyBEcm9wIHRoZSBsb2NhbCBmbGFnIGFuZCBiZXN0LWVmZm9ydCBoaXQgYmV0dGVyLWF1dGgncyBzaWduLW91dCBzbyB0aGVcbiAgICAvLyBzZXJ2ZXItc2lkZSBzZXNzaW9uIGVuZHMgYW5kIHRoZSBjb29raWUgY2xlYXJzLiBXZSBjYW4ndCBkaXJlY3RseSBkcm9wXG4gICAgLy8gYW4gSHR0cE9ubHkgY29va2llIGZyb20gdGhlIGV4dGVuc2lvbiwgYnV0IGJldHRlci1hdXRoJ3MgZW5kcG9pbnQgd2lsbC5cbiAgICBhd2FpdCBzZXRTaWduZWRJbihmYWxzZSk7XG4gICAgYXdhaXQgc2V0QWN0aXZlV29ya3NwYWNlU2x1ZyhudWxsKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZmV0Y2goXG4gICAgICAgIGAkeyhpbXBvcnQubWV0YS5lbnYgYXMgeyBXWFRfUFVCTElDX0xPQ0tFUl9XRUJfSE9TVD86IHN0cmluZyB9KS5XWFRfUFVCTElDX0xPQ0tFUl9XRUJfSE9TVCA/PyBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwifS9hcGkvYXV0aC9zaWduLW91dGAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBiZXN0LWVmZm9ydFxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgb25NZXNzYWdlKFwibGlzdFdvcmtzcGFjZXNcIiwgYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgdHJwY1F1ZXJ5PFJhd1dvcmtzcGFjZVtdPihcIndvcmtzcGFjZXMubGlzdFwiLCBudWxsKTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBkYXRhIH07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zdCBlID0gZXJyIGFzIFRycGNFcnJvcjtcbiAgICAgIGlmIChlLnN0YXR1cyA9PT0gNDAxKSBhd2FpdCBzZXRTaWduZWRJbihmYWxzZSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UgYXMgY29uc3QsIGVycm9yOiBlLm1lc3NhZ2UsIHN0YXR1czogZS5zdGF0dXMgfTtcbiAgICB9XG4gIH0pO1xuXG4gIG9uTWVzc2FnZShcInNldEFjdGl2ZVdvcmtzcGFjZVwiLCBhc3luYyAoeyBkYXRhIH0pID0+IHtcbiAgICBhd2FpdCBzZXRBY3RpdmVXb3Jrc3BhY2VTbHVnKGRhdGEuc2x1Zyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIG9uTWVzc2FnZShcImdldEFjdGl2ZVdvcmtzcGFjZVwiLCBhc3luYyAoKSA9PiBnZXRBY3RpdmVXb3Jrc3BhY2VTbHVnKCkpO1xuXG4gIG9uTWVzc2FnZShcImxpc3RGb2xkZXJcIiwgYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IFtmb2xkZXJzLCBmaWxlc1Jlc3AsIGJyZWFkY3J1bWJzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgdHJwY1F1ZXJ5PFJhd0ZvbGRlcltdPihcbiAgICAgICAgICBcImZvbGRlcnMubGlzdFwiLFxuICAgICAgICAgIHsgcGFyZW50SWQ6IGRhdGEuZm9sZGVySWQgfSxcbiAgICAgICAgICB7IHdvcmtzcGFjZVNsdWc6IGRhdGEud29ya3NwYWNlU2x1ZyB9LFxuICAgICAgICApLFxuICAgICAgICB0cnBjUXVlcnk8RmlsZXNMaXN0UmVzcG9uc2U+KFxuICAgICAgICAgIFwiZmlsZXMubGlzdFwiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvbGRlcklkOiBkYXRhLmZvbGRlcklkLFxuICAgICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgICAgIHBhZ2VTaXplOiAyMDAsXG4gICAgICAgICAgICBmaWVsZDogXCJuYW1lXCIsXG4gICAgICAgICAgICBkaXJlY3Rpb246IFwiYXNjXCIsXG4gICAgICAgICAgICBhY2NlcHQ6IGRhdGEuYWNjZXB0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyB3b3Jrc3BhY2VTbHVnOiBkYXRhLndvcmtzcGFjZVNsdWcgfSxcbiAgICAgICAgKSxcbiAgICAgICAgdHJwY1F1ZXJ5PEJyZWFkY3J1bWJSb3dbXT4oXG4gICAgICAgICAgXCJmb2xkZXJzLmdldEJyZWFkY3J1bWJzXCIsXG4gICAgICAgICAgeyBmb2xkZXJJZDogZGF0YS5mb2xkZXJJZCB9LFxuICAgICAgICAgIHsgd29ya3NwYWNlU2x1ZzogZGF0YS53b3Jrc3BhY2VTbHVnIH0sXG4gICAgICAgICksXG4gICAgICBdKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IHRydWUgYXMgY29uc3QsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBmb2xkZXJzOiBmb2xkZXJzLm1hcCgoZikgPT4gKHtcbiAgICAgICAgICAgIGlkOiBmLmlkLFxuICAgICAgICAgICAgbmFtZTogZi5uYW1lLFxuICAgICAgICAgICAgcGFyZW50SWQ6IGYucGFyZW50SWQsXG4gICAgICAgICAgfSkpLFxuICAgICAgICAgIGZpbGVzOiBmaWxlc1Jlc3AuaXRlbXMubWFwKChmKSA9PiAoe1xuICAgICAgICAgICAgaWQ6IGYuaWQsXG4gICAgICAgICAgICBuYW1lOiBmLm5hbWUsXG4gICAgICAgICAgICBzaXplOiBmLnNpemUsXG4gICAgICAgICAgICBtaW1lVHlwZTogZi5taW1lVHlwZSxcbiAgICAgICAgICAgIGZvbGRlcklkOiBmLmZvbGRlcklkLFxuICAgICAgICAgICAgdXBkYXRlZEF0OlxuICAgICAgICAgICAgICB0eXBlb2YgZi51cGRhdGVkQXQgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IGYudXBkYXRlZEF0XG4gICAgICAgICAgICAgICAgOiBuZXcgRGF0ZShmLnVwZGF0ZWRBdCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICB9KSksXG4gICAgICAgICAgYnJlYWRjcnVtYnMsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgZSA9IGVyciBhcyBUcnBjRXJyb3I7XG4gICAgICBpZiAoZS5zdGF0dXMgPT09IDQwMSkgYXdhaXQgc2V0U2lnbmVkSW4oZmFsc2UpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlIGFzIGNvbnN0LCBlcnJvcjogZS5tZXNzYWdlLCBzdGF0dXM6IGUuc3RhdHVzIH07XG4gICAgfVxuICB9KTtcblxuICBvbk1lc3NhZ2UoXCJmZXRjaEZpbGVGb3JVcGxvYWRcIiwgYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1ldGEgPSBhd2FpdCB0cnBjTXV0YXRpb248RG93bmxvYWRVcmxSZXN1bHQ+KFxuICAgICAgICBcImZpbGVzLmdldERvd25sb2FkVXJsXCIsXG4gICAgICAgIHsgaWQ6IGRhdGEuZmlsZUlkIH0sXG4gICAgICAgIHsgd29ya3NwYWNlU2x1ZzogZGF0YS53b3Jrc3BhY2VTbHVnIH0sXG4gICAgICApO1xuICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IGRvd25sb2FkQXNCbG9iKG1ldGEudXJsKTtcbiAgICAgIGNvbnN0IGRhdGFCYXNlNjQgPSBhd2FpdCBibG9iVG9CYXNlNjQoYmxvYik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogdHJ1ZSBhcyBjb25zdCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIG5hbWU6IG1ldGEuZmlsZW5hbWUsXG4gICAgICAgICAgbWltZVR5cGU6IG1ldGEubWltZVR5cGUgfHwgYmxvYi50eXBlIHx8IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsXG4gICAgICAgICAgc2l6ZTogYmxvYi5zaXplLFxuICAgICAgICAgIGRhdGFCYXNlNjQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgZSA9IGVyciBhcyBUcnBjRXJyb3IgfCBFcnJvcjtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IChlIGFzIFRycGNFcnJvcikuc3RhdHVzO1xuICAgICAgaWYgKHN0YXR1cyA9PT0gNDAxKSBhd2FpdCBzZXRTaWduZWRJbihmYWxzZSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UgYXMgY29uc3QsIGVycm9yOiBlLm1lc3NhZ2UsIHN0YXR1cyB9O1xuICAgIH1cbiAgfSk7XG5cbiAgb25NZXNzYWdlKFwibGlzdEdlbmVyYXRpb25UeXBlc1wiLCBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0cnBjUXVlcnk8XG4gICAgICAgIEFycmF5PHtcbiAgICAgICAgICBpZDogc3RyaW5nO1xuICAgICAgICAgIGxhYmVsOiBzdHJpbmc7XG4gICAgICAgICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICAgICAgICBleHRlbnNpb246IHN0cmluZztcbiAgICAgICAgICBtaW1lVHlwZTogc3RyaW5nO1xuICAgICAgICAgIGtpbmQ6IFwidGV4dFwiIHwgXCJpbWFnZVwiO1xuICAgICAgICB9PlxuICAgICAgPihcImFzc2lzdGFudC5nZW5lcmF0aW9uVHlwZXNcIiwgbnVsbCk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCwgZGF0YSB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgZSA9IGVyciBhcyBUcnBjRXJyb3I7XG4gICAgICBpZiAoZS5zdGF0dXMgPT09IDQwMSkgYXdhaXQgc2V0U2lnbmVkSW4oZmFsc2UpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlIGFzIGNvbnN0LCBlcnJvcjogZS5tZXNzYWdlLCBzdGF0dXM6IGUuc3RhdHVzIH07XG4gICAgfVxuICB9KTtcblxuICBvbk1lc3NhZ2UoXCJnZW5lcmF0ZUZpbGVcIiwgYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNhbGxHZW5lcmF0ZUZpbGUoZGF0YSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCwgZGF0YTogcmVzIH07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zdCBlID0gZXJyIGFzIEVycm9yICYgeyBzdGF0dXM/OiBudW1iZXIgfTtcbiAgICAgIGlmIChlLnN0YXR1cyA9PT0gNDAxKSBhd2FpdCBzZXRTaWduZWRJbihmYWxzZSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UgYXMgY29uc3QsIGVycm9yOiBlLm1lc3NhZ2UsIHN0YXR1czogZS5zdGF0dXMgfTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbmludGVyZmFjZSBHZW5lcmF0ZUlucHV0IHtcbiAgd29ya3NwYWNlU2x1Zzogc3RyaW5nO1xuICB0eXBlSWQ6IHN0cmluZztcbiAgcHJvbXB0OiBzdHJpbmc7XG4gIGF0dGFjaG1lbnRzPzogeyBuYW1lOiBzdHJpbmc7IG1pbWVUeXBlOiBzdHJpbmc7IGRhdGFCYXNlNjQ6IHN0cmluZyB9W107XG4gIGxvY2tlckZpbGVJZHM/OiBzdHJpbmdbXTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FsbEdlbmVyYXRlRmlsZShpbnB1dDogR2VuZXJhdGVJbnB1dCk6IFByb21pc2U8e1xuICBuYW1lOiBzdHJpbmc7XG4gIG1pbWVUeXBlOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgZGF0YUJhc2U2NDogc3RyaW5nO1xufT4ge1xuICBjb25zdCBlbnYgPSBpbXBvcnQubWV0YS5lbnYgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICBjb25zdCBob3N0ID0gKFxuICAgIGVudi5XWFRfUFVCTElDX0xPQ0tFUl9XRUJfSE9TVCA/PyBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiXG4gICkucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtob3N0fS9hcGkvYWkvZ2VuZXJhdGUtZmlsZWAsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICBoZWFkZXJzOiB7XG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwieC13b3Jrc3BhY2Utc2x1Z1wiOiBpbnB1dC53b3Jrc3BhY2VTbHVnLFxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgdHlwZUlkOiBpbnB1dC50eXBlSWQsXG4gICAgICBwcm9tcHQ6IGlucHV0LnByb21wdCxcbiAgICAgIGF0dGFjaG1lbnRzOiBpbnB1dC5hdHRhY2htZW50cyxcbiAgICAgIGxvY2tlckZpbGVJZHM6IGlucHV0LmxvY2tlckZpbGVJZHMsXG4gICAgfSksXG4gIH0pO1xuICBpZiAoIXJlcy5vaykge1xuICAgIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKSkgYXMge1xuICAgICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgfSB8IG51bGw7XG4gICAgY29uc3QgZXJyOiBFcnJvciAmIHsgc3RhdHVzPzogbnVtYmVyIH0gPSBuZXcgRXJyb3IoXG4gICAgICBib2R5Py5lcnJvciA/PyBgZ2VuZXJhdGUtZmlsZSAke3Jlcy5zdGF0dXN9YCxcbiAgICApO1xuICAgIGVyci5zdGF0dXMgPSByZXMuc3RhdHVzO1xuICAgIHRocm93IGVycjtcbiAgfVxuICByZXR1cm4gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgbWltZVR5cGU6IHN0cmluZztcbiAgICBzaXplOiBudW1iZXI7XG4gICAgZGF0YUJhc2U2NDogc3RyaW5nO1xuICB9O1xufVxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDksMTAsMTEsMTIsMTUsMTZdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQUNBLFNBQVMsaUJBQWlCLEtBQUs7QUFDOUIsTUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sS0FBSztBQUNsRSxTQUFPOzs7O0NDSFIsSUFBTSxPQUFPO0VB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