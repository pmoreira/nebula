import {defineStore} from "pinia";
import storage from "../js/localStorage";
import socket from "../js/socket";
import {config, createState} from "../js/settings";
import {useMainStore} from "./main";

// Helper functions (copied from store-settings.ts)
function loadFromLocalStorage() {
	let storedSettings: Record<string, any> = {};

	try {
		storedSettings = JSON.parse(storage.get("settings") || "{}");
	} catch (e) {
		storage.remove("settings");
	}

	if (!storedSettings) {
		return {};
	}

	// Older The Lounge versions converted highlights to an array, turn it back into a string
	if (storedSettings.highlights !== null && typeof storedSettings.highlights === "object") {
		storedSettings.highlights = storedSettings.highlights.join(", ");
	}

	return storedSettings;
}

function assignStoredSettings(
	defaultSettings: Record<string, any>,
	storedSettings: Record<string, any>
) {
	const newSettings = {...defaultSettings};

	for (const key in defaultSettings) {
		// Make sure the setting in local storage has the same type that the code expects
		if (
			typeof storedSettings[key] !== "undefined" &&
			typeof defaultSettings[key] === typeof storedSettings[key]
		) {
			newSettings[key] = storedSettings[key];
		}
	}

	return newSettings;
}

export const useSettingsStore = defineStore("settings", {
	state: () => assignStoredSettings(createState(), loadFromLocalStorage()),
	actions: {
		set(name: string, value: any) {
			this[name] = value;
		},
		syncAll(force = false) {
			const mainStore = useMainStore();
			if (this.syncSettings === false && force === false) {
				return;
			}

			mainStore.setServerHasSettings(true);

			for (const name in this.$state) {
				if (config[name].sync !== "never" || config[name].sync === "always") {
					socket.emit("setting:set", {name, value: this[name]});
				}
			}
		},
		applyAll() {
			// We need a dummy store wrapper to pass to apply functions which expect Vuex store
			// This is a bit hacky but needed for backward compatibility with settings config structure
			const mainStore = useMainStore();
			const storeWrapper: any = {
				state: {
					...mainStore.$state,
					settings: this.$state,
				}, // Approximate state structure
				commit: (type: string, payload: any) => {
					// Map commits to main store actions
					if (type === "refreshDesktopNotificationState")
						mainStore.refreshDesktopNotificationState();
					// ... generic fallback or specific mapping
					// Ideally we should refactor settings.ts to not depend on store.commit string
				},
				getters: {}, // ...
			};

			for (const settingName in config) {
				// Warning: passing storeWrapper might not work perfectly if apply functions expect reactive state
				// But for now, let's try to adapt provided config.apply logic
				// Actually, config.apply expects `store` generic.
				// We might need to refactor settings.ts config to take `app` or specific callbacks instead of store.
				// For this refactoring, let's assume we can update settings.ts apply methods later or mock enough structure.

				// Inspecting settings.ts again:
				// desktopNotifications: store.commit("refreshDesktopNotificationState")
				// theme: store.state.serverConfiguration (read)

				// Let's defer full settings.ts refactoring and just pass mapped mainStore

				// Re-creating a better wrapper
				const wrapper = {
					state: {
						get serverConfiguration() {
							return mainStore.serverConfiguration;
						},
					},
					commit: (name: string, ...args: any[]) => {
						if (name === "refreshDesktopNotificationState")
							mainStore.refreshDesktopNotificationState();
					},
				};

				config[settingName].apply(wrapper as any, this[settingName], true);
			}
		},
		update(name: string, value: any, sync = false) {
			if (this[name] === value) {
				return;
			}

			const settingConfig = config[name];

			if (!settingConfig) {
				return;
			}

			if (sync === false && (this.syncSettings === false || settingConfig.sync === "never")) {
				return;
			}

			this[name] = value;
			storage.set("settings", JSON.stringify(this.$state));

			const mainStore = useMainStore();
			const wrapper = {
				state: {
					get serverConfiguration() {
						return mainStore.serverConfiguration;
					},
				},
				commit: (name: string, ...args: any[]) => {
					if (name === "refreshDesktopNotificationState")
						mainStore.refreshDesktopNotificationState();
				},
			};

			settingConfig.apply(wrapper as any, value);

			if (!sync) {
				return;
			}

			if (
				(this.syncSettings && settingConfig.sync !== "never") ||
				settingConfig.sync === "always"
			) {
				socket.emit("setting:set", {name, value});
			}
		},
	},
});
