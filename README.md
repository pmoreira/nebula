<h1 align="center">
	<img
		width="300"
		alt="Nebula"
		src="client/img/logo-vertical-transparent-bg.svg">
</h1>

<h3 align="center">
	Modern web IRC client designed for self-hosting
</h3>

<p align="center">
	<strong>
		<a href="https://nebula-chat.github.io/">Website</a>
		•
		<a href="https://nebula-chat.github.io/docs">Docs</a>
	</strong>
</p>
	<a href="https://yarn.pm/thelounge"><img
		alt="npm version"
		src="https://img.shields.io/npm/v/thelounge.svg?colorA=333a41&maxAge=3600"></a>
	<a href="https://github.com/thelounge/thelounge/actions"><img
		alt="Build Status"
		src="https://github.com/thelounge/thelounge/workflows/Build/badge.svg"></a>
</p>

<p align="center">
	<img src="https://raw.githubusercontent.com/thelounge/thelounge.github.io/master/img/thelounge-screenshot.png" width="550">
</p>

## Overview

- **Modern features brought to IRC.** Push notifications, link previews, new message markers, and more bring IRC to the 21st century.
- **Always connected.** Remains connected to IRC servers while you are offline.
- **Cross platform.** It doesn't matter what OS you use, it just works wherever Node.js runs.
- **Responsive interface.** The client works smoothly on every desktop, smartphone and tablet.
- **Synchronized experience.** Always resume where you left off no matter what device.

To learn more about configuration, usage and features of Nebula, take a look at [the website](https://nebula-chat.github.io).

The Lounge is the official and community-managed fork of [Shout](https://github.com/erming/shout), by [Mattias Erming](https://github.com/erming).

## Installation and usage

The Lounge requires latest [Node.js](https://nodejs.org/) LTS version or more recent.
The [Yarn package manager](https://yarnpkg.com/) is also recommended.
If you want to install with npm, `--unsafe-perm` is required for a correct install.

### Running stable releases

Please refer to the [install and upgrade documentation on our website](https://thelounge.chat/docs/install-and-upgrade) for all available installation methods.

### Running from source

The following commands install and run Nebula:

```sh
git clone https://github.com/<your-username>/nebula.git
cd nebula
./setup.sh
nebula start
```

⚠️ While it is the most recent codebase, ensure you run it as a non-root user.

## Development setup

Simply follow the instructions to run The Lounge from source above, on your own
fork.

Before submitting any change, make sure to:

- Read the [Contributing instructions](https://github.com/thelounge/thelounge/blob/master/.github/CONTRIBUTING.md#contributing)
- Run `yarn test` to execute linters and the test suite
  - Run `yarn format:prettier` if linting fails
- Run `yarn build:client` if you change or add anything in `client/js` or `client/components`
  - The built files will be output to `public/` by webpack
- Run `yarn build:server` if you change anything in `server/`
  - The built files will be output to `dist/` by tsc
- `yarn dev` can be used to start The Lounge with hot module reloading

To ensure that you don't commit files that fail the linting, you can install a pre-commit git hook.
Execute `yarn githooks-install` to do so.
