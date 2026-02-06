<template>
	<div
		:id="'msg-' + message.id"
		:class="[
			'msg',
			{
				self: message.self,
				highlight: message.highlight || focused,
				'previous-source': isPreviousSource,
			},
		]"
		:data-type="message.type"
		:data-command="message.command"
		:data-from="message.from && message.from.nick"
	>
		<span
			aria-hidden="true"
			:aria-label="messageTimeLocale"
			class="time tooltipped tooltipped-e"
			>{{ `${messageTime}&#32;` }}
		</span>
		<template v-if="message.type === 'unhandled'">
			<span class="from">[{{ message.command }}]</span>
			<span class="content">
				<span v-for="(param, id) in message.params" :key="id">{{
					`&#32;${param}&#32;`
				}}</span>
			</span>
		</template>
		<template v-else-if="isAction()">
			<span class="from"><span class="only-copy" aria-hidden="true">***&nbsp;</span></span>
			<component :is="messageComponent" :network="network" :message="message" />
		</template>
		<template v-else-if="message.type === 'action'">
			<span class="from"><span class="only-copy">*&nbsp;</span></span>
			<span class="content" dir="auto">
				<Username
					:user="message.from"
					:network="network"
					:channel="channel"
					dir="auto"
				/>&#32;<ParsedMessage :message="message" />
				<LinkPreview
					v-for="preview in message.previews"
					:key="preview.link"
					:keep-scroll-position="keepScrollPosition"
					:link="preview"
					:channel="channel"
				/>
			</span>
		</template>
		<template v-else>
			<span v-if="message.type === 'message'" class="from">
				<template v-if="message.from && message.from.nick">
					<span class="only-copy" aria-hidden="true">&lt;</span>
					<Username :user="message.from" :network="network" :channel="channel" />
					<span class="only-copy" aria-hidden="true">&gt;&nbsp;</span>
				</template>
			</span>
			<span v-else-if="message.type === 'plugin'" class="from">
				<template v-if="message.from && message.from.nick">
					<span class="only-copy" aria-hidden="true">[</span>
					{{ message.from.nick }}
					<span class="only-copy" aria-hidden="true">]&nbsp;</span>
				</template>
			</span>
			<span v-else class="from">
				<template v-if="message.from && message.from.nick">
					<span class="only-copy" aria-hidden="true">-</span>
					<Username :user="message.from" :network="network" :channel="channel" />
					<span class="only-copy" aria-hidden="true">-&nbsp;</span>
				</template>
			</span>
			<span class="content" dir="auto">
				<span
					v-if="message.showInActive"
					aria-label="This message was shown in your active channel"
					class="msg-shown-in-active tooltipped tooltipped-e"
					><span></span
				></span>
				<span
					v-if="message.statusmsgGroup"
					:aria-label="`This message was only shown to users with ${message.statusmsgGroup} mode`"
					class="msg-statusmsg tooltipped tooltipped-e"
					><span>{{ message.statusmsgGroup }}</span></span
				>
				<ParsedMessage :network="network" :message="message" />
				<LinkPreview
					v-for="preview in message.previews"
					:key="preview.link"
					:keep-scroll-position="keepScrollPosition"
					:link="preview"
					:channel="channel"
				/>
			</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {PropType} from "vue";
import dayjs from "dayjs";

import constants from "../js/constants";
import localetime from "../js/helpers/localetime";
import Username from "./Username.vue";
import LinkPreview from "./LinkPreview.vue";
import ParsedMessage from "./ParsedMessage.vue";
import MessageTypes from "./MessageTypes";

import type {ClientChan, ClientMessage, ClientNetwork} from "../js/types";
import {useSettingsStore} from "../stores/settings";

MessageTypes.ParsedMessage = ParsedMessage;
MessageTypes.LinkPreview = LinkPreview;
MessageTypes.Username = Username;

const props = defineProps({
	message: {type: Object as PropType<ClientMessage>, required: true},
	channel: {type: Object as PropType<ClientChan>, required: false},
	network: {type: Object as PropType<ClientNetwork>, required: true},
	keepScrollPosition: {type: Function as PropType<() => void>, required: false},
	isPreviousSource: Boolean,
	focused: Boolean,
});

const settingsStore = useSettingsStore();

const timeFormat = computed(() => {
	let format: keyof typeof constants.timeFormats;

	if (settingsStore.use12hClock) {
		format = settingsStore.showSeconds ? "msg12hWithSeconds" : "msg12h";
	} else {
		format = settingsStore.showSeconds ? "msgWithSeconds" : "msgDefault";
	}

	return constants.timeFormats[format];
});

const messageTime = computed(() => {
	return dayjs(props.message.time).format(timeFormat.value);
});

const messageTimeLocale = computed(() => {
	return localetime(props.message.time);
});

const messageComponent = computed(() => {
	const componentName = "message-" + (props.message.type || "invalid");
	return MessageTypes[componentName] || null;
});

const isAction = () => {
	if (!props.message.type) {
		return false;
	}

	return typeof MessageTypes["message-" + props.message.type] !== "undefined";
};
</script>

<script lang="ts">
export default {
	name: "Message",
};
</script>
