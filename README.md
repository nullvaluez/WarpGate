# Warpgate
Warpgate is an application that creates a Cloudflare WARP tunnel to toggle DNS settings for your network interface. This app is built using Electron and leverages sudo privileges to manage DNS configurations.

## Features
![WarpGate](https://github.com/nullvaluez/warpgate/blob/main/assets/images/ss.png)
- Toggle DNS settings between the system default and Cloudflare's 1.1.1.1 protocol.
- Cross-platform support for Windows and macOS.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Clone the Repository

```bash
git clone https://github.com/nullvaluez/warpgate.git
cd warpgate
```
## Install Dependencies
```bash
npm install
```
## Usage
### Running the Application
To start the application, run the following command:
```bash
npm start
```
## How It Works
1.) Preload Script (preload.js):
Exposes a secure API to the renderer process for toggling DNS settings and receiving responses.

2.) Renderer Script (script.js):
Listens for DOM content to load and sets up event listeners for the DNS toggle switch.

3.) Main Script (main.js):
Creates the main application window and sets up IPC handlers to manage DNS settings using sudo commands.

4.) Pre-Pack Script (beforePack.js)
Applies ASARMOR patch prior to output build. 
*FILE MUST BE IN "DIST" FOLDER, AKA OUTPUT FOLDER FROM ELECTRON-BUILDER*

5.) Post-Pack Script (afterPack.js)
Encrypts the bundled .asar file after the build has been completed 
*FILE MUST BE IN "DIST" FOLDER, AKA OUTPUT FOLDER FROM ELECTRON-BUILDER*

## Apply ASARMOR
To apply ASARMOR to the final distribution build, ensure afterPack.js and beforePack.js are located in /dist. If the dist folder has not yet been created, manually create the folder. 

## Package the Application
To package the application for distribution, use Electron Packager or Electron Builder. For example, using Electron Builder:
```bash
npm run dist
```
The application will now run the build process as well as apply protections to the .asar file.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
```arduino
https://github.com/nullvaluez/warpgate.git
```

