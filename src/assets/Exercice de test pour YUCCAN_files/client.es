import "/node_modules/vite/dist/client/env.mjs";

//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.77.0/node_modules/@oxc-project/runtime/src/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
		return typeof o$1;
	} : function(o$1) {
		return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
	}, _typeof(o);
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.77.0/node_modules/@oxc-project/runtime/src/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.77.0/node_modules/@oxc-project/runtime/src/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.77.0/node_modules/@oxc-project/runtime/src/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}

//#endregion
//#region src/shared/hmr.ts
var HMRContext = class {
	constructor(hmrClient$1, ownerPath) {
		this.hmrClient = hmrClient$1;
		this.ownerPath = ownerPath;
		_defineProperty(this, "newListeners", void 0);
		if (!hmrClient$1.dataMap.has(ownerPath)) hmrClient$1.dataMap.set(ownerPath, {});
		const mod = hmrClient$1.hotModulesMap.get(ownerPath);
		if (mod) mod.callbacks = [];
		const staleListeners = hmrClient$1.ctxToListenersMap.get(ownerPath);
		if (staleListeners) for (const [event, staleFns] of staleListeners) {
			const listeners = hmrClient$1.customListenersMap.get(event);
			if (listeners) hmrClient$1.customListenersMap.set(event, listeners.filter((l) => !staleFns.includes(l)));
		}
		this.newListeners = /* @__PURE__ */ new Map();
		hmrClient$1.ctxToListenersMap.set(ownerPath, this.newListeners);
	}
	get data() {
		return this.hmrClient.dataMap.get(this.ownerPath);
	}
	accept(deps, callback) {
		if (typeof deps === "function" || !deps) this.acceptDeps([this.ownerPath], ([mod]) => deps?.(mod));
		else if (typeof deps === "string") this.acceptDeps([deps], ([mod]) => callback?.(mod));
		else if (Array.isArray(deps)) this.acceptDeps(deps, callback);
		else throw new Error(`invalid hot.accept() usage.`);
	}
	acceptExports(_, callback) {
		this.acceptDeps([this.ownerPath], ([mod]) => callback?.(mod));
	}
	dispose(cb) {
		this.hmrClient.disposeMap.set(this.ownerPath, cb);
	}
	prune(cb) {
		this.hmrClient.pruneMap.set(this.ownerPath, cb);
	}
	decline() {}
	invalidate(message) {
		const firstInvalidatedBy = this.hmrClient.currentFirstInvalidatedBy ?? this.ownerPath;
		this.hmrClient.notifyListeners("vite:invalidate", {
			path: this.ownerPath,
			message,
			firstInvalidatedBy
		});
		this.send("vite:invalidate", {
			path: this.ownerPath,
			message,
			firstInvalidatedBy
		});
		this.hmrClient.logger.debug(`invalidate ${this.ownerPath}${message ? `: ${message}` : ""}`);
	}
	on(event, cb) {
		const addToMap = (map) => {
			const existing = map.get(event) || [];
			existing.push(cb);
			map.set(event, existing);
		};
		addToMap(this.hmrClient.customListenersMap);
		addToMap(this.newListeners);
	}
	off(event, cb) {
		const removeFromMap = (map) => {
			const existing = map.get(event);
			if (existing === void 0) return;
			const pruned = existing.filter((l) => l !== cb);
			if (pruned.length === 0) {
				map.delete(event);
				return;
			}
			map.set(event, pruned);
		};
		removeFromMap(this.hmrClient.customListenersMap);
		removeFromMap(this.newListeners);
	}
	send(event, data) {
		this.hmrClient.send({
			type: "custom",
			event,
			data
		});
	}
	acceptDeps(deps, callback = () => {}) {
		const mod = this.hmrClient.hotModulesMap.get(this.ownerPath) || {
			id: this.ownerPath,
			callbacks: []
		};
		mod.callbacks.push({
			deps,
			fn: callback
		});
		this.hmrClient.hotModulesMap.set(this.ownerPath, mod);
	}
};
var HMRClient = class {
	constructor(logger, transport$1, importUpdatedModule) {
		this.logger = logger;
		this.transport = transport$1;
		this.importUpdatedModule = importUpdatedModule;
		_defineProperty(this, "hotModulesMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "disposeMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "pruneMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "dataMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "customListenersMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "ctxToListenersMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "currentFirstInvalidatedBy", void 0);
		_defineProperty(this, "updateQueue", []);
		_defineProperty(this, "pendingUpdateQueue", false);
	}
	async notifyListeners(event, data) {
		const cbs = this.customListenersMap.get(event);
		if (cbs) await Promise.allSettled(cbs.map((cb) => cb(data)));
	}
	send(payload) {
		this.transport.send(payload).catch((err) => {
			this.logger.error(err);
		});
	}
	clear() {
		this.hotModulesMap.clear();
		this.disposeMap.clear();
		this.pruneMap.clear();
		this.dataMap.clear();
		this.customListenersMap.clear();
		this.ctxToListenersMap.clear();
	}
	async prunePaths(paths) {
		await Promise.all(paths.map((path) => {
			const disposer = this.disposeMap.get(path);
			if (disposer) return disposer(this.dataMap.get(path));
		}));
		paths.forEach((path) => {
			const fn = this.pruneMap.get(path);
			if (fn) fn(this.dataMap.get(path));
		});
	}
	warnFailedUpdate(err, path) {
		if (!(err instanceof Error) || !err.message.includes("fetch")) this.logger.error(err);
		this.logger.error(`Failed to reload ${path}. This could be due to syntax errors or importing non-existent modules. (see errors above)`);
	}
	/**
	* buffer multiple hot updates triggered by the same src change
	* so that they are invoked in the same order they were sent.
	* (otherwise the order may be inconsistent because of the http request round trip)
	*/
	async queueUpdate(payload) {
		this.updateQueue.push(this.fetchUpdate(payload));
		if (!this.pendingUpdateQueue) {
			this.pendingUpdateQueue = true;
			await Promise.resolve();
			this.pendingUpdateQueue = false;
			const loading = [...this.updateQueue];
			this.updateQueue = [];
			(await Promise.all(loading)).forEach((fn) => fn && fn());
		}
	}
	async fetchUpdate(update) {
		const { path, acceptedPath, firstInvalidatedBy } = update;
		const mod = this.hotModulesMap.get(path);
		if (!mod) return;
		let fetchedModule;
		const isSelfUpdate = path === acceptedPath;
		const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => deps.includes(acceptedPath));
		if (isSelfUpdate || qualifiedCallbacks.length > 0) {
			const disposer = this.disposeMap.get(acceptedPath);
			if (disposer) await disposer(this.dataMap.get(acceptedPath));
			try {
				fetchedModule = await this.importUpdatedModule(update);
			} catch (e) {
				this.warnFailedUpdate(e, acceptedPath);
			}
		}
		return () => {
			try {
				this.currentFirstInvalidatedBy = firstInvalidatedBy;
				for (const { deps, fn } of qualifiedCallbacks) fn(deps.map((dep) => dep === acceptedPath ? fetchedModule : void 0));
				const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`;
				this.logger.debug(`hot updated: ${loggedPath}`);
			} finally {
				this.currentFirstInvalidatedBy = void 0;
			}
		};
	}
};

//#endregion
//#region ../../node_modules/.pnpm/nanoid@5.1.5/node_modules/nanoid/non-secure/index.js
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size = 21) => {
	let id = "";
	let i = size | 0;
	while (i--) id += urlAlphabet[Math.random() * 64 | 0];
	return id;
};

//#endregion
//#region src/shared/constants.ts
let SOURCEMAPPING_URL = "sourceMa";
SOURCEMAPPING_URL += "ppingURL";

//#endregion
//#region src/shared/utils.ts
const isWindows = typeof process !== "undefined" && process.platform === "win32";
const AsyncFunction = async function() {}.constructor;
function promiseWithResolvers() {
	let resolve;
	let reject;
	const promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	return {
		promise,
		resolve,
		reject
	};
}

//#endregion
//#region src/shared/moduleRunnerTransport.ts
function reviveInvokeError(e) {
	const error = new Error(e.message || "Unknown invoke error");
	Object.assign(error, e, { runnerError: /* @__PURE__ */ new Error("RunnerError") });
	return error;
}
const createInvokeableTransport = (transport$1) => {
	if (transport$1.invoke) return {
		...transport$1,
		async invoke(name, data) {
			const result = await transport$1.invoke({
				type: "custom",
				event: "vite:invoke",
				data: {
					id: "send",
					name,
					data
				}
			});
			if ("error" in result) throw reviveInvokeError(result.error);
			return result.result;
		}
	};
	if (!transport$1.send || !transport$1.connect) throw new Error("transport must implement send and connect when invoke is not implemented");
	const rpcPromises = /* @__PURE__ */ new Map();
	return {
		...transport$1,
		connect({ onMessage, onDisconnection }) {
			return transport$1.connect({
				onMessage(payload) {
					if (payload.type === "custom" && payload.event === "vite:invoke") {
						const data = payload.data;
						if (data.id.startsWith("response:")) {
							const invokeId = data.id.slice(9);
							const promise = rpcPromises.get(invokeId);
							if (!promise) return;
							if (promise.timeoutId) clearTimeout(promise.timeoutId);
							rpcPromises.delete(invokeId);
							const { error, result } = data.data;
							if (error) promise.reject(error);
							else promise.resolve(result);
							return;
						}
					}
					onMessage(payload);
				},
				onDisconnection
			});
		},
		disconnect() {
			rpcPromises.forEach((promise) => {
				promise.reject(/* @__PURE__ */ new Error(`transport was disconnected, cannot call ${JSON.stringify(promise.name)}`));
			});
			rpcPromises.clear();
			return transport$1.disconnect?.();
		},
		send(data) {
			return transport$1.send(data);
		},
		async invoke(name, data) {
			const promiseId = nanoid();
			const wrappedData = {
				type: "custom",
				event: "vite:invoke",
				data: {
					name,
					id: `send:${promiseId}`,
					data
				}
			};
			const sendPromise = transport$1.send(wrappedData);
			const { promise, resolve, reject } = promiseWithResolvers();
			const timeout = transport$1.timeout ?? 6e4;
			let timeoutId;
			if (timeout > 0) {
				timeoutId = setTimeout(() => {
					rpcPromises.delete(promiseId);
					reject(/* @__PURE__ */ new Error(`transport invoke timed out after ${timeout}ms (data: ${JSON.stringify(wrappedData)})`));
				}, timeout);
				timeoutId?.unref?.();
			}
			rpcPromises.set(promiseId, {
				resolve,
				reject,
				name,
				timeoutId
			});
			if (sendPromise) sendPromise.catch((err) => {
				clearTimeout(timeoutId);
				rpcPromises.delete(promiseId);
				reject(err);
			});
			try {
				return await promise;
			} catch (err) {
				throw reviveInvokeError(err);
			}
		}
	};
};
const normalizeModuleRunnerTransport = (transport$1) => {
	const invokeableTransport = createInvokeableTransport(transport$1);
	let isConnected = !invokeableTransport.connect;
	let connectingPromise;
	return {
		...transport$1,
		...invokeableTransport.connect ? { async connect(onMessage) {
			if (isConnected) return;
			if (connectingPromise) {
				await connectingPromise;
				return;
			}
			const maybePromise = invokeableTransport.connect({
				onMessage: onMessage ?? (() => {}),
				onDisconnection() {
					isConnected = false;
				}
			});
			if (maybePromise) {
				connectingPromise = maybePromise;
				await connectingPromise;
				connectingPromise = void 0;
			}
			isConnected = true;
		} } : {},
		...invokeableTransport.disconnect ? { async disconnect() {
			if (!isConnected) return;
			if (connectingPromise) await connectingPromise;
			isConnected = false;
			await invokeableTransport.disconnect();
		} } : {},
		async send(data) {
			if (!invokeableTransport.send) return;
			if (!isConnected) if (connectingPromise) await connectingPromise;
			else throw new Error("send was called before connect");
			await invokeableTransport.send(data);
		},
		async invoke(name, data) {
			if (!isConnected) if (connectingPromise) await connectingPromise;
			else throw new Error("invoke was called before connect");
			return invokeableTransport.invoke(name, data);
		}
	};
};
const createWebSocketModuleRunnerTransport = (options) => {
	const pingInterval = options.pingInterval ?? 3e4;
	let ws;
	let pingIntervalId;
	return {
		async connect({ onMessage, onDisconnection }) {
			const socket = options.createConnection();
			socket.addEventListener("message", async ({ data }) => {
				onMessage(JSON.parse(data));
			});
			let isOpened = socket.readyState === socket.OPEN;
			if (!isOpened) await new Promise((resolve, reject) => {
				socket.addEventListener("open", () => {
					isOpened = true;
					resolve();
				}, { once: true });
				socket.addEventListener("close", async () => {
					if (!isOpened) {
						reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));
						return;
					}
					onMessage({
						type: "custom",
						event: "vite:ws:disconnect",
						data: { webSocket: socket }
					});
					onDisconnection();
				});
			});
			onMessage({
				type: "custom",
				event: "vite:ws:connect",
				data: { webSocket: socket }
			});
			ws = socket;
			pingIntervalId = setInterval(() => {
				if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
			}, pingInterval);
		},
		disconnect() {
			clearInterval(pingIntervalId);
			ws?.close();
		},
		send(data) {
			ws.send(JSON.stringify(data));
		}
	};
};

//#endregion
//#region src/shared/hmrHandler.ts
function createHMRHandler(handler) {
	const queue = new Queue();
	return (payload) => queue.enqueue(() => handler(payload));
}
var Queue = class {
	constructor() {
		_defineProperty(this, "queue", []);
		_defineProperty(this, "pending", false);
	}
	enqueue(promise) {
		return new Promise((resolve, reject) => {
			this.queue.push({
				promise,
				resolve,
				reject
			});
			this.dequeue();
		});
	}
	dequeue() {
		if (this.pending) return false;
		const item = this.queue.shift();
		if (!item) return false;
		this.pending = true;
		item.promise().then(item.resolve).catch(item.reject).finally(() => {
			this.pending = false;
			this.dequeue();
		});
		return true;
	}
};

//#endregion
//#region src/client/overlay.ts
const hmrConfigName = "vite.config.js";
const base$1 = "/" || "/";
function h(e, attrs = {}, ...children) {
	const elem = document.createElement(e);
	for (const [k, v] of Object.entries(attrs)) elem.setAttribute(k, v);
	elem.append(...children);
	return elem;
}
const templateStyle = `
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  --monospace: 'SFMono-Regular', Consolas,
  'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;

  --window-background: #181818;
  --window-color: #d8d8d8;
}

.backdrop {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  max-width: 80vw;
  color: var(--window-color);
  box-sizing: border-box;
  margin: 30px auto;
  padding: 2.5vh 4vw;
  position: relative;
  background: var(--window-background);
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

pre.frame::-webkit-scrollbar {
  display: block;
  height: 5px;
}

pre.frame::-webkit-scrollbar-thumb {
  background: #999;
  border-radius: 5px;
}

pre.frame {
  scrollbar-width: thin;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
  line-height: 1.8;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}

kbd {
  line-height: 1.5;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: rgb(38, 40, 44);
  color: rgb(166, 167, 171);
  padding: 0.15rem 0.3rem;
  border-radius: 0.25rem;
  border-width: 0.0625rem 0.0625rem 0.1875rem;
  border-style: solid;
  border-color: rgb(54, 57, 64);
  border-image: initial;
}
`;
const createTemplate = () => h("div", {
	class: "backdrop",
	part: "backdrop"
}, h("div", {
	class: "window",
	part: "window"
}, h("pre", {
	class: "message",
	part: "message"
}, h("span", {
	class: "plugin",
	part: "plugin"
}), h("span", {
	class: "message-body",
	part: "message-body"
})), h("pre", {
	class: "file",
	part: "file"
}), h("pre", {
	class: "frame",
	part: "frame"
}), h("pre", {
	class: "stack",
	part: "stack"
}), h("div", {
	class: "tip",
	part: "tip"
}, "Click outside, press ", h("kbd", {}, "Esc"), " key, or fix the code to dismiss.", h("br"), "You can also disable this overlay by setting ", h("code", { part: "config-option-name" }, "server.hmr.overlay"), " to ", h("code", { part: "config-option-value" }, "false"), " in ", h("code", { part: "config-file-name" }, hmrConfigName), ".")), h("style", {}, templateStyle));
const fileRE = /(?:file:\/\/)?(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;
const codeframeRE = /^(?:>?\s*\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm;
const { HTMLElement = class {} } = globalThis;
var ErrorOverlay = class extends HTMLElement {
	constructor(err, links = true) {
		super();
		_defineProperty(this, "root", void 0);
		_defineProperty(this, "closeOnEsc", void 0);
		this.root = this.attachShadow({ mode: "open" });
		this.root.appendChild(createTemplate());
		codeframeRE.lastIndex = 0;
		const hasFrame = err.frame && codeframeRE.test(err.frame);
		const message = hasFrame ? err.message.replace(codeframeRE, "") : err.message;
		if (err.plugin) this.text(".plugin", `[plugin:${err.plugin}] `);
		this.text(".message-body", message.trim());
		const [file] = (err.loc?.file || err.id || "unknown file").split(`?`);
		if (err.loc) this.text(".file", `${file}:${err.loc.line}:${err.loc.column}`, links);
		else if (err.id) this.text(".file", file);
		if (hasFrame) this.text(".frame", err.frame.trim());
		this.text(".stack", err.stack, links);
		this.root.querySelector(".window").addEventListener("click", (e) => {
			e.stopPropagation();
		});
		this.addEventListener("click", () => {
			this.close();
		});
		this.closeOnEsc = (e) => {
			if (e.key === "Escape" || e.code === "Escape") this.close();
		};
		document.addEventListener("keydown", this.closeOnEsc);
	}
	text(selector, text, linkFiles = false) {
		const el = this.root.querySelector(selector);
		if (!linkFiles) el.textContent = text;
		else {
			let curIndex = 0;
			let match;
			fileRE.lastIndex = 0;
			while (match = fileRE.exec(text)) {
				const { 0: file, index } = match;
				const frag = text.slice(curIndex, index);
				el.appendChild(document.createTextNode(frag));
				const link = document.createElement("a");
				link.textContent = file;
				link.className = "file-link";
				link.onclick = () => {
					fetch(new URL(`${base$1}__open-in-editor?file=${encodeURIComponent(file)}`, import.meta.url));
				};
				el.appendChild(link);
				curIndex += frag.length + file.length;
			}
			if (curIndex < text.length) el.appendChild(document.createTextNode(text.slice(curIndex)));
		}
	}
	close() {
		this.parentNode?.removeChild(this);
		document.removeEventListener("keydown", this.closeOnEsc);
	}
};
const overlayId = "vite-error-overlay";
const { customElements } = globalThis;
if (customElements && !customElements.get(overlayId)) customElements.define(overlayId, ErrorOverlay);

//#endregion
//#region src/client/client.ts
console.debug("[vite] connecting...");
const importMetaUrl = new URL(import.meta.url);
const serverHost = "localhost:5173/";
const socketProtocol = null || (importMetaUrl.protocol === "https:" ? "wss" : "ws");
const hmrPort = null;
const socketHost = `${null || importMetaUrl.hostname}:${hmrPort || importMetaUrl.port}${"/"}`;
const directSocketHost = "localhost:5173/";
const base = "/" || "/";
const hmrTimeout = 30000;
const wsToken = "KyR0OGVh7owc";
const transport = normalizeModuleRunnerTransport((() => {
	let wsTransport = createWebSocketModuleRunnerTransport({
		createConnection: () => new WebSocket(`${socketProtocol}://${socketHost}?token=${wsToken}`, "vite-hmr"),
		pingInterval: hmrTimeout
	});
	return {
		async connect(handlers) {
			try {
				await wsTransport.connect(handlers);
			} catch (e) {
				if (!hmrPort) {
					wsTransport = createWebSocketModuleRunnerTransport({
						createConnection: () => new WebSocket(`${socketProtocol}://${directSocketHost}?token=${wsToken}`, "vite-hmr"),
						pingInterval: hmrTimeout
					});
					try {
						await wsTransport.connect(handlers);
						console.info("[vite] Direct websocket connection fallback. Check out https://vite.dev/config/server-options.html#server-hmr to remove the previous connection error.");
					} catch (e$1) {
						if (e$1 instanceof Error && e$1.message.includes("WebSocket closed without opened.")) {
							const currentScriptHostURL = new URL(import.meta.url);
							const currentScriptHost = currentScriptHostURL.host + currentScriptHostURL.pathname.replace(/@vite\/client$/, "");
							console.error(`[vite] failed to connect to websocket.
your current setup:
  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\nCheck out your Vite / network configuration and https://vite.dev/config/server-options.html#server-hmr .`);
						}
					}
					return;
				}
				console.error(`[vite] failed to connect to websocket (${e}). `);
				throw e;
			}
		},
		async disconnect() {
			await wsTransport.disconnect();
		},
		send(data) {
			wsTransport.send(data);
		}
	};
})());
let willUnload = false;
if (typeof window !== "undefined") window.addEventListener?.("beforeunload", () => {
	willUnload = true;
});
function cleanUrl(pathname) {
	const url = new URL(pathname, "http://vite.dev");
	url.searchParams.delete("direct");
	return url.pathname + url.search;
}
let isFirstUpdate = true;
const outdatedLinkTags = /* @__PURE__ */ new WeakSet();
const debounceReload = (time) => {
	let timer;
	return () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(() => {
			location.reload();
		}, time);
	};
};
const pageReload = debounceReload(50);
const hmrClient = new HMRClient({
	error: (err) => console.error("[vite]", err),
	debug: (...msg) => console.debug("[vite]", ...msg)
}, transport, async function importUpdatedModule({ acceptedPath, timestamp, explicitImportRequired, isWithinCircularImport }) {
	const [acceptedPathWithoutQuery, query] = acceptedPath.split(`?`);
	const importPromise = import(
		/* @vite-ignore */
		base + acceptedPathWithoutQuery.slice(1) + `?${explicitImportRequired ? "import&" : ""}t=${timestamp}${query ? `&${query}` : ""}`
);
	if (isWithinCircularImport) importPromise.catch(() => {
		console.info(`[hmr] ${acceptedPath} failed to apply HMR as it's within a circular import. Reloading page to reset the execution order. To debug and break the circular import, you can run \`vite --debug hmr\` to log the circular dependency path if a file change triggered it.`);
		pageReload();
	});
	return await importPromise;
});
transport.connect(createHMRHandler(handleMessage));
async function handleMessage(payload) {
	switch (payload.type) {
		case "connected":
			console.debug(`[vite] connected.`);
			break;
		case "update":
			await hmrClient.notifyListeners("vite:beforeUpdate", payload);
			if (hasDocument) if (isFirstUpdate && hasErrorOverlay()) {
				location.reload();
				return;
			} else {
				if (enableOverlay) clearErrorOverlay();
				isFirstUpdate = false;
			}
			await Promise.all(payload.updates.map(async (update) => {
				if (update.type === "js-update") return hmrClient.queueUpdate(update);
				const { path, timestamp } = update;
				const searchUrl = cleanUrl(path);
				const el = Array.from(document.querySelectorAll("link")).find((e) => !outdatedLinkTags.has(e) && cleanUrl(e.href).includes(searchUrl));
				if (!el) return;
				const newPath = `${base}${searchUrl.slice(1)}${searchUrl.includes("?") ? "&" : "?"}t=${timestamp}`;
				return new Promise((resolve) => {
					const newLinkTag = el.cloneNode();
					newLinkTag.href = new URL(newPath, el.href).href;
					const removeOldEl = () => {
						el.remove();
						console.debug(`[vite] css hot updated: ${searchUrl}`);
						resolve();
					};
					newLinkTag.addEventListener("load", removeOldEl);
					newLinkTag.addEventListener("error", removeOldEl);
					outdatedLinkTags.add(el);
					el.after(newLinkTag);
				});
			}));
			await hmrClient.notifyListeners("vite:afterUpdate", payload);
			break;
		case "custom": {
			await hmrClient.notifyListeners(payload.event, payload.data);
			if (payload.event === "vite:ws:disconnect") {
				if (hasDocument && !willUnload) {
					console.log(`[vite] server connection lost. Polling for restart...`);
					const socket = payload.data.webSocket;
					const url = new URL(socket.url);
					url.search = "";
					await waitForSuccessfulPing(url.href);
					location.reload();
				}
			}
			break;
		}
		case "full-reload":
			await hmrClient.notifyListeners("vite:beforeFullReload", payload);
			if (hasDocument) if (payload.path && payload.path.endsWith(".html")) {
				const pagePath = decodeURI(location.pathname);
				const payloadPath = base + payload.path.slice(1);
				if (pagePath === payloadPath || payload.path === "/index.html" || pagePath.endsWith("/") && pagePath + "index.html" === payloadPath) pageReload();
				return;
			} else pageReload();
			break;
		case "prune":
			await hmrClient.notifyListeners("vite:beforePrune", payload);
			await hmrClient.prunePaths(payload.paths);
			break;
		case "error": {
			await hmrClient.notifyListeners("vite:error", payload);
			if (hasDocument) {
				const err = payload.err;
				if (enableOverlay) createErrorOverlay(err);
				else console.error(`[vite] Internal Server Error\n${err.message}\n${err.stack}`);
			}
			break;
		}
		case "ping": break;
		default: {
			const check = payload;
			return check;
		}
	}
}
const enableOverlay = true;
const hasDocument = "document" in globalThis;
function createErrorOverlay(err) {
	clearErrorOverlay();
	const { customElements: customElements$1 } = globalThis;
	if (customElements$1) {
		const ErrorOverlayConstructor = customElements$1.get(overlayId);
		document.body.appendChild(new ErrorOverlayConstructor(err));
	}
}
function clearErrorOverlay() {
	document.querySelectorAll(overlayId).forEach((n) => n.close());
}
function hasErrorOverlay() {
	return document.querySelectorAll(overlayId).length;
}
async function waitForSuccessfulPing(socketUrl, ms = 1e3) {
	async function ping() {
		const socket = new WebSocket(socketUrl, "vite-ping");
		return new Promise((resolve) => {
			function onOpen() {
				resolve(true);
				close();
			}
			function onError() {
				resolve(false);
				close();
			}
			function close() {
				socket.removeEventListener("open", onOpen);
				socket.removeEventListener("error", onError);
				socket.close();
			}
			socket.addEventListener("open", onOpen);
			socket.addEventListener("error", onError);
		});
	}
	if (await ping()) return;
	await wait(ms);
	while (true) if (document.visibilityState === "visible") {
		if (await ping()) break;
		await wait(ms);
	} else await waitForWindowShow();
}
function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function waitForWindowShow() {
	return new Promise((resolve) => {
		const onChange = async () => {
			if (document.visibilityState === "visible") {
				resolve();
				document.removeEventListener("visibilitychange", onChange);
			}
		};
		document.addEventListener("visibilitychange", onChange);
	});
}
const sheetsMap = /* @__PURE__ */ new Map();
if ("document" in globalThis) document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
	sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
});
const cspNonce = "document" in globalThis ? document.querySelector("meta[property=csp-nonce]")?.nonce : void 0;
let lastInsertedStyle;
function updateStyle(id, content) {
	let style = sheetsMap.get(id);
	if (!style) {
		style = document.createElement("style");
		style.setAttribute("type", "text/css");
		style.setAttribute("data-vite-dev-id", id);
		style.textContent = content;
		if (cspNonce) style.setAttribute("nonce", cspNonce);
		if (!lastInsertedStyle) {
			document.head.appendChild(style);
			setTimeout(() => {
				lastInsertedStyle = void 0;
			}, 0);
		} else lastInsertedStyle.insertAdjacentElement("afterend", style);
		lastInsertedStyle = style;
	} else style.textContent = content;
	sheetsMap.set(id, style);
}
function removeStyle(id) {
	const style = sheetsMap.get(id);
	if (style) {
		document.head.removeChild(style);
		sheetsMap.delete(id);
	}
}
function createHotContext(ownerPath) {
	return new HMRContext(hmrClient, ownerPath);
}
/**
* urls here are dynamic import() urls that couldn't be statically analyzed
*/
function injectQuery(url, queryToInject) {
	if (url[0] !== "." && url[0] !== "/") return url;
	const pathname = url.replace(/[?#].*$/, "");
	const { search, hash } = new URL(url, "http://vite.dev");
	return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ""}${hash || ""}`;
}

//#endregion
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsaWVudCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCIvbm9kZV9tb2R1bGVzL3ZpdGUvZGlzdC9jbGllbnQvZW52Lm1qc1wiO1xuXG4vLyNyZWdpb24gLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BveGMtcHJvamVjdCtydW50aW1lQDAuNzcuMC9ub2RlX21vZHVsZXMvQG94Yy1wcm9qZWN0L3J1bnRpbWUvc3JjL2hlbHBlcnMvZXNtL3R5cGVvZi5qc1xuZnVuY3Rpb24gX3R5cGVvZihvKSB7XG5cdFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblx0cmV0dXJuIF90eXBlb2YgPSBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBcInN5bWJvbFwiID09IHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPyBmdW5jdGlvbihvJDEpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG8kMTtcblx0fSA6IGZ1bmN0aW9uKG8kMSkge1xuXHRcdHJldHVybiBvJDEgJiYgXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgbyQxLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgbyQxICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvJDE7XG5cdH0sIF90eXBlb2Yobyk7XG59XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIC4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ab3hjLXByb2plY3QrcnVudGltZUAwLjc3LjAvbm9kZV9tb2R1bGVzL0BveGMtcHJvamVjdC9ydW50aW1lL3NyYy9oZWxwZXJzL2VzbS90b1ByaW1pdGl2ZS5qc1xuZnVuY3Rpb24gdG9QcmltaXRpdmUodCwgcikge1xuXHRpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKHQpIHx8ICF0KSByZXR1cm4gdDtcblx0dmFyIGUgPSB0W1N5bWJvbC50b1ByaW1pdGl2ZV07XG5cdGlmICh2b2lkIDAgIT09IGUpIHtcblx0XHR2YXIgaSA9IGUuY2FsbCh0LCByIHx8IFwiZGVmYXVsdFwiKTtcblx0XHRpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKGkpKSByZXR1cm4gaTtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7XG5cdH1cblx0cmV0dXJuIChcInN0cmluZ1wiID09PSByID8gU3RyaW5nIDogTnVtYmVyKSh0KTtcbn1cblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BveGMtcHJvamVjdCtydW50aW1lQDAuNzcuMC9ub2RlX21vZHVsZXMvQG94Yy1wcm9qZWN0L3J1bnRpbWUvc3JjL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanNcbmZ1bmN0aW9uIHRvUHJvcGVydHlLZXkodCkge1xuXHR2YXIgaSA9IHRvUHJpbWl0aXZlKHQsIFwic3RyaW5nXCIpO1xuXHRyZXR1cm4gXCJzeW1ib2xcIiA9PSBfdHlwZW9mKGkpID8gaSA6IGkgKyBcIlwiO1xufVxuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiAuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQG94Yy1wcm9qZWN0K3J1bnRpbWVAMC43Ny4wL25vZGVfbW9kdWxlcy9Ab3hjLXByb2plY3QvcnVudGltZS9zcmMvaGVscGVycy9lc20vZGVmaW5lUHJvcGVydHkuanNcbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShlLCByLCB0KSB7XG5cdHJldHVybiAociA9IHRvUHJvcGVydHlLZXkocikpIGluIGUgPyBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgciwge1xuXHRcdHZhbHVlOiB0LFxuXHRcdGVudW1lcmFibGU6ICEwLFxuXHRcdGNvbmZpZ3VyYWJsZTogITAsXG5cdFx0d3JpdGFibGU6ICEwXG5cdH0pIDogZVtyXSA9IHQsIGU7XG59XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9zaGFyZWQvaG1yLnRzXG52YXIgSE1SQ29udGV4dCA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoaG1yQ2xpZW50JDEsIG93bmVyUGF0aCkge1xuXHRcdHRoaXMuaG1yQ2xpZW50ID0gaG1yQ2xpZW50JDE7XG5cdFx0dGhpcy5vd25lclBhdGggPSBvd25lclBhdGg7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwibmV3TGlzdGVuZXJzXCIsIHZvaWQgMCk7XG5cdFx0aWYgKCFobXJDbGllbnQkMS5kYXRhTWFwLmhhcyhvd25lclBhdGgpKSBobXJDbGllbnQkMS5kYXRhTWFwLnNldChvd25lclBhdGgsIHt9KTtcblx0XHRjb25zdCBtb2QgPSBobXJDbGllbnQkMS5ob3RNb2R1bGVzTWFwLmdldChvd25lclBhdGgpO1xuXHRcdGlmIChtb2QpIG1vZC5jYWxsYmFja3MgPSBbXTtcblx0XHRjb25zdCBzdGFsZUxpc3RlbmVycyA9IGhtckNsaWVudCQxLmN0eFRvTGlzdGVuZXJzTWFwLmdldChvd25lclBhdGgpO1xuXHRcdGlmIChzdGFsZUxpc3RlbmVycykgZm9yIChjb25zdCBbZXZlbnQsIHN0YWxlRm5zXSBvZiBzdGFsZUxpc3RlbmVycykge1xuXHRcdFx0Y29uc3QgbGlzdGVuZXJzID0gaG1yQ2xpZW50JDEuY3VzdG9tTGlzdGVuZXJzTWFwLmdldChldmVudCk7XG5cdFx0XHRpZiAobGlzdGVuZXJzKSBobXJDbGllbnQkMS5jdXN0b21MaXN0ZW5lcnNNYXAuc2V0KGV2ZW50LCBsaXN0ZW5lcnMuZmlsdGVyKChsKSA9PiAhc3RhbGVGbnMuaW5jbHVkZXMobCkpKTtcblx0XHR9XG5cdFx0dGhpcy5uZXdMaXN0ZW5lcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRcdGhtckNsaWVudCQxLmN0eFRvTGlzdGVuZXJzTWFwLnNldChvd25lclBhdGgsIHRoaXMubmV3TGlzdGVuZXJzKTtcblx0fVxuXHRnZXQgZGF0YSgpIHtcblx0XHRyZXR1cm4gdGhpcy5obXJDbGllbnQuZGF0YU1hcC5nZXQodGhpcy5vd25lclBhdGgpO1xuXHR9XG5cdGFjY2VwdChkZXBzLCBjYWxsYmFjaykge1xuXHRcdGlmICh0eXBlb2YgZGVwcyA9PT0gXCJmdW5jdGlvblwiIHx8ICFkZXBzKSB0aGlzLmFjY2VwdERlcHMoW3RoaXMub3duZXJQYXRoXSwgKFttb2RdKSA9PiBkZXBzPy4obW9kKSk7XG5cdFx0ZWxzZSBpZiAodHlwZW9mIGRlcHMgPT09IFwic3RyaW5nXCIpIHRoaXMuYWNjZXB0RGVwcyhbZGVwc10sIChbbW9kXSkgPT4gY2FsbGJhY2s/Lihtb2QpKTtcblx0XHRlbHNlIGlmIChBcnJheS5pc0FycmF5KGRlcHMpKSB0aGlzLmFjY2VwdERlcHMoZGVwcywgY2FsbGJhY2spO1xuXHRcdGVsc2UgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGhvdC5hY2NlcHQoKSB1c2FnZS5gKTtcblx0fVxuXHRhY2NlcHRFeHBvcnRzKF8sIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5hY2NlcHREZXBzKFt0aGlzLm93bmVyUGF0aF0sIChbbW9kXSkgPT4gY2FsbGJhY2s/Lihtb2QpKTtcblx0fVxuXHRkaXNwb3NlKGNiKSB7XG5cdFx0dGhpcy5obXJDbGllbnQuZGlzcG9zZU1hcC5zZXQodGhpcy5vd25lclBhdGgsIGNiKTtcblx0fVxuXHRwcnVuZShjYikge1xuXHRcdHRoaXMuaG1yQ2xpZW50LnBydW5lTWFwLnNldCh0aGlzLm93bmVyUGF0aCwgY2IpO1xuXHR9XG5cdGRlY2xpbmUoKSB7fVxuXHRpbnZhbGlkYXRlKG1lc3NhZ2UpIHtcblx0XHRjb25zdCBmaXJzdEludmFsaWRhdGVkQnkgPSB0aGlzLmhtckNsaWVudC5jdXJyZW50Rmlyc3RJbnZhbGlkYXRlZEJ5ID8/IHRoaXMub3duZXJQYXRoO1xuXHRcdHRoaXMuaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6aW52YWxpZGF0ZVwiLCB7XG5cdFx0XHRwYXRoOiB0aGlzLm93bmVyUGF0aCxcblx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRmaXJzdEludmFsaWRhdGVkQnlcblx0XHR9KTtcblx0XHR0aGlzLnNlbmQoXCJ2aXRlOmludmFsaWRhdGVcIiwge1xuXHRcdFx0cGF0aDogdGhpcy5vd25lclBhdGgsXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0Zmlyc3RJbnZhbGlkYXRlZEJ5XG5cdFx0fSk7XG5cdFx0dGhpcy5obXJDbGllbnQubG9nZ2VyLmRlYnVnKGBpbnZhbGlkYXRlICR7dGhpcy5vd25lclBhdGh9JHttZXNzYWdlID8gYDogJHttZXNzYWdlfWAgOiBcIlwifWApO1xuXHR9XG5cdG9uKGV2ZW50LCBjYikge1xuXHRcdGNvbnN0IGFkZFRvTWFwID0gKG1hcCkgPT4ge1xuXHRcdFx0Y29uc3QgZXhpc3RpbmcgPSBtYXAuZ2V0KGV2ZW50KSB8fCBbXTtcblx0XHRcdGV4aXN0aW5nLnB1c2goY2IpO1xuXHRcdFx0bWFwLnNldChldmVudCwgZXhpc3RpbmcpO1xuXHRcdH07XG5cdFx0YWRkVG9NYXAodGhpcy5obXJDbGllbnQuY3VzdG9tTGlzdGVuZXJzTWFwKTtcblx0XHRhZGRUb01hcCh0aGlzLm5ld0xpc3RlbmVycyk7XG5cdH1cblx0b2ZmKGV2ZW50LCBjYikge1xuXHRcdGNvbnN0IHJlbW92ZUZyb21NYXAgPSAobWFwKSA9PiB7XG5cdFx0XHRjb25zdCBleGlzdGluZyA9IG1hcC5nZXQoZXZlbnQpO1xuXHRcdFx0aWYgKGV4aXN0aW5nID09PSB2b2lkIDApIHJldHVybjtcblx0XHRcdGNvbnN0IHBydW5lZCA9IGV4aXN0aW5nLmZpbHRlcigobCkgPT4gbCAhPT0gY2IpO1xuXHRcdFx0aWYgKHBydW5lZC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0bWFwLmRlbGV0ZShldmVudCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdG1hcC5zZXQoZXZlbnQsIHBydW5lZCk7XG5cdFx0fTtcblx0XHRyZW1vdmVGcm9tTWFwKHRoaXMuaG1yQ2xpZW50LmN1c3RvbUxpc3RlbmVyc01hcCk7XG5cdFx0cmVtb3ZlRnJvbU1hcCh0aGlzLm5ld0xpc3RlbmVycyk7XG5cdH1cblx0c2VuZChldmVudCwgZGF0YSkge1xuXHRcdHRoaXMuaG1yQ2xpZW50LnNlbmQoe1xuXHRcdFx0dHlwZTogXCJjdXN0b21cIixcblx0XHRcdGV2ZW50LFxuXHRcdFx0ZGF0YVxuXHRcdH0pO1xuXHR9XG5cdGFjY2VwdERlcHMoZGVwcywgY2FsbGJhY2sgPSAoKSA9PiB7fSkge1xuXHRcdGNvbnN0IG1vZCA9IHRoaXMuaG1yQ2xpZW50LmhvdE1vZHVsZXNNYXAuZ2V0KHRoaXMub3duZXJQYXRoKSB8fCB7XG5cdFx0XHRpZDogdGhpcy5vd25lclBhdGgsXG5cdFx0XHRjYWxsYmFja3M6IFtdXG5cdFx0fTtcblx0XHRtb2QuY2FsbGJhY2tzLnB1c2goe1xuXHRcdFx0ZGVwcyxcblx0XHRcdGZuOiBjYWxsYmFja1xuXHRcdH0pO1xuXHRcdHRoaXMuaG1yQ2xpZW50LmhvdE1vZHVsZXNNYXAuc2V0KHRoaXMub3duZXJQYXRoLCBtb2QpO1xuXHR9XG59O1xudmFyIEhNUkNsaWVudCA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IobG9nZ2VyLCB0cmFuc3BvcnQkMSwgaW1wb3J0VXBkYXRlZE1vZHVsZSkge1xuXHRcdHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuXHRcdHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0JDE7XG5cdFx0dGhpcy5pbXBvcnRVcGRhdGVkTW9kdWxlID0gaW1wb3J0VXBkYXRlZE1vZHVsZTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJob3RNb2R1bGVzTWFwXCIsIC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRpc3Bvc2VNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwicHJ1bmVNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiZGF0YU1hcFwiLCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJjdXN0b21MaXN0ZW5lcnNNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiY3R4VG9MaXN0ZW5lcnNNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiY3VycmVudEZpcnN0SW52YWxpZGF0ZWRCeVwiLCB2b2lkIDApO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVwZGF0ZVF1ZXVlXCIsIFtdKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJwZW5kaW5nVXBkYXRlUXVldWVcIiwgZmFsc2UpO1xuXHR9XG5cdGFzeW5jIG5vdGlmeUxpc3RlbmVycyhldmVudCwgZGF0YSkge1xuXHRcdGNvbnN0IGNicyA9IHRoaXMuY3VzdG9tTGlzdGVuZXJzTWFwLmdldChldmVudCk7XG5cdFx0aWYgKGNicykgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKGNicy5tYXAoKGNiKSA9PiBjYihkYXRhKSkpO1xuXHR9XG5cdHNlbmQocGF5bG9hZCkge1xuXHRcdHRoaXMudHJhbnNwb3J0LnNlbmQocGF5bG9hZCkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KTtcblx0fVxuXHRjbGVhcigpIHtcblx0XHR0aGlzLmhvdE1vZHVsZXNNYXAuY2xlYXIoKTtcblx0XHR0aGlzLmRpc3Bvc2VNYXAuY2xlYXIoKTtcblx0XHR0aGlzLnBydW5lTWFwLmNsZWFyKCk7XG5cdFx0dGhpcy5kYXRhTWFwLmNsZWFyKCk7XG5cdFx0dGhpcy5jdXN0b21MaXN0ZW5lcnNNYXAuY2xlYXIoKTtcblx0XHR0aGlzLmN0eFRvTGlzdGVuZXJzTWFwLmNsZWFyKCk7XG5cdH1cblx0YXN5bmMgcHJ1bmVQYXRocyhwYXRocykge1xuXHRcdGF3YWl0IFByb21pc2UuYWxsKHBhdGhzLm1hcCgocGF0aCkgPT4ge1xuXHRcdFx0Y29uc3QgZGlzcG9zZXIgPSB0aGlzLmRpc3Bvc2VNYXAuZ2V0KHBhdGgpO1xuXHRcdFx0aWYgKGRpc3Bvc2VyKSByZXR1cm4gZGlzcG9zZXIodGhpcy5kYXRhTWFwLmdldChwYXRoKSk7XG5cdFx0fSkpO1xuXHRcdHBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcblx0XHRcdGNvbnN0IGZuID0gdGhpcy5wcnVuZU1hcC5nZXQocGF0aCk7XG5cdFx0XHRpZiAoZm4pIGZuKHRoaXMuZGF0YU1hcC5nZXQocGF0aCkpO1xuXHRcdH0pO1xuXHR9XG5cdHdhcm5GYWlsZWRVcGRhdGUoZXJyLCBwYXRoKSB7XG5cdFx0aWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHx8ICFlcnIubWVzc2FnZS5pbmNsdWRlcyhcImZldGNoXCIpKSB0aGlzLmxvZ2dlci5lcnJvcihlcnIpO1xuXHRcdHRoaXMubG9nZ2VyLmVycm9yKGBGYWlsZWQgdG8gcmVsb2FkICR7cGF0aH0uIFRoaXMgY291bGQgYmUgZHVlIHRvIHN5bnRheCBlcnJvcnMgb3IgaW1wb3J0aW5nIG5vbi1leGlzdGVudCBtb2R1bGVzLiAoc2VlIGVycm9ycyBhYm92ZSlgKTtcblx0fVxuXHQvKipcblx0KiBidWZmZXIgbXVsdGlwbGUgaG90IHVwZGF0ZXMgdHJpZ2dlcmVkIGJ5IHRoZSBzYW1lIHNyYyBjaGFuZ2Vcblx0KiBzbyB0aGF0IHRoZXkgYXJlIGludm9rZWQgaW4gdGhlIHNhbWUgb3JkZXIgdGhleSB3ZXJlIHNlbnQuXG5cdCogKG90aGVyd2lzZSB0aGUgb3JkZXIgbWF5IGJlIGluY29uc2lzdGVudCBiZWNhdXNlIG9mIHRoZSBodHRwIHJlcXVlc3Qgcm91bmQgdHJpcClcblx0Ki9cblx0YXN5bmMgcXVldWVVcGRhdGUocGF5bG9hZCkge1xuXHRcdHRoaXMudXBkYXRlUXVldWUucHVzaCh0aGlzLmZldGNoVXBkYXRlKHBheWxvYWQpKTtcblx0XHRpZiAoIXRoaXMucGVuZGluZ1VwZGF0ZVF1ZXVlKSB7XG5cdFx0XHR0aGlzLnBlbmRpbmdVcGRhdGVRdWV1ZSA9IHRydWU7XG5cdFx0XHRhd2FpdCBQcm9taXNlLnJlc29sdmUoKTtcblx0XHRcdHRoaXMucGVuZGluZ1VwZGF0ZVF1ZXVlID0gZmFsc2U7XG5cdFx0XHRjb25zdCBsb2FkaW5nID0gWy4uLnRoaXMudXBkYXRlUXVldWVdO1xuXHRcdFx0dGhpcy51cGRhdGVRdWV1ZSA9IFtdO1xuXHRcdFx0KGF3YWl0IFByb21pc2UuYWxsKGxvYWRpbmcpKS5mb3JFYWNoKChmbikgPT4gZm4gJiYgZm4oKSk7XG5cdFx0fVxuXHR9XG5cdGFzeW5jIGZldGNoVXBkYXRlKHVwZGF0ZSkge1xuXHRcdGNvbnN0IHsgcGF0aCwgYWNjZXB0ZWRQYXRoLCBmaXJzdEludmFsaWRhdGVkQnkgfSA9IHVwZGF0ZTtcblx0XHRjb25zdCBtb2QgPSB0aGlzLmhvdE1vZHVsZXNNYXAuZ2V0KHBhdGgpO1xuXHRcdGlmICghbW9kKSByZXR1cm47XG5cdFx0bGV0IGZldGNoZWRNb2R1bGU7XG5cdFx0Y29uc3QgaXNTZWxmVXBkYXRlID0gcGF0aCA9PT0gYWNjZXB0ZWRQYXRoO1xuXHRcdGNvbnN0IHF1YWxpZmllZENhbGxiYWNrcyA9IG1vZC5jYWxsYmFja3MuZmlsdGVyKCh7IGRlcHMgfSkgPT4gZGVwcy5pbmNsdWRlcyhhY2NlcHRlZFBhdGgpKTtcblx0XHRpZiAoaXNTZWxmVXBkYXRlIHx8IHF1YWxpZmllZENhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCBkaXNwb3NlciA9IHRoaXMuZGlzcG9zZU1hcC5nZXQoYWNjZXB0ZWRQYXRoKTtcblx0XHRcdGlmIChkaXNwb3NlcikgYXdhaXQgZGlzcG9zZXIodGhpcy5kYXRhTWFwLmdldChhY2NlcHRlZFBhdGgpKTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGZldGNoZWRNb2R1bGUgPSBhd2FpdCB0aGlzLmltcG9ydFVwZGF0ZWRNb2R1bGUodXBkYXRlKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhpcy53YXJuRmFpbGVkVXBkYXRlKGUsIGFjY2VwdGVkUGF0aCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRGaXJzdEludmFsaWRhdGVkQnkgPSBmaXJzdEludmFsaWRhdGVkQnk7XG5cdFx0XHRcdGZvciAoY29uc3QgeyBkZXBzLCBmbiB9IG9mIHF1YWxpZmllZENhbGxiYWNrcykgZm4oZGVwcy5tYXAoKGRlcCkgPT4gZGVwID09PSBhY2NlcHRlZFBhdGggPyBmZXRjaGVkTW9kdWxlIDogdm9pZCAwKSk7XG5cdFx0XHRcdGNvbnN0IGxvZ2dlZFBhdGggPSBpc1NlbGZVcGRhdGUgPyBwYXRoIDogYCR7YWNjZXB0ZWRQYXRofSB2aWEgJHtwYXRofWA7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBob3QgdXBkYXRlZDogJHtsb2dnZWRQYXRofWApO1xuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0dGhpcy5jdXJyZW50Rmlyc3RJbnZhbGlkYXRlZEJ5ID0gdm9pZCAwO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIC4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9uYW5vaWRANS4xLjUvbm9kZV9tb2R1bGVzL25hbm9pZC9ub24tc2VjdXJlL2luZGV4LmpzXG5sZXQgdXJsQWxwaGFiZXQgPSBcInVzZWFuZG9tLTI2VDE5ODM0MFBYNzVweEpBQ0tWRVJZTUlOREJVU0hXT0xGX0dRWmJmZ2hqa2xxdnd5enJpY3RcIjtcbmxldCBuYW5vaWQgPSAoc2l6ZSA9IDIxKSA9PiB7XG5cdGxldCBpZCA9IFwiXCI7XG5cdGxldCBpID0gc2l6ZSB8IDA7XG5cdHdoaWxlIChpLS0pIGlkICs9IHVybEFscGhhYmV0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdO1xuXHRyZXR1cm4gaWQ7XG59O1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvc2hhcmVkL2NvbnN0YW50cy50c1xubGV0IFNPVVJDRU1BUFBJTkdfVVJMID0gXCJzb3VyY2VNYVwiO1xuU09VUkNFTUFQUElOR19VUkwgKz0gXCJwcGluZ1VSTFwiO1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvc2hhcmVkL3V0aWxzLnRzXG5jb25zdCBpc1dpbmRvd3MgPSB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XG5jb25zdCBBc3luY0Z1bmN0aW9uID0gYXN5bmMgZnVuY3Rpb24oKSB7fS5jb25zdHJ1Y3RvcjtcbmZ1bmN0aW9uIHByb21pc2VXaXRoUmVzb2x2ZXJzKCkge1xuXHRsZXQgcmVzb2x2ZTtcblx0bGV0IHJlamVjdDtcblx0Y29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSwgX3JlamVjdCkgPT4ge1xuXHRcdHJlc29sdmUgPSBfcmVzb2x2ZTtcblx0XHRyZWplY3QgPSBfcmVqZWN0O1xuXHR9KTtcblx0cmV0dXJuIHtcblx0XHRwcm9taXNlLFxuXHRcdHJlc29sdmUsXG5cdFx0cmVqZWN0XG5cdH07XG59XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9zaGFyZWQvbW9kdWxlUnVubmVyVHJhbnNwb3J0LnRzXG5mdW5jdGlvbiByZXZpdmVJbnZva2VFcnJvcihlKSB7XG5cdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGUubWVzc2FnZSB8fCBcIlVua25vd24gaW52b2tlIGVycm9yXCIpO1xuXHRPYmplY3QuYXNzaWduKGVycm9yLCBlLCB7IHJ1bm5lckVycm9yOiAvKiBAX19QVVJFX18gKi8gbmV3IEVycm9yKFwiUnVubmVyRXJyb3JcIikgfSk7XG5cdHJldHVybiBlcnJvcjtcbn1cbmNvbnN0IGNyZWF0ZUludm9rZWFibGVUcmFuc3BvcnQgPSAodHJhbnNwb3J0JDEpID0+IHtcblx0aWYgKHRyYW5zcG9ydCQxLmludm9rZSkgcmV0dXJuIHtcblx0XHQuLi50cmFuc3BvcnQkMSxcblx0XHRhc3luYyBpbnZva2UobmFtZSwgZGF0YSkge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdHJhbnNwb3J0JDEuaW52b2tlKHtcblx0XHRcdFx0dHlwZTogXCJjdXN0b21cIixcblx0XHRcdFx0ZXZlbnQ6IFwidml0ZTppbnZva2VcIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBcInNlbmRcIixcblx0XHRcdFx0XHRuYW1lLFxuXHRcdFx0XHRcdGRhdGFcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRpZiAoXCJlcnJvclwiIGluIHJlc3VsdCkgdGhyb3cgcmV2aXZlSW52b2tlRXJyb3IocmVzdWx0LmVycm9yKTtcblx0XHRcdHJldHVybiByZXN1bHQucmVzdWx0O1xuXHRcdH1cblx0fTtcblx0aWYgKCF0cmFuc3BvcnQkMS5zZW5kIHx8ICF0cmFuc3BvcnQkMS5jb25uZWN0KSB0aHJvdyBuZXcgRXJyb3IoXCJ0cmFuc3BvcnQgbXVzdCBpbXBsZW1lbnQgc2VuZCBhbmQgY29ubmVjdCB3aGVuIGludm9rZSBpcyBub3QgaW1wbGVtZW50ZWRcIik7XG5cdGNvbnN0IHJwY1Byb21pc2VzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcblx0cmV0dXJuIHtcblx0XHQuLi50cmFuc3BvcnQkMSxcblx0XHRjb25uZWN0KHsgb25NZXNzYWdlLCBvbkRpc2Nvbm5lY3Rpb24gfSkge1xuXHRcdFx0cmV0dXJuIHRyYW5zcG9ydCQxLmNvbm5lY3Qoe1xuXHRcdFx0XHRvbk1lc3NhZ2UocGF5bG9hZCkge1xuXHRcdFx0XHRcdGlmIChwYXlsb2FkLnR5cGUgPT09IFwiY3VzdG9tXCIgJiYgcGF5bG9hZC5ldmVudCA9PT0gXCJ2aXRlOmludm9rZVwiKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBkYXRhID0gcGF5bG9hZC5kYXRhO1xuXHRcdFx0XHRcdFx0aWYgKGRhdGEuaWQuc3RhcnRzV2l0aChcInJlc3BvbnNlOlwiKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBpbnZva2VJZCA9IGRhdGEuaWQuc2xpY2UoOSk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHByb21pc2UgPSBycGNQcm9taXNlcy5nZXQoaW52b2tlSWQpO1xuXHRcdFx0XHRcdFx0XHRpZiAoIXByb21pc2UpIHJldHVybjtcblx0XHRcdFx0XHRcdFx0aWYgKHByb21pc2UudGltZW91dElkKSBjbGVhclRpbWVvdXQocHJvbWlzZS50aW1lb3V0SWQpO1xuXHRcdFx0XHRcdFx0XHRycGNQcm9taXNlcy5kZWxldGUoaW52b2tlSWQpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCB7IGVycm9yLCByZXN1bHQgfSA9IGRhdGEuZGF0YTtcblx0XHRcdFx0XHRcdFx0aWYgKGVycm9yKSBwcm9taXNlLnJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0XHRcdGVsc2UgcHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0b25NZXNzYWdlKHBheWxvYWQpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkRpc2Nvbm5lY3Rpb25cblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0ZGlzY29ubmVjdCgpIHtcblx0XHRcdHJwY1Byb21pc2VzLmZvckVhY2goKHByb21pc2UpID0+IHtcblx0XHRcdFx0cHJvbWlzZS5yZWplY3QoLyogQF9fUFVSRV9fICovIG5ldyBFcnJvcihgdHJhbnNwb3J0IHdhcyBkaXNjb25uZWN0ZWQsIGNhbm5vdCBjYWxsICR7SlNPTi5zdHJpbmdpZnkocHJvbWlzZS5uYW1lKX1gKSk7XG5cdFx0XHR9KTtcblx0XHRcdHJwY1Byb21pc2VzLmNsZWFyKCk7XG5cdFx0XHRyZXR1cm4gdHJhbnNwb3J0JDEuZGlzY29ubmVjdD8uKCk7XG5cdFx0fSxcblx0XHRzZW5kKGRhdGEpIHtcblx0XHRcdHJldHVybiB0cmFuc3BvcnQkMS5zZW5kKGRhdGEpO1xuXHRcdH0sXG5cdFx0YXN5bmMgaW52b2tlKG5hbWUsIGRhdGEpIHtcblx0XHRcdGNvbnN0IHByb21pc2VJZCA9IG5hbm9pZCgpO1xuXHRcdFx0Y29uc3Qgd3JhcHBlZERhdGEgPSB7XG5cdFx0XHRcdHR5cGU6IFwiY3VzdG9tXCIsXG5cdFx0XHRcdGV2ZW50OiBcInZpdGU6aW52b2tlXCIsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRuYW1lLFxuXHRcdFx0XHRcdGlkOiBgc2VuZDoke3Byb21pc2VJZH1gLFxuXHRcdFx0XHRcdGRhdGFcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGNvbnN0IHNlbmRQcm9taXNlID0gdHJhbnNwb3J0JDEuc2VuZCh3cmFwcGVkRGF0YSk7XG5cdFx0XHRjb25zdCB7IHByb21pc2UsIHJlc29sdmUsIHJlamVjdCB9ID0gcHJvbWlzZVdpdGhSZXNvbHZlcnMoKTtcblx0XHRcdGNvbnN0IHRpbWVvdXQgPSB0cmFuc3BvcnQkMS50aW1lb3V0ID8/IDZlNDtcblx0XHRcdGxldCB0aW1lb3V0SWQ7XG5cdFx0XHRpZiAodGltZW91dCA+IDApIHtcblx0XHRcdFx0dGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0cnBjUHJvbWlzZXMuZGVsZXRlKHByb21pc2VJZCk7XG5cdFx0XHRcdFx0cmVqZWN0KC8qIEBfX1BVUkVfXyAqLyBuZXcgRXJyb3IoYHRyYW5zcG9ydCBpbnZva2UgdGltZWQgb3V0IGFmdGVyICR7dGltZW91dH1tcyAoZGF0YTogJHtKU09OLnN0cmluZ2lmeSh3cmFwcGVkRGF0YSl9KWApKTtcblx0XHRcdFx0fSwgdGltZW91dCk7XG5cdFx0XHRcdHRpbWVvdXRJZD8udW5yZWY/LigpO1xuXHRcdFx0fVxuXHRcdFx0cnBjUHJvbWlzZXMuc2V0KHByb21pc2VJZCwge1xuXHRcdFx0XHRyZXNvbHZlLFxuXHRcdFx0XHRyZWplY3QsXG5cdFx0XHRcdG5hbWUsXG5cdFx0XHRcdHRpbWVvdXRJZFxuXHRcdFx0fSk7XG5cdFx0XHRpZiAoc2VuZFByb21pc2UpIHNlbmRQcm9taXNlLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG5cdFx0XHRcdHJwY1Byb21pc2VzLmRlbGV0ZShwcm9taXNlSWQpO1xuXHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdH0pO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHByb21pc2U7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dGhyb3cgcmV2aXZlSW52b2tlRXJyb3IoZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59O1xuY29uc3Qgbm9ybWFsaXplTW9kdWxlUnVubmVyVHJhbnNwb3J0ID0gKHRyYW5zcG9ydCQxKSA9PiB7XG5cdGNvbnN0IGludm9rZWFibGVUcmFuc3BvcnQgPSBjcmVhdGVJbnZva2VhYmxlVHJhbnNwb3J0KHRyYW5zcG9ydCQxKTtcblx0bGV0IGlzQ29ubmVjdGVkID0gIWludm9rZWFibGVUcmFuc3BvcnQuY29ubmVjdDtcblx0bGV0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRyZXR1cm4ge1xuXHRcdC4uLnRyYW5zcG9ydCQxLFxuXHRcdC4uLmludm9rZWFibGVUcmFuc3BvcnQuY29ubmVjdCA/IHsgYXN5bmMgY29ubmVjdChvbk1lc3NhZ2UpIHtcblx0XHRcdGlmIChpc0Nvbm5lY3RlZCkgcmV0dXJuO1xuXHRcdFx0aWYgKGNvbm5lY3RpbmdQcm9taXNlKSB7XG5cdFx0XHRcdGF3YWl0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBtYXliZVByb21pc2UgPSBpbnZva2VhYmxlVHJhbnNwb3J0LmNvbm5lY3Qoe1xuXHRcdFx0XHRvbk1lc3NhZ2U6IG9uTWVzc2FnZSA/PyAoKCkgPT4ge30pLFxuXHRcdFx0XHRvbkRpc2Nvbm5lY3Rpb24oKSB7XG5cdFx0XHRcdFx0aXNDb25uZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRpZiAobWF5YmVQcm9taXNlKSB7XG5cdFx0XHRcdGNvbm5lY3RpbmdQcm9taXNlID0gbWF5YmVQcm9taXNlO1xuXHRcdFx0XHRhd2FpdCBjb25uZWN0aW5nUHJvbWlzZTtcblx0XHRcdFx0Y29ubmVjdGluZ1Byb21pc2UgPSB2b2lkIDA7XG5cdFx0XHR9XG5cdFx0XHRpc0Nvbm5lY3RlZCA9IHRydWU7XG5cdFx0fSB9IDoge30sXG5cdFx0Li4uaW52b2tlYWJsZVRyYW5zcG9ydC5kaXNjb25uZWN0ID8geyBhc3luYyBkaXNjb25uZWN0KCkge1xuXHRcdFx0aWYgKCFpc0Nvbm5lY3RlZCkgcmV0dXJuO1xuXHRcdFx0aWYgKGNvbm5lY3RpbmdQcm9taXNlKSBhd2FpdCBjb25uZWN0aW5nUHJvbWlzZTtcblx0XHRcdGlzQ29ubmVjdGVkID0gZmFsc2U7XG5cdFx0XHRhd2FpdCBpbnZva2VhYmxlVHJhbnNwb3J0LmRpc2Nvbm5lY3QoKTtcblx0XHR9IH0gOiB7fSxcblx0XHRhc3luYyBzZW5kKGRhdGEpIHtcblx0XHRcdGlmICghaW52b2tlYWJsZVRyYW5zcG9ydC5zZW5kKSByZXR1cm47XG5cdFx0XHRpZiAoIWlzQ29ubmVjdGVkKSBpZiAoY29ubmVjdGluZ1Byb21pc2UpIGF3YWl0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRcdFx0ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJzZW5kIHdhcyBjYWxsZWQgYmVmb3JlIGNvbm5lY3RcIik7XG5cdFx0XHRhd2FpdCBpbnZva2VhYmxlVHJhbnNwb3J0LnNlbmQoZGF0YSk7XG5cdFx0fSxcblx0XHRhc3luYyBpbnZva2UobmFtZSwgZGF0YSkge1xuXHRcdFx0aWYgKCFpc0Nvbm5lY3RlZCkgaWYgKGNvbm5lY3RpbmdQcm9taXNlKSBhd2FpdCBjb25uZWN0aW5nUHJvbWlzZTtcblx0XHRcdGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiaW52b2tlIHdhcyBjYWxsZWQgYmVmb3JlIGNvbm5lY3RcIik7XG5cdFx0XHRyZXR1cm4gaW52b2tlYWJsZVRyYW5zcG9ydC5pbnZva2UobmFtZSwgZGF0YSk7XG5cdFx0fVxuXHR9O1xufTtcbmNvbnN0IGNyZWF0ZVdlYlNvY2tldE1vZHVsZVJ1bm5lclRyYW5zcG9ydCA9IChvcHRpb25zKSA9PiB7XG5cdGNvbnN0IHBpbmdJbnRlcnZhbCA9IG9wdGlvbnMucGluZ0ludGVydmFsID8/IDNlNDtcblx0bGV0IHdzO1xuXHRsZXQgcGluZ0ludGVydmFsSWQ7XG5cdHJldHVybiB7XG5cdFx0YXN5bmMgY29ubmVjdCh7IG9uTWVzc2FnZSwgb25EaXNjb25uZWN0aW9uIH0pIHtcblx0XHRcdGNvbnN0IHNvY2tldCA9IG9wdGlvbnMuY3JlYXRlQ29ubmVjdGlvbigpO1xuXHRcdFx0c29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGFzeW5jICh7IGRhdGEgfSkgPT4ge1xuXHRcdFx0XHRvbk1lc3NhZ2UoSlNPTi5wYXJzZShkYXRhKSk7XG5cdFx0XHR9KTtcblx0XHRcdGxldCBpc09wZW5lZCA9IHNvY2tldC5yZWFkeVN0YXRlID09PSBzb2NrZXQuT1BFTjtcblx0XHRcdGlmICghaXNPcGVuZWQpIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0c29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsICgpID0+IHtcblx0XHRcdFx0XHRpc09wZW5lZCA9IHRydWU7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9LCB7IG9uY2U6IHRydWUgfSk7XG5cdFx0XHRcdHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGlmICghaXNPcGVuZWQpIHtcblx0XHRcdFx0XHRcdHJlamVjdCgvKiBAX19QVVJFX18gKi8gbmV3IEVycm9yKFwiV2ViU29ja2V0IGNsb3NlZCB3aXRob3V0IG9wZW5lZC5cIikpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRvbk1lc3NhZ2Uoe1xuXHRcdFx0XHRcdFx0dHlwZTogXCJjdXN0b21cIixcblx0XHRcdFx0XHRcdGV2ZW50OiBcInZpdGU6d3M6ZGlzY29ubmVjdFwiLFxuXHRcdFx0XHRcdFx0ZGF0YTogeyB3ZWJTb2NrZXQ6IHNvY2tldCB9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0b25EaXNjb25uZWN0aW9uKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRvbk1lc3NhZ2Uoe1xuXHRcdFx0XHR0eXBlOiBcImN1c3RvbVwiLFxuXHRcdFx0XHRldmVudDogXCJ2aXRlOndzOmNvbm5lY3RcIixcblx0XHRcdFx0ZGF0YTogeyB3ZWJTb2NrZXQ6IHNvY2tldCB9XG5cdFx0XHR9KTtcblx0XHRcdHdzID0gc29ja2V0O1xuXHRcdFx0cGluZ0ludGVydmFsSWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRcdGlmIChzb2NrZXQucmVhZHlTdGF0ZSA9PT0gc29ja2V0Lk9QRU4pIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJwaW5nXCIgfSkpO1xuXHRcdFx0fSwgcGluZ0ludGVydmFsKTtcblx0XHR9LFxuXHRcdGRpc2Nvbm5lY3QoKSB7XG5cdFx0XHRjbGVhckludGVydmFsKHBpbmdJbnRlcnZhbElkKTtcblx0XHRcdHdzPy5jbG9zZSgpO1xuXHRcdH0sXG5cdFx0c2VuZChkYXRhKSB7XG5cdFx0XHR3cy5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblx0XHR9XG5cdH07XG59O1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvc2hhcmVkL2htckhhbmRsZXIudHNcbmZ1bmN0aW9uIGNyZWF0ZUhNUkhhbmRsZXIoaGFuZGxlcikge1xuXHRjb25zdCBxdWV1ZSA9IG5ldyBRdWV1ZSgpO1xuXHRyZXR1cm4gKHBheWxvYWQpID0+IHF1ZXVlLmVucXVldWUoKCkgPT4gaGFuZGxlcihwYXlsb2FkKSk7XG59XG52YXIgUXVldWUgPSBjbGFzcyB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInF1ZXVlXCIsIFtdKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJwZW5kaW5nXCIsIGZhbHNlKTtcblx0fVxuXHRlbnF1ZXVlKHByb21pc2UpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dGhpcy5xdWV1ZS5wdXNoKHtcblx0XHRcdFx0cHJvbWlzZSxcblx0XHRcdFx0cmVzb2x2ZSxcblx0XHRcdFx0cmVqZWN0XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuZGVxdWV1ZSgpO1xuXHRcdH0pO1xuXHR9XG5cdGRlcXVldWUoKSB7XG5cdFx0aWYgKHRoaXMucGVuZGluZykgcmV0dXJuIGZhbHNlO1xuXHRcdGNvbnN0IGl0ZW0gPSB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cdFx0aWYgKCFpdGVtKSByZXR1cm4gZmFsc2U7XG5cdFx0dGhpcy5wZW5kaW5nID0gdHJ1ZTtcblx0XHRpdGVtLnByb21pc2UoKS50aGVuKGl0ZW0ucmVzb2x2ZSkuY2F0Y2goaXRlbS5yZWplY3QpLmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0dGhpcy5wZW5kaW5nID0gZmFsc2U7XG5cdFx0XHR0aGlzLmRlcXVldWUoKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufTtcblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gc3JjL2NsaWVudC9vdmVybGF5LnRzXG5jb25zdCBobXJDb25maWdOYW1lID0gXCJ2aXRlLmNvbmZpZy5qc1wiO1xuY29uc3QgYmFzZSQxID0gXCIvXCIgfHwgXCIvXCI7XG5mdW5jdGlvbiBoKGUsIGF0dHJzID0ge30sIC4uLmNoaWxkcmVuKSB7XG5cdGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGUpO1xuXHRmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhhdHRycykpIGVsZW0uc2V0QXR0cmlidXRlKGssIHYpO1xuXHRlbGVtLmFwcGVuZCguLi5jaGlsZHJlbik7XG5cdHJldHVybiBlbGVtO1xufVxuY29uc3QgdGVtcGxhdGVTdHlsZSA9IGBcbjpob3N0IHtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHotaW5kZXg6IDk5OTk5O1xuICAtLW1vbm9zcGFjZTogJ1NGTW9uby1SZWd1bGFyJywgQ29uc29sYXMsXG4gICdMaWJlcmF0aW9uIE1vbm8nLCBNZW5sbywgQ291cmllciwgbW9ub3NwYWNlO1xuICAtLXJlZDogI2ZmNTU1NTtcbiAgLS15ZWxsb3c6ICNlMmFhNTM7XG4gIC0tcHVycGxlOiAjY2ZhNGZmO1xuICAtLWN5YW46ICMyZGQ5ZGE7XG4gIC0tZGltOiAjYzljOWM5O1xuXG4gIC0td2luZG93LWJhY2tncm91bmQ6ICMxODE4MTg7XG4gIC0td2luZG93LWNvbG9yOiAjZDhkOGQ4O1xufVxuXG4uYmFja2Ryb3Age1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHotaW5kZXg6IDk5OTk5O1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIG92ZXJmbG93LXk6IHNjcm9sbDtcbiAgbWFyZ2luOiAwO1xuICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuNjYpO1xufVxuXG4ud2luZG93IHtcbiAgZm9udC1mYW1pbHk6IHZhcigtLW1vbm9zcGFjZSk7XG4gIGxpbmUtaGVpZ2h0OiAxLjU7XG4gIG1heC13aWR0aDogODB2dztcbiAgY29sb3I6IHZhcigtLXdpbmRvdy1jb2xvcik7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIG1hcmdpbjogMzBweCBhdXRvO1xuICBwYWRkaW5nOiAyLjV2aCA0dnc7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgYmFja2dyb3VuZDogdmFyKC0td2luZG93LWJhY2tncm91bmQpO1xuICBib3JkZXItcmFkaXVzOiA2cHggNnB4IDhweCA4cHg7XG4gIGJveC1zaGFkb3c6IDAgMTlweCAzOHB4IHJnYmEoMCwwLDAsMC4zMCksIDAgMTVweCAxMnB4IHJnYmEoMCwwLDAsMC4yMik7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGJvcmRlci10b3A6IDhweCBzb2xpZCB2YXIoLS1yZWQpO1xuICBkaXJlY3Rpb246IGx0cjtcbiAgdGV4dC1hbGlnbjogbGVmdDtcbn1cblxucHJlIHtcbiAgZm9udC1mYW1pbHk6IHZhcigtLW1vbm9zcGFjZSk7XG4gIGZvbnQtc2l6ZTogMTZweDtcbiAgbWFyZ2luLXRvcDogMDtcbiAgbWFyZ2luLWJvdHRvbTogMWVtO1xuICBvdmVyZmxvdy14OiBzY3JvbGw7XG4gIHNjcm9sbGJhci13aWR0aDogbm9uZTtcbn1cblxucHJlOjotd2Via2l0LXNjcm9sbGJhciB7XG4gIGRpc3BsYXk6IG5vbmU7XG59XG5cbnByZS5mcmFtZTo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICBkaXNwbGF5OiBibG9jaztcbiAgaGVpZ2h0OiA1cHg7XG59XG5cbnByZS5mcmFtZTo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBiYWNrZ3JvdW5kOiAjOTk5O1xuICBib3JkZXItcmFkaXVzOiA1cHg7XG59XG5cbnByZS5mcmFtZSB7XG4gIHNjcm9sbGJhci13aWR0aDogdGhpbjtcbn1cblxuLm1lc3NhZ2Uge1xuICBsaW5lLWhlaWdodDogMS4zO1xuICBmb250LXdlaWdodDogNjAwO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG59XG5cbi5tZXNzYWdlLWJvZHkge1xuICBjb2xvcjogdmFyKC0tcmVkKTtcbn1cblxuLnBsdWdpbiB7XG4gIGNvbG9yOiB2YXIoLS1wdXJwbGUpO1xufVxuXG4uZmlsZSB7XG4gIGNvbG9yOiB2YXIoLS1jeWFuKTtcbiAgbWFyZ2luLWJvdHRvbTogMDtcbiAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB3b3JkLWJyZWFrOiBicmVhay1hbGw7XG59XG5cbi5mcmFtZSB7XG4gIGNvbG9yOiB2YXIoLS15ZWxsb3cpO1xufVxuXG4uc3RhY2sge1xuICBmb250LXNpemU6IDEzcHg7XG4gIGNvbG9yOiB2YXIoLS1kaW0pO1xufVxuXG4udGlwIHtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBjb2xvcjogIzk5OTtcbiAgYm9yZGVyLXRvcDogMXB4IGRvdHRlZCAjOTk5O1xuICBwYWRkaW5nLXRvcDogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDEuODtcbn1cblxuY29kZSB7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC1mYW1pbHk6IHZhcigtLW1vbm9zcGFjZSk7XG4gIGNvbG9yOiB2YXIoLS15ZWxsb3cpO1xufVxuXG4uZmlsZS1saW5rIHtcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cblxua2JkIHtcbiAgbGluZS1oZWlnaHQ6IDEuNTtcbiAgZm9udC1mYW1pbHk6IHVpLW1vbm9zcGFjZSwgTWVubG8sIE1vbmFjbywgQ29uc29sYXMsIFwiTGliZXJhdGlvbiBNb25vXCIsIFwiQ291cmllciBOZXdcIiwgbW9ub3NwYWNlO1xuICBmb250LXNpemU6IDAuNzVyZW07XG4gIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYigzOCwgNDAsIDQ0KTtcbiAgY29sb3I6IHJnYigxNjYsIDE2NywgMTcxKTtcbiAgcGFkZGluZzogMC4xNXJlbSAwLjNyZW07XG4gIGJvcmRlci1yYWRpdXM6IDAuMjVyZW07XG4gIGJvcmRlci13aWR0aDogMC4wNjI1cmVtIDAuMDYyNXJlbSAwLjE4NzVyZW07XG4gIGJvcmRlci1zdHlsZTogc29saWQ7XG4gIGJvcmRlci1jb2xvcjogcmdiKDU0LCA1NywgNjQpO1xuICBib3JkZXItaW1hZ2U6IGluaXRpYWw7XG59XG5gO1xuY29uc3QgY3JlYXRlVGVtcGxhdGUgPSAoKSA9PiBoKFwiZGl2XCIsIHtcblx0Y2xhc3M6IFwiYmFja2Ryb3BcIixcblx0cGFydDogXCJiYWNrZHJvcFwiXG59LCBoKFwiZGl2XCIsIHtcblx0Y2xhc3M6IFwid2luZG93XCIsXG5cdHBhcnQ6IFwid2luZG93XCJcbn0sIGgoXCJwcmVcIiwge1xuXHRjbGFzczogXCJtZXNzYWdlXCIsXG5cdHBhcnQ6IFwibWVzc2FnZVwiXG59LCBoKFwic3BhblwiLCB7XG5cdGNsYXNzOiBcInBsdWdpblwiLFxuXHRwYXJ0OiBcInBsdWdpblwiXG59KSwgaChcInNwYW5cIiwge1xuXHRjbGFzczogXCJtZXNzYWdlLWJvZHlcIixcblx0cGFydDogXCJtZXNzYWdlLWJvZHlcIlxufSkpLCBoKFwicHJlXCIsIHtcblx0Y2xhc3M6IFwiZmlsZVwiLFxuXHRwYXJ0OiBcImZpbGVcIlxufSksIGgoXCJwcmVcIiwge1xuXHRjbGFzczogXCJmcmFtZVwiLFxuXHRwYXJ0OiBcImZyYW1lXCJcbn0pLCBoKFwicHJlXCIsIHtcblx0Y2xhc3M6IFwic3RhY2tcIixcblx0cGFydDogXCJzdGFja1wiXG59KSwgaChcImRpdlwiLCB7XG5cdGNsYXNzOiBcInRpcFwiLFxuXHRwYXJ0OiBcInRpcFwiXG59LCBcIkNsaWNrIG91dHNpZGUsIHByZXNzIFwiLCBoKFwia2JkXCIsIHt9LCBcIkVzY1wiKSwgXCIga2V5LCBvciBmaXggdGhlIGNvZGUgdG8gZGlzbWlzcy5cIiwgaChcImJyXCIpLCBcIllvdSBjYW4gYWxzbyBkaXNhYmxlIHRoaXMgb3ZlcmxheSBieSBzZXR0aW5nIFwiLCBoKFwiY29kZVwiLCB7IHBhcnQ6IFwiY29uZmlnLW9wdGlvbi1uYW1lXCIgfSwgXCJzZXJ2ZXIuaG1yLm92ZXJsYXlcIiksIFwiIHRvIFwiLCBoKFwiY29kZVwiLCB7IHBhcnQ6IFwiY29uZmlnLW9wdGlvbi12YWx1ZVwiIH0sIFwiZmFsc2VcIiksIFwiIGluIFwiLCBoKFwiY29kZVwiLCB7IHBhcnQ6IFwiY29uZmlnLWZpbGUtbmFtZVwiIH0sIGhtckNvbmZpZ05hbWUpLCBcIi5cIikpLCBoKFwic3R5bGVcIiwge30sIHRlbXBsYXRlU3R5bGUpKTtcbmNvbnN0IGZpbGVSRSA9IC8oPzpmaWxlOlxcL1xcLyk/KD86W2EtekEtWl06XFxcXHxcXC8pLio/OlxcZCs6XFxkKy9nO1xuY29uc3QgY29kZWZyYW1lUkUgPSAvXig/Oj4/XFxzKlxcZCtcXHMrXFx8Lip8XFxzK1xcfFxccypcXF4uKilcXHI/XFxuL2dtO1xuY29uc3QgeyBIVE1MRWxlbWVudCA9IGNsYXNzIHt9IH0gPSBnbG9iYWxUaGlzO1xudmFyIEVycm9yT3ZlcmxheSA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXHRjb25zdHJ1Y3RvcihlcnIsIGxpbmtzID0gdHJ1ZSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwicm9vdFwiLCB2b2lkIDApO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImNsb3NlT25Fc2NcIiwgdm9pZCAwKTtcblx0XHR0aGlzLnJvb3QgPSB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuXHRcdHRoaXMucm9vdC5hcHBlbmRDaGlsZChjcmVhdGVUZW1wbGF0ZSgpKTtcblx0XHRjb2RlZnJhbWVSRS5sYXN0SW5kZXggPSAwO1xuXHRcdGNvbnN0IGhhc0ZyYW1lID0gZXJyLmZyYW1lICYmIGNvZGVmcmFtZVJFLnRlc3QoZXJyLmZyYW1lKTtcblx0XHRjb25zdCBtZXNzYWdlID0gaGFzRnJhbWUgPyBlcnIubWVzc2FnZS5yZXBsYWNlKGNvZGVmcmFtZVJFLCBcIlwiKSA6IGVyci5tZXNzYWdlO1xuXHRcdGlmIChlcnIucGx1Z2luKSB0aGlzLnRleHQoXCIucGx1Z2luXCIsIGBbcGx1Z2luOiR7ZXJyLnBsdWdpbn1dIGApO1xuXHRcdHRoaXMudGV4dChcIi5tZXNzYWdlLWJvZHlcIiwgbWVzc2FnZS50cmltKCkpO1xuXHRcdGNvbnN0IFtmaWxlXSA9IChlcnIubG9jPy5maWxlIHx8IGVyci5pZCB8fCBcInVua25vd24gZmlsZVwiKS5zcGxpdChgP2ApO1xuXHRcdGlmIChlcnIubG9jKSB0aGlzLnRleHQoXCIuZmlsZVwiLCBgJHtmaWxlfToke2Vyci5sb2MubGluZX06JHtlcnIubG9jLmNvbHVtbn1gLCBsaW5rcyk7XG5cdFx0ZWxzZSBpZiAoZXJyLmlkKSB0aGlzLnRleHQoXCIuZmlsZVwiLCBmaWxlKTtcblx0XHRpZiAoaGFzRnJhbWUpIHRoaXMudGV4dChcIi5mcmFtZVwiLCBlcnIuZnJhbWUudHJpbSgpKTtcblx0XHR0aGlzLnRleHQoXCIuc3RhY2tcIiwgZXJyLnN0YWNrLCBsaW5rcyk7XG5cdFx0dGhpcy5yb290LnF1ZXJ5U2VsZWN0b3IoXCIud2luZG93XCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0fSk7XG5cdFx0dGhpcy5jbG9zZU9uRXNjID0gKGUpID0+IHtcblx0XHRcdGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIiB8fCBlLmNvZGUgPT09IFwiRXNjYXBlXCIpIHRoaXMuY2xvc2UoKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuY2xvc2VPbkVzYyk7XG5cdH1cblx0dGV4dChzZWxlY3RvciwgdGV4dCwgbGlua0ZpbGVzID0gZmFsc2UpIHtcblx0XHRjb25zdCBlbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblx0XHRpZiAoIWxpbmtGaWxlcykgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuXHRcdGVsc2Uge1xuXHRcdFx0bGV0IGN1ckluZGV4ID0gMDtcblx0XHRcdGxldCBtYXRjaDtcblx0XHRcdGZpbGVSRS5sYXN0SW5kZXggPSAwO1xuXHRcdFx0d2hpbGUgKG1hdGNoID0gZmlsZVJFLmV4ZWModGV4dCkpIHtcblx0XHRcdFx0Y29uc3QgeyAwOiBmaWxlLCBpbmRleCB9ID0gbWF0Y2g7XG5cdFx0XHRcdGNvbnN0IGZyYWcgPSB0ZXh0LnNsaWNlKGN1ckluZGV4LCBpbmRleCk7XG5cdFx0XHRcdGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGZyYWcpKTtcblx0XHRcdFx0Y29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHRcdFx0XHRsaW5rLnRleHRDb250ZW50ID0gZmlsZTtcblx0XHRcdFx0bGluay5jbGFzc05hbWUgPSBcImZpbGUtbGlua1wiO1xuXHRcdFx0XHRsaW5rLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdFx0ZmV0Y2gobmV3IFVSTChgJHtiYXNlJDF9X19vcGVuLWluLWVkaXRvcj9maWxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUpfWAsIGltcG9ydC5tZXRhLnVybCkpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRlbC5hcHBlbmRDaGlsZChsaW5rKTtcblx0XHRcdFx0Y3VySW5kZXggKz0gZnJhZy5sZW5ndGggKyBmaWxlLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdGlmIChjdXJJbmRleCA8IHRleHQubGVuZ3RoKSBlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnNsaWNlKGN1ckluZGV4KSkpO1xuXHRcdH1cblx0fVxuXHRjbG9zZSgpIHtcblx0XHR0aGlzLnBhcmVudE5vZGU/LnJlbW92ZUNoaWxkKHRoaXMpO1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuY2xvc2VPbkVzYyk7XG5cdH1cbn07XG5jb25zdCBvdmVybGF5SWQgPSBcInZpdGUtZXJyb3Itb3ZlcmxheVwiO1xuY29uc3QgeyBjdXN0b21FbGVtZW50cyB9ID0gZ2xvYmFsVGhpcztcbmlmIChjdXN0b21FbGVtZW50cyAmJiAhY3VzdG9tRWxlbWVudHMuZ2V0KG92ZXJsYXlJZCkpIGN1c3RvbUVsZW1lbnRzLmRlZmluZShvdmVybGF5SWQsIEVycm9yT3ZlcmxheSk7XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9jbGllbnQvY2xpZW50LnRzXG5jb25zb2xlLmRlYnVnKFwiW3ZpdGVdIGNvbm5lY3RpbmcuLi5cIik7XG5jb25zdCBpbXBvcnRNZXRhVXJsID0gbmV3IFVSTChpbXBvcnQubWV0YS51cmwpO1xuY29uc3Qgc2VydmVySG9zdCA9IFwibG9jYWxob3N0OjUxNzMvXCI7XG5jb25zdCBzb2NrZXRQcm90b2NvbCA9IG51bGwgfHwgKGltcG9ydE1ldGFVcmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgPyBcIndzc1wiIDogXCJ3c1wiKTtcbmNvbnN0IGhtclBvcnQgPSBudWxsO1xuY29uc3Qgc29ja2V0SG9zdCA9IGAke251bGwgfHwgaW1wb3J0TWV0YVVybC5ob3N0bmFtZX06JHtobXJQb3J0IHx8IGltcG9ydE1ldGFVcmwucG9ydH0ke1wiL1wifWA7XG5jb25zdCBkaXJlY3RTb2NrZXRIb3N0ID0gXCJsb2NhbGhvc3Q6NTE3My9cIjtcbmNvbnN0IGJhc2UgPSBcIi9cIiB8fCBcIi9cIjtcbmNvbnN0IGhtclRpbWVvdXQgPSAzMDAwMDtcbmNvbnN0IHdzVG9rZW4gPSBcIkt5UjBPR1ZoN293Y1wiO1xuY29uc3QgdHJhbnNwb3J0ID0gbm9ybWFsaXplTW9kdWxlUnVubmVyVHJhbnNwb3J0KCgoKSA9PiB7XG5cdGxldCB3c1RyYW5zcG9ydCA9IGNyZWF0ZVdlYlNvY2tldE1vZHVsZVJ1bm5lclRyYW5zcG9ydCh7XG5cdFx0Y3JlYXRlQ29ubmVjdGlvbjogKCkgPT4gbmV3IFdlYlNvY2tldChgJHtzb2NrZXRQcm90b2NvbH06Ly8ke3NvY2tldEhvc3R9P3Rva2VuPSR7d3NUb2tlbn1gLCBcInZpdGUtaG1yXCIpLFxuXHRcdHBpbmdJbnRlcnZhbDogaG1yVGltZW91dFxuXHR9KTtcblx0cmV0dXJuIHtcblx0XHRhc3luYyBjb25uZWN0KGhhbmRsZXJzKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCB3c1RyYW5zcG9ydC5jb25uZWN0KGhhbmRsZXJzKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCFobXJQb3J0KSB7XG5cdFx0XHRcdFx0d3NUcmFuc3BvcnQgPSBjcmVhdGVXZWJTb2NrZXRNb2R1bGVSdW5uZXJUcmFuc3BvcnQoe1xuXHRcdFx0XHRcdFx0Y3JlYXRlQ29ubmVjdGlvbjogKCkgPT4gbmV3IFdlYlNvY2tldChgJHtzb2NrZXRQcm90b2NvbH06Ly8ke2RpcmVjdFNvY2tldEhvc3R9P3Rva2VuPSR7d3NUb2tlbn1gLCBcInZpdGUtaG1yXCIpLFxuXHRcdFx0XHRcdFx0cGluZ0ludGVydmFsOiBobXJUaW1lb3V0XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGF3YWl0IHdzVHJhbnNwb3J0LmNvbm5lY3QoaGFuZGxlcnMpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKFwiW3ZpdGVdIERpcmVjdCB3ZWJzb2NrZXQgY29ubmVjdGlvbiBmYWxsYmFjay4gQ2hlY2sgb3V0IGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL3NlcnZlci1vcHRpb25zLmh0bWwjc2VydmVyLWhtciB0byByZW1vdmUgdGhlIHByZXZpb3VzIGNvbm5lY3Rpb24gZXJyb3IuXCIpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUkMSkge1xuXHRcdFx0XHRcdFx0aWYgKGUkMSBpbnN0YW5jZW9mIEVycm9yICYmIGUkMS5tZXNzYWdlLmluY2x1ZGVzKFwiV2ViU29ja2V0IGNsb3NlZCB3aXRob3V0IG9wZW5lZC5cIikpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY3VycmVudFNjcmlwdEhvc3RVUkwgPSBuZXcgVVJMKGltcG9ydC5tZXRhLnVybCk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGN1cnJlbnRTY3JpcHRIb3N0ID0gY3VycmVudFNjcmlwdEhvc3RVUkwuaG9zdCArIGN1cnJlbnRTY3JpcHRIb3N0VVJMLnBhdGhuYW1lLnJlcGxhY2UoL0B2aXRlXFwvY2xpZW50JC8sIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBbdml0ZV0gZmFpbGVkIHRvIGNvbm5lY3QgdG8gd2Vic29ja2V0LlxueW91ciBjdXJyZW50IHNldHVwOlxuICAoYnJvd3NlcikgJHtjdXJyZW50U2NyaXB0SG9zdH0gPC0tW0hUVFBdLS0+ICR7c2VydmVySG9zdH0gKHNlcnZlcilcXG4gIChicm93c2VyKSAke3NvY2tldEhvc3R9IDwtLVtXZWJTb2NrZXQgKGZhaWxpbmcpXS0tPiAke2RpcmVjdFNvY2tldEhvc3R9IChzZXJ2ZXIpXFxuQ2hlY2sgb3V0IHlvdXIgVml0ZSAvIG5ldHdvcmsgY29uZmlndXJhdGlvbiBhbmQgaHR0cHM6Ly92aXRlLmRldi9jb25maWcvc2VydmVyLW9wdGlvbnMuaHRtbCNzZXJ2ZXItaG1yIC5gKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFt2aXRlXSBmYWlsZWQgdG8gY29ubmVjdCB0byB3ZWJzb2NrZXQgKCR7ZX0pLiBgKTtcblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGFzeW5jIGRpc2Nvbm5lY3QoKSB7XG5cdFx0XHRhd2FpdCB3c1RyYW5zcG9ydC5kaXNjb25uZWN0KCk7XG5cdFx0fSxcblx0XHRzZW5kKGRhdGEpIHtcblx0XHRcdHdzVHJhbnNwb3J0LnNlbmQoZGF0YSk7XG5cdFx0fVxuXHR9O1xufSkoKSk7XG5sZXQgd2lsbFVubG9hZCA9IGZhbHNlO1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyPy4oXCJiZWZvcmV1bmxvYWRcIiwgKCkgPT4ge1xuXHR3aWxsVW5sb2FkID0gdHJ1ZTtcbn0pO1xuZnVuY3Rpb24gY2xlYW5VcmwocGF0aG5hbWUpIHtcblx0Y29uc3QgdXJsID0gbmV3IFVSTChwYXRobmFtZSwgXCJodHRwOi8vdml0ZS5kZXZcIik7XG5cdHVybC5zZWFyY2hQYXJhbXMuZGVsZXRlKFwiZGlyZWN0XCIpO1xuXHRyZXR1cm4gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaDtcbn1cbmxldCBpc0ZpcnN0VXBkYXRlID0gdHJ1ZTtcbmNvbnN0IG91dGRhdGVkTGlua1RhZ3MgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtTZXQoKTtcbmNvbnN0IGRlYm91bmNlUmVsb2FkID0gKHRpbWUpID0+IHtcblx0bGV0IHRpbWVyO1xuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGlmICh0aW1lcikge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdHRpbWVyID0gbnVsbDtcblx0XHR9XG5cdFx0dGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xuXHRcdH0sIHRpbWUpO1xuXHR9O1xufTtcbmNvbnN0IHBhZ2VSZWxvYWQgPSBkZWJvdW5jZVJlbG9hZCg1MCk7XG5jb25zdCBobXJDbGllbnQgPSBuZXcgSE1SQ2xpZW50KHtcblx0ZXJyb3I6IChlcnIpID0+IGNvbnNvbGUuZXJyb3IoXCJbdml0ZV1cIiwgZXJyKSxcblx0ZGVidWc6ICguLi5tc2cpID0+IGNvbnNvbGUuZGVidWcoXCJbdml0ZV1cIiwgLi4ubXNnKVxufSwgdHJhbnNwb3J0LCBhc3luYyBmdW5jdGlvbiBpbXBvcnRVcGRhdGVkTW9kdWxlKHsgYWNjZXB0ZWRQYXRoLCB0aW1lc3RhbXAsIGV4cGxpY2l0SW1wb3J0UmVxdWlyZWQsIGlzV2l0aGluQ2lyY3VsYXJJbXBvcnQgfSkge1xuXHRjb25zdCBbYWNjZXB0ZWRQYXRoV2l0aG91dFF1ZXJ5LCBxdWVyeV0gPSBhY2NlcHRlZFBhdGguc3BsaXQoYD9gKTtcblx0Y29uc3QgaW1wb3J0UHJvbWlzZSA9IGltcG9ydChcblx0XHQvKiBAdml0ZS1pZ25vcmUgKi9cblx0XHRiYXNlICsgYWNjZXB0ZWRQYXRoV2l0aG91dFF1ZXJ5LnNsaWNlKDEpICsgYD8ke2V4cGxpY2l0SW1wb3J0UmVxdWlyZWQgPyBcImltcG9ydCZcIiA6IFwiXCJ9dD0ke3RpbWVzdGFtcH0ke3F1ZXJ5ID8gYCYke3F1ZXJ5fWAgOiBcIlwifWBcbik7XG5cdGlmIChpc1dpdGhpbkNpcmN1bGFySW1wb3J0KSBpbXBvcnRQcm9taXNlLmNhdGNoKCgpID0+IHtcblx0XHRjb25zb2xlLmluZm8oYFtobXJdICR7YWNjZXB0ZWRQYXRofSBmYWlsZWQgdG8gYXBwbHkgSE1SIGFzIGl0J3Mgd2l0aGluIGEgY2lyY3VsYXIgaW1wb3J0LiBSZWxvYWRpbmcgcGFnZSB0byByZXNldCB0aGUgZXhlY3V0aW9uIG9yZGVyLiBUbyBkZWJ1ZyBhbmQgYnJlYWsgdGhlIGNpcmN1bGFyIGltcG9ydCwgeW91IGNhbiBydW4gXFxgdml0ZSAtLWRlYnVnIGhtclxcYCB0byBsb2cgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgcGF0aCBpZiBhIGZpbGUgY2hhbmdlIHRyaWdnZXJlZCBpdC5gKTtcblx0XHRwYWdlUmVsb2FkKCk7XG5cdH0pO1xuXHRyZXR1cm4gYXdhaXQgaW1wb3J0UHJvbWlzZTtcbn0pO1xudHJhbnNwb3J0LmNvbm5lY3QoY3JlYXRlSE1SSGFuZGxlcihoYW5kbGVNZXNzYWdlKSk7XG5hc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKHBheWxvYWQpIHtcblx0c3dpdGNoIChwYXlsb2FkLnR5cGUpIHtcblx0XHRjYXNlIFwiY29ubmVjdGVkXCI6XG5cdFx0XHRjb25zb2xlLmRlYnVnKGBbdml0ZV0gY29ubmVjdGVkLmApO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBcInVwZGF0ZVwiOlxuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6YmVmb3JlVXBkYXRlXCIsIHBheWxvYWQpO1xuXHRcdFx0aWYgKGhhc0RvY3VtZW50KSBpZiAoaXNGaXJzdFVwZGF0ZSAmJiBoYXNFcnJvck92ZXJsYXkoKSkge1xuXHRcdFx0XHRsb2NhdGlvbi5yZWxvYWQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGVuYWJsZU92ZXJsYXkpIGNsZWFyRXJyb3JPdmVybGF5KCk7XG5cdFx0XHRcdGlzRmlyc3RVcGRhdGUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKHBheWxvYWQudXBkYXRlcy5tYXAoYXN5bmMgKHVwZGF0ZSkgPT4ge1xuXHRcdFx0XHRpZiAodXBkYXRlLnR5cGUgPT09IFwianMtdXBkYXRlXCIpIHJldHVybiBobXJDbGllbnQucXVldWVVcGRhdGUodXBkYXRlKTtcblx0XHRcdFx0Y29uc3QgeyBwYXRoLCB0aW1lc3RhbXAgfSA9IHVwZGF0ZTtcblx0XHRcdFx0Y29uc3Qgc2VhcmNoVXJsID0gY2xlYW5VcmwocGF0aCk7XG5cdFx0XHRcdGNvbnN0IGVsID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1wiKSkuZmluZCgoZSkgPT4gIW91dGRhdGVkTGlua1RhZ3MuaGFzKGUpICYmIGNsZWFuVXJsKGUuaHJlZikuaW5jbHVkZXMoc2VhcmNoVXJsKSk7XG5cdFx0XHRcdGlmICghZWwpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgbmV3UGF0aCA9IGAke2Jhc2V9JHtzZWFyY2hVcmwuc2xpY2UoMSl9JHtzZWFyY2hVcmwuaW5jbHVkZXMoXCI/XCIpID8gXCImXCIgOiBcIj9cIn10PSR7dGltZXN0YW1wfWA7XG5cdFx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IG5ld0xpbmtUYWcgPSBlbC5jbG9uZU5vZGUoKTtcblx0XHRcdFx0XHRuZXdMaW5rVGFnLmhyZWYgPSBuZXcgVVJMKG5ld1BhdGgsIGVsLmhyZWYpLmhyZWY7XG5cdFx0XHRcdFx0Y29uc3QgcmVtb3ZlT2xkRWwgPSAoKSA9PiB7XG5cdFx0XHRcdFx0XHRlbC5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGVidWcoYFt2aXRlXSBjc3MgaG90IHVwZGF0ZWQ6ICR7c2VhcmNoVXJsfWApO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0bmV3TGlua1RhZy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCByZW1vdmVPbGRFbCk7XG5cdFx0XHRcdFx0bmV3TGlua1RhZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgcmVtb3ZlT2xkRWwpO1xuXHRcdFx0XHRcdG91dGRhdGVkTGlua1RhZ3MuYWRkKGVsKTtcblx0XHRcdFx0XHRlbC5hZnRlcihuZXdMaW5rVGFnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSk7XG5cdFx0XHRhd2FpdCBobXJDbGllbnQubm90aWZ5TGlzdGVuZXJzKFwidml0ZTphZnRlclVwZGF0ZVwiLCBwYXlsb2FkKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJjdXN0b21cIjoge1xuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhwYXlsb2FkLmV2ZW50LCBwYXlsb2FkLmRhdGEpO1xuXHRcdFx0aWYgKHBheWxvYWQuZXZlbnQgPT09IFwidml0ZTp3czpkaXNjb25uZWN0XCIpIHtcblx0XHRcdFx0aWYgKGhhc0RvY3VtZW50ICYmICF3aWxsVW5sb2FkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFt2aXRlXSBzZXJ2ZXIgY29ubmVjdGlvbiBsb3N0LiBQb2xsaW5nIGZvciByZXN0YXJ0Li4uYCk7XG5cdFx0XHRcdFx0Y29uc3Qgc29ja2V0ID0gcGF5bG9hZC5kYXRhLndlYlNvY2tldDtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHNvY2tldC51cmwpO1xuXHRcdFx0XHRcdHVybC5zZWFyY2ggPSBcIlwiO1xuXHRcdFx0XHRcdGF3YWl0IHdhaXRGb3JTdWNjZXNzZnVsUGluZyh1cmwuaHJlZik7XG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRjYXNlIFwiZnVsbC1yZWxvYWRcIjpcblx0XHRcdGF3YWl0IGhtckNsaWVudC5ub3RpZnlMaXN0ZW5lcnMoXCJ2aXRlOmJlZm9yZUZ1bGxSZWxvYWRcIiwgcGF5bG9hZCk7XG5cdFx0XHRpZiAoaGFzRG9jdW1lbnQpIGlmIChwYXlsb2FkLnBhdGggJiYgcGF5bG9hZC5wYXRoLmVuZHNXaXRoKFwiLmh0bWxcIikpIHtcblx0XHRcdFx0Y29uc3QgcGFnZVBhdGggPSBkZWNvZGVVUkkobG9jYXRpb24ucGF0aG5hbWUpO1xuXHRcdFx0XHRjb25zdCBwYXlsb2FkUGF0aCA9IGJhc2UgKyBwYXlsb2FkLnBhdGguc2xpY2UoMSk7XG5cdFx0XHRcdGlmIChwYWdlUGF0aCA9PT0gcGF5bG9hZFBhdGggfHwgcGF5bG9hZC5wYXRoID09PSBcIi9pbmRleC5odG1sXCIgfHwgcGFnZVBhdGguZW5kc1dpdGgoXCIvXCIpICYmIHBhZ2VQYXRoICsgXCJpbmRleC5odG1sXCIgPT09IHBheWxvYWRQYXRoKSBwYWdlUmVsb2FkKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0gZWxzZSBwYWdlUmVsb2FkKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIFwicHJ1bmVcIjpcblx0XHRcdGF3YWl0IGhtckNsaWVudC5ub3RpZnlMaXN0ZW5lcnMoXCJ2aXRlOmJlZm9yZVBydW5lXCIsIHBheWxvYWQpO1xuXHRcdFx0YXdhaXQgaG1yQ2xpZW50LnBydW5lUGF0aHMocGF5bG9hZC5wYXRocyk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIFwiZXJyb3JcIjoge1xuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6ZXJyb3JcIiwgcGF5bG9hZCk7XG5cdFx0XHRpZiAoaGFzRG9jdW1lbnQpIHtcblx0XHRcdFx0Y29uc3QgZXJyID0gcGF5bG9hZC5lcnI7XG5cdFx0XHRcdGlmIChlbmFibGVPdmVybGF5KSBjcmVhdGVFcnJvck92ZXJsYXkoZXJyKTtcblx0XHRcdFx0ZWxzZSBjb25zb2xlLmVycm9yKGBbdml0ZV0gSW50ZXJuYWwgU2VydmVyIEVycm9yXFxuJHtlcnIubWVzc2FnZX1cXG4ke2Vyci5zdGFja31gKTtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRjYXNlIFwicGluZ1wiOiBicmVhaztcblx0XHRkZWZhdWx0OiB7XG5cdFx0XHRjb25zdCBjaGVjayA9IHBheWxvYWQ7XG5cdFx0XHRyZXR1cm4gY2hlY2s7XG5cdFx0fVxuXHR9XG59XG5jb25zdCBlbmFibGVPdmVybGF5ID0gdHJ1ZTtcbmNvbnN0IGhhc0RvY3VtZW50ID0gXCJkb2N1bWVudFwiIGluIGdsb2JhbFRoaXM7XG5mdW5jdGlvbiBjcmVhdGVFcnJvck92ZXJsYXkoZXJyKSB7XG5cdGNsZWFyRXJyb3JPdmVybGF5KCk7XG5cdGNvbnN0IHsgY3VzdG9tRWxlbWVudHM6IGN1c3RvbUVsZW1lbnRzJDEgfSA9IGdsb2JhbFRoaXM7XG5cdGlmIChjdXN0b21FbGVtZW50cyQxKSB7XG5cdFx0Y29uc3QgRXJyb3JPdmVybGF5Q29uc3RydWN0b3IgPSBjdXN0b21FbGVtZW50cyQxLmdldChvdmVybGF5SWQpO1xuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobmV3IEVycm9yT3ZlcmxheUNvbnN0cnVjdG9yKGVycikpO1xuXHR9XG59XG5mdW5jdGlvbiBjbGVhckVycm9yT3ZlcmxheSgpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChvdmVybGF5SWQpLmZvckVhY2goKG4pID0+IG4uY2xvc2UoKSk7XG59XG5mdW5jdGlvbiBoYXNFcnJvck92ZXJsYXkoKSB7XG5cdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG92ZXJsYXlJZCkubGVuZ3RoO1xufVxuYXN5bmMgZnVuY3Rpb24gd2FpdEZvclN1Y2Nlc3NmdWxQaW5nKHNvY2tldFVybCwgbXMgPSAxZTMpIHtcblx0YXN5bmMgZnVuY3Rpb24gcGluZygpIHtcblx0XHRjb25zdCBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KHNvY2tldFVybCwgXCJ2aXRlLXBpbmdcIik7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRmdW5jdGlvbiBvbk9wZW4oKSB7XG5cdFx0XHRcdHJlc29sdmUodHJ1ZSk7XG5cdFx0XHRcdGNsb3NlKCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBvbkVycm9yKCkge1xuXHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0Y2xvc2UoKTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGNsb3NlKCkge1xuXHRcdFx0XHRzb2NrZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgb25PcGVuKTtcblx0XHRcdFx0c29ja2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBvbkVycm9yKTtcblx0XHRcdFx0c29ja2V0LmNsb3NlKCk7XG5cdFx0XHR9XG5cdFx0XHRzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgb25PcGVuKTtcblx0XHRcdHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25FcnJvcik7XG5cdFx0fSk7XG5cdH1cblx0aWYgKGF3YWl0IHBpbmcoKSkgcmV0dXJuO1xuXHRhd2FpdCB3YWl0KG1zKTtcblx0d2hpbGUgKHRydWUpIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG5cdFx0aWYgKGF3YWl0IHBpbmcoKSkgYnJlYWs7XG5cdFx0YXdhaXQgd2FpdChtcyk7XG5cdH0gZWxzZSBhd2FpdCB3YWl0Rm9yV2luZG93U2hvdygpO1xufVxuZnVuY3Rpb24gd2FpdChtcykge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbmZ1bmN0aW9uIHdhaXRGb3JXaW5kb3dTaG93KCkge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRjb25zdCBvbkNoYW5nZSA9IGFzeW5jICgpID0+IHtcblx0XHRcdGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgb25DaGFuZ2UpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgb25DaGFuZ2UpO1xuXHR9KTtcbn1cbmNvbnN0IHNoZWV0c01hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5pZiAoXCJkb2N1bWVudFwiIGluIGdsb2JhbFRoaXMpIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJzdHlsZVtkYXRhLXZpdGUtZGV2LWlkXVwiKS5mb3JFYWNoKChlbCkgPT4ge1xuXHRzaGVldHNNYXAuc2V0KGVsLmdldEF0dHJpYnV0ZShcImRhdGEtdml0ZS1kZXYtaWRcIiksIGVsKTtcbn0pO1xuY29uc3QgY3NwTm9uY2UgPSBcImRvY3VtZW50XCIgaW4gZ2xvYmFsVGhpcyA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJtZXRhW3Byb3BlcnR5PWNzcC1ub25jZV1cIik/Lm5vbmNlIDogdm9pZCAwO1xubGV0IGxhc3RJbnNlcnRlZFN0eWxlO1xuZnVuY3Rpb24gdXBkYXRlU3R5bGUoaWQsIGNvbnRlbnQpIHtcblx0bGV0IHN0eWxlID0gc2hlZXRzTWFwLmdldChpZCk7XG5cdGlmICghc3R5bGUpIHtcblx0XHRzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcblx0XHRzdHlsZS5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dC9jc3NcIik7XG5cdFx0c3R5bGUuc2V0QXR0cmlidXRlKFwiZGF0YS12aXRlLWRldi1pZFwiLCBpZCk7XG5cdFx0c3R5bGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuXHRcdGlmIChjc3BOb25jZSkgc3R5bGUuc2V0QXR0cmlidXRlKFwibm9uY2VcIiwgY3NwTm9uY2UpO1xuXHRcdGlmICghbGFzdEluc2VydGVkU3R5bGUpIHtcblx0XHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdGxhc3RJbnNlcnRlZFN0eWxlID0gdm9pZCAwO1xuXHRcdFx0fSwgMCk7XG5cdFx0fSBlbHNlIGxhc3RJbnNlcnRlZFN0eWxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHN0eWxlKTtcblx0XHRsYXN0SW5zZXJ0ZWRTdHlsZSA9IHN0eWxlO1xuXHR9IGVsc2Ugc3R5bGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuXHRzaGVldHNNYXAuc2V0KGlkLCBzdHlsZSk7XG59XG5mdW5jdGlvbiByZW1vdmVTdHlsZShpZCkge1xuXHRjb25zdCBzdHlsZSA9IHNoZWV0c01hcC5nZXQoaWQpO1xuXHRpZiAoc3R5bGUpIHtcblx0XHRkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKHN0eWxlKTtcblx0XHRzaGVldHNNYXAuZGVsZXRlKGlkKTtcblx0fVxufVxuZnVuY3Rpb24gY3JlYXRlSG90Q29udGV4dChvd25lclBhdGgpIHtcblx0cmV0dXJuIG5ldyBITVJDb250ZXh0KGhtckNsaWVudCwgb3duZXJQYXRoKTtcbn1cbi8qKlxuKiB1cmxzIGhlcmUgYXJlIGR5bmFtaWMgaW1wb3J0KCkgdXJscyB0aGF0IGNvdWxkbid0IGJlIHN0YXRpY2FsbHkgYW5hbHl6ZWRcbiovXG5mdW5jdGlvbiBpbmplY3RRdWVyeSh1cmwsIHF1ZXJ5VG9JbmplY3QpIHtcblx0aWYgKHVybFswXSAhPT0gXCIuXCIgJiYgdXJsWzBdICE9PSBcIi9cIikgcmV0dXJuIHVybDtcblx0Y29uc3QgcGF0aG5hbWUgPSB1cmwucmVwbGFjZSgvWz8jXS4qJC8sIFwiXCIpO1xuXHRjb25zdCB7IHNlYXJjaCwgaGFzaCB9ID0gbmV3IFVSTCh1cmwsIFwiaHR0cDovL3ZpdGUuZGV2XCIpO1xuXHRyZXR1cm4gYCR7cGF0aG5hbWV9PyR7cXVlcnlUb0luamVjdH0ke3NlYXJjaCA/IGAmYCArIHNlYXJjaC5zbGljZSgxKSA6IFwiXCJ9JHtoYXNoIHx8IFwiXCJ9YDtcbn1cblxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBFcnJvck92ZXJsYXksIGNyZWF0ZUhvdENvbnRleHQsIGluamVjdFF1ZXJ5LCByZW1vdmVTdHlsZSwgdXBkYXRlU3R5bGUgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7QUFFL0MsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN4SCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3SCxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDZDs7QUFFQSxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFDN0gsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUM5QixDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFDRCxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDOztBQUVBLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztBQUMvSCxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFD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QyxFQUFFLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNqRCxDQUFDO0FBQ0QsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO0FBQ3ZGLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLE9BQU87QUFDVixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLE9BQU87QUFDVixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUNELENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUM7QUFDN0MsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQzdCLENBQUM7QUFDRCxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNsQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFD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QyxHQUFHLENBQUM7QUFDdkYsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6SSxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUN6RCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7QUFDNUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJO0FBQ2xGLENBQUMsQ0FBQztBQUNGLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJ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LENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkYsQ0FBQyxNQUFNLENBQUMsS0FBSztBQUNiO0FBQ0EsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDM0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDVCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDL0QsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNO0FBQ3ZCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUNGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDM0ksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUMsQ0FBQyxNQUFNLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUk7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQ2hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQzdELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDYixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDVCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQzdDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLE9BQU87QUFDL0MsQ0FBQyxHQUFHLENBQUMsaUJBQWlCO0FBQ3RCLENBQUMsTUFBTSxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzlELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU07QUFDMUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxpQkFBaUI7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ1YsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsWUFBWTtBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxpQkFBaUI7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU07QUFDM0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCO0FBQ2pELENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUN0QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNWLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTTtBQUN4QyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQjtBQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekQsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQjtBQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDaEQsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRztBQUNqRCxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ1AsQ0FBQyxHQUFHLENBQUMsY0FBYztBQUNuQixDQUFDLE1BQU0sQ0FBQztBQUNSLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJO0FBQ25ELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1B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QUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDekIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDckIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSztBQUN2QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSTtBQUNiLENBQUM7QUFDRCxDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQzdCLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDdEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkMsQ0FBQyxLQUFLLENBQUMs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Q0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUM1QixDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHO0FBQ3hCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSTtBQUNuQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHO0FBQ3BCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRO0FBQ3BCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFDdEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHO0FBQ2hDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3hFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNO0FBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNsQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRztBQUNoQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUk7QUFDbEI7O0FBRUEsR0FBRyxDQUFDO0FBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENB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QyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3RCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSTtBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDYixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNuWCxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RCxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDOUQsS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7QUFDN0MsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7QUFDN0MsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDVCxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTztBQUMvRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDckYsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDM0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3JELENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQyxDQUFDLENB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QUs7QUFDVixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ2YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7QUFDckMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUNoQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUM3QyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7QUFDbEQsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5SCxDQUFDLEtBQUssQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xJLENBQUM7QUFDRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMs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SSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJO0FBQ3JELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQ3JELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUN0RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQy9ELENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDUixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDUixDQUFDLENBQUM7QUFDRixDQUFD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QUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUM1QztBQUNBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQztBQUNsRSxDQUFDO0FBQ0QsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN6QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHO0FBQ2pELENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RCxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6Rjs7QUFFQSxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyJ9