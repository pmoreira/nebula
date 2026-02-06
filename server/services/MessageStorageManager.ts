import _ from "lodash";
import log from "../log";
import Config from "../config";
import SqliteMessageStorage from "../plugins/messageStorage/sqlite";
import TextFileMessageStorage from "../plugins/messageStorage/text";
import {StorageCleaner} from "../storageCleaner";
import {MessageStorage} from "../plugins/messageStorage/types";
import {SearchQuery, SearchResponse} from "../../shared/types/storage";
import Network from "../models/network";
import Chan from "../models/chan";
import type Client from "../client";

export default class MessageStorageManager {
	private client: Client;
	public messageStorage: MessageStorage[] = [];
	public messageProvider?: SqliteMessageStorage;

	constructor(client: Client) {
		this.client = client;

		// Initialize storage slightly later or assume client name is ready?
		// Client name is passed in constructor or set immediately after.
		// Client constructor calls this, but name is passed to Client constructor.
	}

	init() {
		const client = this.client;

		if (!Config.values.public && client.config.log) {
			if (Config.values.messageStorage.includes("sqlite")) {
				this.messageProvider = new SqliteMessageStorage(client.name);

				if (Config.values.storagePolicy.enabled) {
					log.info(
						`Activating storage cleaner. Policy: ${Config.values.storagePolicy.deletionPolicy}. MaxAge: ${Config.values.storagePolicy.maxAgeDays} days`
					);
					const cleaner = new StorageCleaner(this.messageProvider);
					cleaner.start();
				}

				this.messageStorage.push(this.messageProvider);
			}

			if (Config.values.messageStorage.includes("text")) {
				this.messageStorage.push(new TextFileMessageStorage(client.name));
			}

			for (const messageStorage of this.messageStorage) {
				messageStorage.enable().catch((e) => log.error(e));
			}
		}

		client.config.clientSettings.searchEnabled = this.messageProvider !== undefined;
	}

	async search(query: SearchQuery): Promise<SearchResponse> {
		if (!this.messageProvider?.isEnabled) {
			return {
				...query,
				results: [],
			};
		}

		return this.messageProvider.search(query);
	}

	deleteChannel(network: Network, chan: Chan) {
		for (const messageStorage of this.messageStorage) {
			messageStorage.deleteChannel(network, chan).catch((e) => log.error(e));
		}
	}

	close() {
		for (const messageStorage of this.messageStorage) {
			messageStorage.close().catch((e) => log.error(e));
		}
	}
}
