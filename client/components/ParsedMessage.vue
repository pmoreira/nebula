<script lang="ts">
import {h} from "vue";
import parse from "../js/helpers/parse";
import type {ClientMessage, ClientNetwork} from "../js/types";

const ParsedMessage = (props: {
	text?: string;
	message?: ClientMessage | string;
	network?: ClientNetwork;
}) => {
	return parse(
		typeof props.text !== "undefined" ? props.text : (props.message as any).text,
		props.message as any,
		props.network
	);
};

ParsedMessage.props = ["text", "message", "network"];

export default ParsedMessage;
</script>
