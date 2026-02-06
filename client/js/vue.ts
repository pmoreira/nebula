import constants from "./constants";

import "../css/style.css";
import {createPinia} from "pinia";
import {createApp, watch} from "vue";
import {useMainStore} from "../stores/main";
import App from "../components/App.vue";
import storage from "./localStorage";
import {router} from "./router";
import socket from "./socket";
import "./socket-events"; // this sets up all socket event listeners, do not remove
import eventbus from "./eventbus";

import "./webpush";
import "./keybinds";
import {LoungeWindow} from "./types";

const favicon = document.getElementById("favicon");
const faviconNormal = favicon?.getAttribute("href") || "";
const faviconAlerted = favicon?.dataset.other || "";

export const VueApp = createApp(App);
const pinia = createPinia();

VueApp.use(router);
VueApp.use(pinia);

const store = useMainStore();

VueApp.mount("#app");
socket.open();

watch(
	() => store.sidebarOpen,
	(sidebarOpen) => {
		if (window.innerWidth > constants.mobileViewportPixels) {
			storage.set("nebula.state.sidebar", sidebarOpen.toString());
			eventbus.emit("resize");
		}
	}
);

watch(
	() => store.userlistOpen,
	(userlistOpen) => {
		storage.set("nebula.state.userlist", userlistOpen.toString());
		eventbus.emit("resize");
	}
);

watch(
	() => store.title,
	(title) => {
		document.title = title;
	}
);

// Toggles the favicon to red when there are unread notifications
watch(
	() => store.highlightCount,
	(highlightCount) => {
		favicon?.setAttribute("href", highlightCount > 0 ? faviconAlerted : faviconNormal);

		const nav: LoungeWindow["navigator"] = window.navigator;

		if (nav.setAppBadge) {
			if (highlightCount > 0) {
				nav.setAppBadge(highlightCount).catch(() => {});
			} else {
				if (nav.clearAppBadge) {
					nav.clearAppBadge().catch(() => {});
				}
			}
		}
	}
);

VueApp.config.errorHandler = function (e) {
	if (e instanceof Error) {
		store.setCurrentUserVisibleError(`Vue error: ${e.message}`);
	} else {
		store.setCurrentUserVisibleError(`Vue error: ${String(e)}`);
	}

	// eslint-disable-next-line no-console
	console.error(e);
};
