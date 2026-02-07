<template>
	<button class="lt" aria-label="Toggle channel list" @click="store.toggleSidebar()" />
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {useMainStore} from "../stores/main";

export default defineComponent({
	name: "SidebarToggle",
	setup() {
		const store = useMainStore();

		return {
			store,
		};
	},
});
</script>
