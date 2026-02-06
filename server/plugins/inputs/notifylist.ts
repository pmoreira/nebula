import {PluginInputHandler} from "./index";
import Msg from "../../models/msg";
import {ChanType, SpecialChanType} from "../../../shared/types/chan";
import {MessageType} from "../../../shared/types/msg";

const commands = ["notifylist"];

const input: PluginInputHandler = function (network, chan, _cmd, _args) {
	const client = this;

	if (network.notifyList.length === 0) {
		chan.pushMessage(
			client,
			new Msg({
				type: MessageType.ERROR,
				text: "Notify list is empty",
			})
		);
		return;
	}

	const chanName = "Notified users";
	const notified = network.notifyList.map((data) => ({
		hostmask: `${data.nick}!${data.ident}@${data.hostname}`,
		when: data.when,
	}));
	let newChan = network.getChannel(chanName);

	if (typeof newChan === "undefined") {
		newChan = client.createChannel({
			type: ChanType.SPECIAL,
			special: SpecialChanType.NOTIFYLIST,
			name: chanName,
			data: notified,
		});
		client.emit("join", {
			network: network.uuid,
			chan: newChan.getFilteredClone(true),
			shouldOpen: false,
			index: network.addChannel(newChan),
		});
		return;
	}

	newChan.data = notified;

	client.emit("msg:special", {
		chan: newChan.id,
		data: notified,
	});
};

export default {
	commands,
	input,
};
