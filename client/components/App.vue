<template>
	<div id="viewport" :class="viewportClasses" role="tablist">
		<Sidebar v-if="store.appLoaded" :overlay="overlay" />
		<div
			id="sidebar-overlay"
			ref="overlay"
			aria-hidden="true"
			@click="store.setSidebarOpen(false)"
		/>
		<router-view ref="loungeWindow"></router-view>
		<Mentions />
		<ImageViewer ref="imageViewer" />
		<ContextMenu ref="contextMenu" />
		<ConfirmDialog ref="confirmDialog" />
		<div id="upload-overlay"></div>
	</div>
</template>

<script setup lang="ts">
import {computed, provide, onBeforeUnmount, onMounted, ref} from "vue";
import throttle from "lodash/throttle";
import Mousetrap, {ExtendedKeyboardEvent} from "mousetrap";
import constants from "../js/constants";
import eventbus from "../js/eventbus";
import storage from "../js/localStorage";
import isIgnoredKeybind from "../js/helpers/isIgnoredKeybind";

import Sidebar from "./Sidebar.vue";
import ImageViewer from "./ImageViewer.vue";
import ContextMenu from "./ContextMenu.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import Mentions from "./Mentions.vue";

import {useMainStore} from "../stores/main";
import {imageViewerKey, contextMenuKey, confirmDialogKey} from "../js/injectionKeys";
import type {DebouncedFunc} from "lodash";

const store = useMainStore();
const overlay = ref(null);
const loungeWindow = ref(null);
const imageViewer = ref(null);
const contextMenu = ref(null);
const confirmDialog = ref(null);

provide(imageViewerKey, imageViewer);
provide(contextMenuKey, contextMenu);
provide(confirmDialogKey, confirmDialog);

const viewportClasses = computed(() => {
	return {
		notified: store.highlightCount > 0,
		"menu-open": store.appLoaded && store.sidebarOpen,
		"menu-dragging": store.sidebarDragging,
		"userlist-open": store.userlistOpen,
	};
});

const debouncedResize = ref<DebouncedFunc<() => void>>();
const dayChangeTimeout = ref<any>();

const escapeKey = () => {
	eventbus.emit("escapekey");
};

const toggleSidebar = (e: ExtendedKeyboardEvent) => {
	if (isIgnoredKeybind(e)) {
		return true;
	}

	store.toggleSidebar();

	return false;
};

const toggleUserList = (e: ExtendedKeyboardEvent) => {
	if (isIgnoredKeybind(e)) {
		return true;
	}

	store.toggleUserlist();

	return false;
};

const toggleMentions = () => {
	if (store.networks.length !== 0) {
		eventbus.emit("mentions:toggle");
	}
};

const msUntilNextDay = () => {
	const today = new Date();
	const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();

	return nextDay - today.getTime();
};

const prepareOpenStates = () => {
	const viewportWidth = window.innerWidth;
	let isUserlistOpen = storage.get("thelounge.state.userlist");

	if (viewportWidth > constants.mobileViewportPixels) {
		store.setSidebarOpen(storage.get("thelounge.state.sidebar") !== "false");
	}

	if (viewportWidth >= 1024 && isUserlistOpen !== "true" && isUserlistOpen !== "false") {
		isUserlistOpen = "true";
	}

	store.setUserlistOpen(isUserlistOpen === "true");
};

prepareOpenStates();

onMounted(() => {
	Mousetrap.bind("esc", escapeKey);
	Mousetrap.bind("alt+u", toggleUserList);
	Mousetrap.bind("alt+s", toggleSidebar);
	Mousetrap.bind("alt+m", toggleMentions);

	debouncedResize.value = throttle(() => {
		eventbus.emit("resize");
	}, 100);

	window.addEventListener("resize", debouncedResize.value, {passive: true});

	const emitDayChange = () => {
		eventbus.emit("daychange");
		dayChangeTimeout.value = setTimeout(emitDayChange, msUntilNextDay());
	};

	dayChangeTimeout.value = setTimeout(emitDayChange, msUntilNextDay());
});

onBeforeUnmount(() => {
	Mousetrap.unbind("esc");
	Mousetrap.unbind("alt+u");
	Mousetrap.unbind("alt+s");
	Mousetrap.unbind("alt+m");

	if (debouncedResize.value) {
		window.removeEventListener("resize", debouncedResize.value);
	}

	if (dayChangeTimeout.value) {
		clearTimeout(dayChangeTimeout.value);
	}
});
</script>

<script lang="ts">
export default {
	name: "App",
};
</script>
