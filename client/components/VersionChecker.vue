<template>
	<div id="version-checker" :class="[store.versionStatus]">
		<p v-if="store.versionStatus === 'loading'">Checking for updates…</p>
		<p v-if="store.versionStatus === 'new-version'">
			Nebula <b>{{ store.versionData?.latest?.version }}</b>
			<template v-if="store.versionData?.latest?.prerelease"> (pre-release) </template>
			is now available.
			<br />

			<a :href="store.versionData?.latest?.url" target="_blank" rel="noopener">
				Read more on GitHub
			</a>
		</p>
		<p v-if="store.versionStatus === 'new-packages'">
			The Lounge is up to date, but there are out of date packages Run
			<code>thelounge upgrade</code> on the server to upgrade packages.
		</p>
		<template v-if="store.versionStatus === 'up-to-date'">
			<p>The Lounge is up to date!</p>

			<button
				v-if="store.versionDataExpired"
				id="check-now"
				class="btn btn-small"
				@click="checkNow"
			>
				Check now
			</button>
		</template>
		<template v-if="store.versionStatus === 'error'">
			<p>Information about latest release could not be retrieved.</p>

			<button id="check-now" class="btn btn-small" @click="checkNow">Try again</button>
		</template>
	</div>
</template>

<script lang="ts">
import {defineComponent, onMounted} from "vue";
import socket from "../js/socket";
import {useMainStore} from "../stores/main";

export default defineComponent({
	name: "VersionChecker",
	setup() {
		const store = useMainStore();

		const checkNow = () => {
			store.setVersionData(null);
			store.setVersionStatus("loading");
			socket.emit("changelog");
		};

		onMounted(() => {
			if (!store.versionData) {
				checkNow();
			}
		});

		return {
			store,
			checkNow,
		};
	},
});
</script>
