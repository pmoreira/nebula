import {SharedChan} from "./chan";

export type SharedPrefixObject = {
	symbol: string;
	mode: string;
};

export type SharedNetworkChan = SharedChan & {
	totalMessages: number;
};

export type SharedPrefix = {
	prefix: SharedPrefixObject[];
	modeToSymbol: {[mode: string]: string};
	symbols: string[];
};

export type SharedServerOptions = {
	CHANTYPES: string[];
	PREFIX: SharedPrefix;
	NETWORK: string;
};

export type SharedNetworkStatus = {
	connected: boolean;
	secure: boolean;
};

export type SharedNetwork = {
	uuid: string;
	name: string;
	host: string;
	port: number;
	tls: boolean;
	rejectUnauthorized: boolean;
	password?: string;
	nick: string;
	username: string;
	realname: string;
	leaveMessage: string;
	sasl: string;
	saslAccount?: string;
	saslPassword?: string;
	commands: string[];
	proxyEnabled: boolean;
	proxyHost: string;
	proxyPort: number;
	proxyUsername?: string;
	proxyPassword?: string;
	hasSTSPolicy?: boolean;
	useHexIp?: boolean;
	serverOptions: SharedServerOptions;
	status: SharedNetworkStatus;
	channels: SharedNetworkChan[];
};
