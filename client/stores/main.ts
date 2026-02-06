import {defineStore} from "pinia";
import {ref, computed} from "vue";
import storage from "../js/localStorage";
// import { createSettingsStore } from "../js/store-settings"; // Removed unused
import {SharedChangelogData} from "../../shared/types/changelog";
import type {ClientChan, ClientNetwork, NetChan, ClientMention, ClientMessage} from "../js/types";
import {SearchQuery} from "../../shared/types/storage";
import {SharedConfiguration, LockedSharedConfiguration} from "../../shared/types/config";

const appName = document.title;

enum DesktopNotificationState {
	Unsupported = "unsupported",
	Blocked = "blocked",
	NoHttps = "nohttps",
	Granted = "granted",
}

function detectDesktopNotificationState(): DesktopNotificationState {
	if (!("Notification" in window)) {
		return DesktopNotificationState.Unsupported;
	} else if (Notification.permission === DesktopNotificationState.Granted) {
		return DesktopNotificationState.Granted;
	} else if (!window.isSecureContext) {
		return DesktopNotificationState.NoHttps;
	}

	return DesktopNotificationState.Blocked;
}

export type ClientSession = {
	current: boolean;
	active: number;
	lastUse: number;
	ip: string;
	agent: string;
	token: string;
};

export const useMainStore = defineStore("main", () => {
	// State
	const appLoaded = ref(false);
	const activeChannel = ref<NetChan>();
	const currentUserVisibleError = ref<string | null>(null);
	const desktopNotificationState = ref(detectDesktopNotificationState());
	const isAutoCompleting = ref(false);
	const isConnected = ref(false);
	const networks = ref<ClientNetwork[]>([]);
	const mentions = ref<ClientMention[]>([]);
	const hasServiceWorker = ref(false);
	const pushNotificationState = ref("unsupported");
	const serverConfiguration = ref<SharedConfiguration | LockedSharedConfiguration | null>(null);
	const sessions = ref<ClientSession[]>([]);
	const sidebarOpen = ref(false);
	const sidebarDragging = ref(false);
	const userlistOpen = ref(storage.get("nebula.state.userlist") !== "false");
	const versionData = ref<SharedChangelogData | null>(null);
	const versionStatus = ref<"loading" | "new-version" | "new-packages" | "up-to-date" | "error">(
		"loading"
	);
	const versionDataExpired = ref(false);
	const serverHasSettings = ref(false);
	const messageSearchResults = ref<{results: ClientMessage[]} | null>(null);
	const messageSearchPendingQuery = ref<SearchQuery | null>(null);
	const searchEnabled = ref(false);

	// Getters
	const highlightCount = computed(() => {
		let count = 0;
		for (const network of networks.value) {
			for (const channel of network.channels) {
				if (channel.muted) {
					continue;
				}
				count += channel.highlight;
			}
		}
		return count;
	});

	const title = computed(() => {
		const alertEventCount = highlightCount.value ? `(${highlightCount.value.toString()}) ` : "";
		const channelname = activeChannel.value ? `${activeChannel.value.channel.name} — ` : "";
		return alertEventCount + channelname + appName;
	});

	const findChannelOnCurrentNetwork = computed(() => (name: string) => {
		name = name.toLowerCase();
		return activeChannel.value?.network.channels.find((c) => c.name.toLowerCase() === name);
	});

	const findChannelOnNetwork = computed(() => (networkUuid: string, channelName: string) => {
		for (const network of networks.value) {
			if (network.uuid !== networkUuid) {
				continue;
			}
			for (const channel of network.channels) {
				if (channel.name === channelName) {
					return {network, channel};
				}
			}
		}
		return null;
	});

	const findChannel = computed(() => (id: number) => {
		for (const network of networks.value) {
			for (const channel of network.channels) {
				if (channel.id === id) {
					return {network, channel};
				}
			}
		}
		return null;
	});

	const findNetwork = computed(() => (uuid: string) => {
		for (const network of networks.value) {
			if (network.uuid === uuid) {
				return network;
			}
		}
		return null;
	});

	// Actions
	function setAppLoaded() {
		appLoaded.value = true;
	}
	function setActiveChannel(netChan: NetChan) {
		activeChannel.value = netChan;
	}
	function setCurrentUserVisibleError(error: string | null) {
		currentUserVisibleError.value = error;
	}
	function refreshDesktopNotificationState() {
		desktopNotificationState.value = detectDesktopNotificationState();
	}
	function setIsAutoCompleting(val: boolean) {
		isAutoCompleting.value = val;
	}
	function setIsConnected(val: boolean) {
		isConnected.value = val;
	}
	function setNetworks(val: ClientNetwork[]) {
		networks.value = val;
	}
	function setMentions(val: ClientMention[]) {
		mentions.value = val;
	}

	function removeNetwork(networkId: string) {
		networks.value.splice(
			networks.value.findIndex((n) => n.uuid === networkId),
			1
		);
	}

	function sortNetworks(sortFn: (a: ClientNetwork, b: ClientNetwork) => number) {
		networks.value.sort(sortFn);
	}

	function setHasServiceWorker() {
		hasServiceWorker.value = true;
	}
	function setPushNotificationState(val: string) {
		pushNotificationState.value = val;
	}
	function setServerConfiguration(val: SharedConfiguration | LockedSharedConfiguration | null) {
		serverConfiguration.value = val;
	}
	function setSessions(val: ClientSession[]) {
		sessions.value = val;
	}
	function setSidebarOpen(val: boolean) {
		sidebarOpen.value = val;
	}
	function setSidebarDragging(val: boolean) {
		sidebarDragging.value = val;
	}
	function toggleSidebar() {
		sidebarOpen.value = !sidebarOpen.value;
	}
	function toggleUserlist() {
		userlistOpen.value = !userlistOpen.value;
	}
	function setUserlistOpen(val: boolean) {
		userlistOpen.value = val;
	}
	function setVersionData(val: SharedChangelogData | null) {
		versionData.value = val;
	}
	function setVersionStatus(
		val: "loading" | "new-version" | "new-packages" | "up-to-date" | "error"
	) {
		versionStatus.value = val;
	}
	function setVersionDataExpired(val: boolean) {
		versionDataExpired.value = val;
	}
	function setServerHasSettings(val: boolean) {
		serverHasSettings.value = val;
	}
	function setMessageSearchPendingQuery(val: SearchQuery | null) {
		messageSearchPendingQuery.value = val;
	}
	function setMessageSearchResults(val: {results: ClientMessage[]} | null) {
		messageSearchResults.value = val;
	}

	function addMessageSearchResults(value: {results: ClientMessage[]} | null) {
		if (!messageSearchResults.value) {
			messageSearchResults.value = {results: []};
		}

		if (!value) {
			return;
		}

		const results = [...value.results, ...messageSearchResults.value.results];

		messageSearchResults.value = {
			results,
		};
	}

	function partChannel(netChan: NetChan) {
		const newMentions = mentions.value.filter((msg) => !(msg.chanId === netChan.channel.id));
		mentions.value = newMentions;
	}

	return {
		// State
		appLoaded,
		activeChannel,
		currentUserVisibleError,
		desktopNotificationState,
		isAutoCompleting,
		isConnected,
		networks,
		mentions,
		hasServiceWorker,
		pushNotificationState,
		serverConfiguration,
		sessions,
		sidebarOpen,
		sidebarDragging,
		userlistOpen,
		versionData,
		versionStatus,
		versionDataExpired,
		serverHasSettings,
		messageSearchResults,
		messageSearchPendingQuery,
		searchEnabled,

		// Getters
		highlightCount,
		title,
		findChannelOnCurrentNetwork,
		findChannelOnNetwork,
		findChannel,
		findNetwork,

		// Actions
		setAppLoaded,
		setActiveChannel,
		setCurrentUserVisibleError,
		refreshDesktopNotificationState,
		setIsAutoCompleting,
		setIsConnected,
		setNetworks,
		setMentions,
		removeNetwork,
		sortNetworks,
		setHasServiceWorker,
		setPushNotificationState,
		setServerConfiguration,
		setSessions,
		setSidebarOpen,
		setSidebarDragging,
		toggleSidebar,
		toggleUserlist,
		setUserlistOpen,
		setVersionData,
		setVersionStatus,
		setVersionDataExpired,
		setServerHasSettings,
		setMessageSearchPendingQuery,
		setMessageSearchResults,
		addMessageSearchResults,
		partChannel,
	};
});
