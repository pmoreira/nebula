import _ from "lodash";
import colors from "chalk";
import log from "../log";
import Chan, {ChanConfig} from "../models/chan";
import Msg from "../models/msg";
import Config from "../config";
import Network, {IgnoreListItem, NetworkConfig, NetworkWithIrcFramework} from "../models/network";
import {ChanType, SharedChan} from "../../shared/types/chan";
import {SharedNetwork} from "../../shared/types/network";
import type Client from "../client";

const events = [
	"away",
	"cap",
	"connection",
	"unhandled",
	"ctcp",
	"chghost",
	"error",
	"help",
	"info",
	"invite",
	"join",
	"kick",
	"list",
	"mode",
	"modelist",
	"motd",
	"message",
	"names",
	"nick",
	"part",
	"quit",
	"sasl",
	"topic",
	"welcome",
	"whois",
];

export default class NetworkManager {
	private client: Client;
	public networks: Network[] = [];

	constructor(client: Client) {
		this.client = client;
	}

	init(networks: Network[]) {
		this.networks = networks;
	}

	validateNetworkConfig(args: Record<string, any>): Network {
		const client = this.client;
		let channels: Chan[] = [];

		if (Array.isArray(args.channels)) {
			let badChanConf = false;

			args.channels.forEach((chan: ChanConfig) => {
				const type = ChanType[(chan.type || "channel").toUpperCase()];

				if (!chan.name || !type) {
					badChanConf = true;
					return;
				}

				channels.push(
					client.createChannel({
						name: chan.name,
						key: chan.key || "",
						type: type,
						muted: chan.muted,
					})
				);
			});

			if (badChanConf && client.name) {
				log.warn(
					"User '" +
						client.name +
						"' on network '" +
						String(args.name) +
						"' has an invalid channel which has been ignored"
				);
			}
		} else if (args.join) {
			channels = args.join
				.replace(/,/g, " ")
				.split(/\s+/g)
				.map((chan: string) => {
					if (!chan.match(/^[#&!+]/)) {
						chan = `#${chan}`;
					}

					return client.createChannel({
						name: chan,
					});
				});
		}

		return new Network({
			uuid: args.uuid,
			name: String(
				args.name || (Config.values.lockNetwork ? Config.values.defaults.name : "") || ""
			),
			host: String(args.host || ""),
			port: parseInt(String(args.port), 10),
			tls: !!args.tls,
			userDisconnected: !!args.userDisconnected,
			rejectUnauthorized: !!args.rejectUnauthorized,
			password: String(args.password || ""),
			nick: String(args.nick || ""),
			username: String(args.username || ""),
			realname: String(args.realname || ""),
			leaveMessage: String(args.leaveMessage || ""),
			sasl: String(args.sasl || ""),
			saslAccount: String(args.saslAccount || ""),
			saslPassword: String(args.saslPassword || ""),
			commands: (args.commands as string[]) || [],
			channels: channels,
			ignoreList: args.ignoreList ? (args.ignoreList as IgnoreListItem[]) : [],

			proxyEnabled: !!args.proxyEnabled,
			proxyHost: String(args.proxyHost || ""),
			proxyPort: parseInt(args.proxyPort, 10),
			proxyUsername: String(args.proxyUsername || ""),
			proxyPassword: String(args.proxyPassword || ""),
		});
	}

	connectToNetwork(args: Record<string, any>, isStartup = false) {
		const client = this.client;

		// Get channel id for lobby before creating other channels for nicer ids
		const lobbyChannelId = client.idChan++;

		const network = this.validateNetworkConfig(args);

		// Set network lobby channel id
		network.getLobby().id = lobbyChannelId;

		this.networks.push(network);
		client.emit("network", {
			network: network.getFilteredClone(client.lastActiveChannel, -1),
		});

		if (!network.validate(client)) {
			return;
		}

		(network as NetworkWithIrcFramework).createIrcFramework(client);

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		events.forEach(async (plugin) => {
			(await import(`../plugins/irc-events/${plugin}`)).default.apply(client, [
				network.irc,
				network,
			]);
		});

		if (network.userDisconnected) {
			network.getLobby().pushMessage(
				client,
				new Msg({
					text: "You have manually disconnected from this network before, use the /connect command to connect again.",
				}),
				true
			);
		} else if (!isStartup) {
			network.irc!.connect();
		}

		if (!isStartup) {
			client.save();
			network.channels.forEach((channel) => channel.loadMessages(client, network));
		}
	}

	find(channelId: number) {
		let network: Network | null = null;
		let chan: Chan | null | undefined = null;

		for (const n of this.networks) {
			chan = _.find(n.channels, {id: channelId});

			if (chan) {
				network = n;
				break;
			}
		}

		if (network && chan) {
			return {network, chan};
		}

		return false;
	}

	findNetwork(uuid: string) {
		return _.find(this.networks, {uuid});
	}

	sortNetworks(order: SharedNetwork["uuid"][]) {
		this.networks.sort((a, b) => order.indexOf(a.uuid) - order.indexOf(b.uuid));
		this.client.save();
		// Sync order to connected clients
		this.client.emit("sync_sort:networks", {
			order: this.networks.map((obj) => obj.uuid),
		});
	}

	sortChannels(netid: SharedNetwork["uuid"], order: SharedChan["id"][]) {
		const network = this.findNetwork(netid);

		if (!network) {
			return;
		}

		network.channels.sort((a, b) => {
			if (a.type === ChanType.LOBBY) {
				return -1;
			} else if (b.type === ChanType.LOBBY) {
				return 1;
			}

			return order.indexOf(a.id) - order.indexOf(b.id);
		});
		this.client.save();
		// Sync order to connected clients
		this.client.emit("sync_sort:channels", {
			network: network.uuid,
			order: network.channels.map((obj) => obj.id),
		});
	}

	quit() {
		this.networks.forEach((network) => {
			network.quit();
			network.destroy();
		});
	}
}
