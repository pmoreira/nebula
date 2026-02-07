<template>
	<div>
		<template v-if="!store.serverConfiguration?.public">
			<h2>Push Notifications</h2>
			<div>
				<button
					id="pushNotifications"
					type="button"
					class="btn"
					:disabled="
						store.pushNotificationState !== 'supported' &&
						store.pushNotificationState !== 'subscribed'
					"
					@click="onPushButtonClick"
				>
					<template v-if="store.pushNotificationState === 'subscribed'">
						Unsubscribe from push notifications
					</template>
					<template v-else-if="store.pushNotificationState === 'loading'">
						Loading…
					</template>
					<template v-else> Subscribe to push notifications </template>
				</button>
				<div v-if="store.pushNotificationState === 'nohttps'" class="error">
					<strong>Warning</strong>: Push notifications are only supported over HTTPS
					connections.
				</div>
				<div v-if="store.pushNotificationState === 'unsupported'" class="error">
					<strong>Warning</strong>:
					<span>Push notifications are not supported by your browser.</span>
				</div>
			</div>
		</template>

		<h2>Browser Notifications</h2>
		<div>
			<label class="opt">
				<input
					id="desktopNotifications"
					:checked="settingsStore.desktopNotifications"
					:disabled="store.desktopNotificationState === 'nohttps'"
					type="checkbox"
					name="desktopNotifications"
				/>
				Enable browser notifications<br />
				<div v-if="store.desktopNotificationState === 'unsupported'" class="error">
					<strong>Warning</strong>: Notifications are not supported by your browser.
				</div>
				<div
					v-if="store.desktopNotificationState === 'nohttps'"
					id="warnBlockedDesktopNotifications"
					class="error"
				>
					<strong>Warning</strong>: Notifications are only supported over HTTPS
					connections.
				</div>
				<div
					v-if="store.desktopNotificationState === 'blocked'"
					id="warnBlockedDesktopNotifications"
					class="error"
				>
					<strong>Warning</strong>: Notifications are blocked by your browser.
				</div>
			</label>
		</div>
		<div>
			<label class="opt">
				<input :checked="settingsStore.notification" type="checkbox" name="notification" />
				Enable notification sound
			</label>
		</div>
		<div>
			<div class="opt">
				<button id="play" @click.prevent="playNotification">Play sound</button>
			</div>
		</div>

		<div>
			<label class="opt">
				<input
					:checked="settingsStore.notifyAllMessages"
					type="checkbox"
					name="notifyAllMessages"
				/>
				Enable notification for all messages
			</label>
		</div>

		<div v-if="!store.serverConfiguration?.public">
			<label class="opt">
				<label for="highlights" class="opt">
					Custom highlights
					<span
						class="tooltipped tooltipped-n tooltipped-no-delay"
						aria-label="If a message contains any of these comma-separated
expressions, it will trigger a highlight."
					>
						<button class="extra-help" />
					</span>
				</label>
				<input
					id="highlights"
					:value="settingsStore.highlights"
					type="text"
					name="highlights"
					class="input"
					autocomplete="off"
					placeholder="Comma-separated, e.g.: word, some more words, anotherword"
				/>
			</label>
		</div>

		<div v-if="!store.serverConfiguration?.public">
			<label class="opt">
				<label for="highlightExceptions" class="opt">
					Highlight exceptions
					<span
						class="tooltipped tooltipped-n tooltipped-no-delay"
						aria-label="If a message contains any of these comma-separated
expressions, it will not trigger a highlight even if it contains
your nickname or expressions defined in custom highlights."
					>
						<button class="extra-help" />
					</span>
				</label>
				<input
					id="highlightExceptions"
					:value="settingsStore.highlightExceptions"
					type="text"
					name="highlightExceptions"
					class="input"
					autocomplete="off"
					placeholder="Comma-separated, e.g.: word, some more words, anotherword"
				/>
			</label>
		</div>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useMainStore} from "../../stores/main";
import {useSettingsStore} from "../../stores/settings";
import webpush from "../../js/webpush";

export default defineComponent({
	name: "NotificationSettings",
	setup() {
		const store = useMainStore();
		const settingsStore = useSettingsStore();

		const isIOS = computed(
			() =>
				[
					"iPad Simulator",
					"iPhone Simulator",
					"iPod Simulator",
					"iPad",
					"iPhone",
					"iPod",
				].includes(navigator.platform) ||
				// iPad on iOS 13 detection
				(navigator.userAgent.includes("Mac") && "ontouchend" in document)
		);

		const playNotification = () => {
			const pop = new Audio();
			pop.src = "audio/pop.wav";

			// eslint-disable-next-line
			pop.play();
		};

		const onPushButtonClick = () => {
			webpush.togglePushSubscription();
		};

		return {
			isIOS,
			store,
			settingsStore,
			playNotification,
			onPushButtonClick,
		};
	},
});
</script>
