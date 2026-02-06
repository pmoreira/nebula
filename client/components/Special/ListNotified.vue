<template>
	<table class="notify-list">
		<thead>
			<tr>
				<th class="hostmask">Hostmask</th>
				<th class="when">Notified At</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="user in channel.data" :key="user.hostmask">
				<td class="hostmask"><ParsedMessage :network="network" :text="user.hostmask" /></td>
				<td class="when">{{ localetime(user.when) }}</td>
			</tr>
		</tbody>
	</table>
</template>

<script setup lang="ts">
import ParsedMessage from "../ParsedMessage.vue";
import localetime from "../../js/helpers/localetime";
import {PropType} from "vue";
import {ClientNetwork, ClientChan} from "../../js/types";

defineProps({
	network: {type: Object as PropType<ClientNetwork>, required: true},
	channel: {type: Object as PropType<ClientChan>, required: true},
});
</script>
