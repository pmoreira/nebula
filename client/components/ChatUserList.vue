<template>
	<aside
		ref="userlist"
		class="userlist"
		:aria-label="'User list for ' + channel.name"
		@mouseleave="removeHoverUser"
	>
		<div class="count">
			<input
				ref="input"
				:value="userSearchInput"
				:placeholder="
					channel.users.length + ' user' + (channel.users.length === 1 ? '' : 's')
				"
				type="search"
				class="search"
				aria-label="Search among the user list"
				tabindex="-1"
				@input="setUserSearchInput"
				@keydown.up="navigateUserList($event, -1)"
				@keydown.down="navigateUserList($event, 1)"
				@keydown.page-up="navigateUserList($event, -10)"
				@keydown.page-down="navigateUserList($event, 10)"
				@keydown.enter="selectUser"
			/>
		</div>
		<div class="names">
			<div
				v-for="(users, mode) in groupedUsers"
				:key="mode"
				:class="['user-mode', getModeClass(String(mode))]"
			>
				<template v-if="userSearchInput.length > 0">
					<!-- eslint-disable vue/no-v-text-v-html-on-component -->
					<Username
						v-for="user in users"
						:key="user.original.nick + '-search'"
						:on-hover="hoverUser"
						:active="user.original === activeUser"
						:user="user.original"
						v-html="user.string"
					/>
					<!-- eslint-enable -->
				</template>
				<template v-else>
					<Username
						v-for="user in users"
						:key="user.nick"
						:on-hover="hoverUser"
						:active="user === activeUser"
						:user="user"
					/>
				</template>
			</div>
		</div>
	</aside>
</template>

<script setup lang="ts">
import {filter as fuzzyFilter} from "fuzzy";
import {computed, nextTick, ref, PropType} from "vue";

import type {UserInMessage} from "../../shared/types/msg";
import type {ClientChan, ClientUser} from "../js/types";
import Username from "./Username.vue";

const props = defineProps({
	channel: {type: Object as PropType<ClientChan>, required: true},
});

const modes: Record<string, string> = {
	"~": "owner",
	"&": "admin",
	"!": "admin",
	"@": "op",
	"%": "half-op",
	"+": "voice",
	"": "normal",
};

const userSearchInput = ref("");
const activeUser = ref<UserInMessage | null>();
const userlist = ref<HTMLDivElement>();

const filteredUsers = computed(() => {
	if (!userSearchInput.value) {
		return;
	}

	return fuzzyFilter(userSearchInput.value, props.channel.users, {
		pre: "<b>",
		post: "</b>",
		extract: (u) => u.nick,
	});
});

const groupedUsers = computed(() => {
	const groups: Record<string, any[]> = {};

	if (userSearchInput.value && filteredUsers.value) {
		const result = filteredUsers.value;

		for (const user of result) {
			const mode: string = user.original.modes[0] || "";

			if (!groups[mode]) {
				groups[mode] = [];
			}

			// Prepend user mode to search result
			user.string = mode + user.string;

			groups[mode].push(user);
		}
	} else {
		for (const user of props.channel.users) {
			const mode = user.modes[0] || "";

			if (!groups[mode]) {
				groups[mode] = [user];
			} else {
				groups[mode].push(user);
			}
		}
	}

	return groups as {
		[mode: string]: (ClientUser & {
			original: UserInMessage;
			string: string;
		})[];
	};
});

const setUserSearchInput = (e: Event) => {
	userSearchInput.value = (e.target as HTMLInputElement).value;
};

const getModeClass = (mode: string) => {
	return modes[mode] || "normal";
};

const selectUser = () => {
	if (!activeUser.value || !userlist.value) {
		return;
	}

	const el = userlist.value.querySelector(".active");

	if (!el) {
		return;
	}

	const rect = el.getBoundingClientRect();
	const ev = new MouseEvent("click", {
		view: window,
		bubbles: true,
		cancelable: true,
		clientX: rect.left,
		clientY: rect.top + rect.height,
	});
	el.dispatchEvent(ev);
};

const hoverUser = (user: UserInMessage) => {
	activeUser.value = user;
};

const removeHoverUser = () => {
	activeUser.value = null;
};

const scrollToActiveUser = () => {
	void nextTick(() => {
		const el = userlist.value?.querySelector(".active");
		el?.scrollIntoView({block: "nearest", inline: "nearest"});
	});
};

const navigateUserList = (event: Event, direction: number) => {
	event.stopImmediatePropagation();
	event.preventDefault();

	let users = props.channel.users;

	if (userSearchInput.value && filteredUsers.value) {
		users = filteredUsers.value.map((result) => result.original);
	}

	if (!users.length) {
		activeUser.value = null;
		return;
	}

	const abort = () => {
		activeUser.value = direction > 0 ? users[0] : users[users.length - 1];
		scrollToActiveUser();
	};

	if (!activeUser.value) {
		abort();
		return;
	}

	let currentIndex = users.indexOf(activeUser.value as ClientUser);

	if (currentIndex === -1) {
		abort();
		return;
	}

	currentIndex += direction;

	while (currentIndex < 0) {
		currentIndex += users.length;
	}

	while (currentIndex > users.length - 1) {
		currentIndex -= users.length;
	}

	activeUser.value = users[currentIndex];
	scrollToActiveUser();
};
</script>

<script lang="ts">
export default {
	name: "ChatUserList",
};
</script>
