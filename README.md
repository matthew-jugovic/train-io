# React + TypeScript + Vite

## Prerequisites
These tools will be required to run/install the project
- git: https://git-scm.com/downloads
- node: https://nodejs.org/en
  - _Note: Recommended to use a version manager for node such as [volta](https://docs.volta.sh/reference/install) or [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)_
- npm: 99% of tools used to install node will include npm

Verify the installation was successful for each tool by checking versions:
```
git -v
```
```
node -v
```
```
npm -v
```

## Installation

Clone the repository:
```
git clone https://github.com/matthew-jugovic/train-io.git
```
_Git clone docs: https://git-scm.com/docs/git-clone_

After cloning, a new folder, `train-io/`, will be created on your system, change to that directory from here on out: 
```
cd train-io
```

Install the packages using `npm`:
```
npm install
```
_This command looks for the `package.json` file in your current working directory and installs the dependencies listed in them_

## Running in Dev Mode
```
npm run dev
```
_This command looks in the `package.json` file for the script `dev` which is configured to start up the dev server_

At this point, the logs will show which URL the project is running at:

_Default should be: http://localhost:5173/_

