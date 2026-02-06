import Client from "../../client";
import Chan, { ChanType } from "../../models/chan";
import Msg, { MessageType } from "../../models/msg";
import Network from "../../models/network";
import Helper from "../../helper";

const commands = ["notify", "unnotify"];

const input = function (this: Client, network: Network, chan: Chan, cmd: string, args: string[]) {
    let target: string;

    if (args.length === 0) {
        target = "";
    } else {
        target = args.join(" ").trim();
    }

    if (cmd === "notify") {
        if (target.length === 0) {
            chan.pushMessage(
                this,
                new Msg({
                    type: MessageType.ERROR,
                    text: "Usage: /notify <nick>[!ident][@host]",
                })
            );

            return;
        }

        const hostmask = Helper.parseHostmask(target);

        if (
            network.notifyList.some(function (entry) {
                return Helper.compareHostmask(entry, hostmask);
            })
        ) {
            chan.pushMessage(
                this,
                new Msg({
                    type: MessageType.ERROR,
                    text: "The specified user/hostmask is already present in notify list",
                })
            );

            return;
        }

        network.notifyList.push({
            ...hostmask,
            when: Date.now(),
        });

        this.save();

        chan.pushMessage(
            this,
            new Msg({
                type: MessageType.MESSAGE,
                text: `\u0002${hostmask.nick}!${hostmask.ident}@${hostmask.hostname}\u000f added to notify list`,
            })
        );
    } else if (cmd === "unnotify") {
        if (target.length === 0) {
            chan.pushMessage(
                this,
                new Msg({
                    type: MessageType.ERROR,
                    text: "Usage: /unnotify <nick>[!ident][@host]",
                })
            );

            return;
        }

        const hostmask = Helper.parseHostmask(target);
        const idx = network.notifyList.findIndex(function (entry) {
            return Helper.compareHostmask(entry, hostmask);
        });

        if (idx === -1) {
            chan.pushMessage(
                this,
                new Msg({
                    type: MessageType.ERROR,
                    text: "The specified user/hostmask is not in the notify list",
                })
            );

            return;
        }

        network.notifyList.splice(idx, 1);
        this.save();

        chan.pushMessage(
            this,
            new Msg({
                type: MessageType.MESSAGE,
                text: `Successfully removed \u0002${hostmask.nick}!${hostmask.ident}@${hostmask.hostname}\u000f from notify list`,
            })
        );
    }
};

export default {
    commands,
    input,
};
