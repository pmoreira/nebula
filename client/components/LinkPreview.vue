<template>
	<div
		v-if="link.shown"
		v-show="link.sourceLoaded || link.type === 'link'"
		ref="container"
		class="preview"
		dir="ltr"
	>
		<div
			ref="content"
			:class="['toggle-content', 'toggle-type-' + link.type, {opened: isContentShown}]"
		>
			<template v-if="link.type === 'link'">
				<a
					v-if="link.thumb"
					v-show="link.sourceLoaded"
					:href="link.link"
					class="toggle-thumbnail"
					target="_blank"
					rel="noopener"
					@click="onThumbnailClick"
				>
					<img
						:src="link.thumb"
						decoding="async"
						alt=""
						class="thumb"
						@error="onThumbnailError"
						@abort="onThumbnailError"
						@load="onPreviewReady"
					/>
				</a>
				<div class="toggle-text" dir="auto">
					<div class="head">
						<div class="overflowable">
							<a
								:href="link.link"
								:title="link.head"
								target="_blank"
								rel="noopener"
								>{{ link.head }}</a
							>
						</div>

						<button
							v-if="showMoreButton"
							:aria-expanded="isContentShown"
							:aria-label="moreButtonLabel"
							dir="auto"
							class="more"
							@click="onMoreClick"
						>
							<span class="more-caret" />
						</button>
					</div>

					<div class="body overflowable">
						<a :href="link.link" :title="link.body" target="_blank" rel="noopener">{{
							link.body
						}}</a>
					</div>
				</div>
			</template>
			<template v-else-if="link.type === 'image'">
				<a
					:href="link.link"
					class="toggle-thumbnail"
					target="_blank"
					rel="noopener"
					@click="onThumbnailClick"
				>
					<img
						v-show="link.sourceLoaded"
						:src="link.thumb"
						decoding="async"
						alt=""
						@load="onPreviewReady"
					/>
				</a>
			</template>
			<template v-else-if="link.type === 'video'">
				<video
					v-show="link.sourceLoaded"
					preload="metadata"
					controls
					@canplay="onPreviewReady"
				>
					<source :src="link.media" :type="link.mediaType" />
				</video>
			</template>
			<template v-else-if="link.type === 'audio'">
				<audio
					v-show="link.sourceLoaded"
					controls
					preload="metadata"
					@canplay="onPreviewReady"
				>
					<source :src="link.media" :type="link.mediaType" />
				</audio>
			</template>
			<template v-else-if="link.type === 'error'">
				<em v-if="link.error === 'image-too-big'">
					This image is larger than {{ imageMaxSize }} and cannot be previewed.
					<a :href="link.link" target="_blank" rel="noopener">Click here</a>
					to open it in a new window.
				</em>
				<template v-else-if="link.error === 'message'">
					<div>
						<em>
							A preview could not be loaded.
							<a :href="link.link" target="_blank" rel="noopener">Click here</a>
							to open it in a new window.
						</em>
						<br />
						<pre class="prefetch-error">{{ link.message }}</pre>
					</div>

					<button
						:aria-expanded="isContentShown"
						:aria-label="moreButtonLabel"
						class="more"
						@click="onMoreClick"
					>
						<span class="more-caret" />
					</button>
				</template>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import {computed, inject, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch} from "vue";
import type {PropType} from "vue";
import {onBeforeRouteUpdate} from "vue-router";
import eventbus from "../js/eventbus";
import friendlysize from "../js/helpers/friendlysize";
import type {ClientChan, ClientLinkPreview} from "../js/types";
import {imageViewerKey} from "../js/injectionKeys";
import {useMainStore} from "../stores/main";
import {useSettingsStore} from "../stores/settings";

const props = defineProps({
	link: {
		type: Object as PropType<ClientLinkPreview>,
		required: true,
	},
	keepScrollPosition: {
		type: Function as PropType<() => void>,
		required: true,
	},
	channel: {type: Object as PropType<ClientChan>, required: true},
});

const store = useMainStore();
const settingsStore = useSettingsStore();

const showMoreButton = ref(false);
const isContentShown = ref(false);
const imageViewer = inject(imageViewerKey);

onBeforeRouteUpdate((to, from, next) => {
	// cancel the navigation if the user is trying to close the image viewer
	if (imageViewer?.value?.link) {
		imageViewer.value.closeViewer();
		return next(false);
	}

	next();
});

const content = ref<HTMLDivElement | null>(null);
const container = ref<HTMLDivElement | null>(null);

const moreButtonLabel = computed(() => {
	return isContentShown.value ? "Less" : "More";
});

const imageMaxSize = computed(() => {
	if (!props.link.maxSize) {
		return;
	}

	return friendlysize(props.link.maxSize);
});

const handleResize = () => {
	nextTick(() => {
		if (!content.value || !container.value) {
			return;
		}

		showMoreButton.value = content.value.offsetWidth >= container.value.offsetWidth;
	}).catch((e) => {
		// eslint-disable-next-line no-console
		console.error("Error in LinkPreview.handleResize", e);
	});
};

const onPreviewReady = () => {
	props.link.sourceLoaded = true;
	props.keepScrollPosition();

	if (props.link.type === "link") {
		handleResize();
	}
};

const onPreviewUpdate = () => {
	if (props.link.type === "loading") {
		return;
	}

	if (props.link.type === "error") {
		onPreviewReady();
	}

	if (props.link.type === "link") {
		handleResize();
		props.keepScrollPosition();
	}
};

const onThumbnailError = () => {
	props.link.thumb = "";
	onPreviewReady();
};

const onThumbnailClick = (e: MouseEvent) => {
	e.preventDefault();

	if (!imageViewer?.value) {
		return;
	}

	imageViewer.value.channel = props.channel;
	imageViewer.value.link = props.link;
};

const onMoreClick = () => {
	isContentShown.value = !isContentShown.value;
	props.keepScrollPosition();
};

const updateShownState = () => {
	if (props.link.shown !== null) {
		return;
	}

	let defaultState = false;

	switch (props.link.type) {
		case "error":
			if (props.link.error === "image-too-big") {
				defaultState = settingsStore.media;
			}
			break;

		case "link":
			defaultState = settingsStore.links;
			break;
		default:
			defaultState = settingsStore.media;
	}

	props.link.shown = defaultState;
};

updateShownState();

watch(
	() => props.link.type,
	() => {
		updateShownState();
		onPreviewUpdate();
	}
);

onMounted(() => {
	eventbus.on("resize", handleResize);
	onPreviewUpdate();
});

onBeforeUnmount(() => {
	eventbus.off("resize", handleResize);
});

onUnmounted(() => {
	props.link.sourceLoaded = false;
});
</script>

<script lang="ts">
export default {
	name: "LinkPreview",
};
</script>
