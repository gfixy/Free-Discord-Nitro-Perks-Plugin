/**
 * @name FreeDiscordNitroPerks
 * @source https://raw.githubusercontent.com/Shelia666/FreeDiscordNitroPerksPlugin/main/FreeDiscordNitroPerksPlugin.js
 * @updateUrl https://raw.githubusercontent.com/Shelia666/FreeDiscordNitroPerksPlugin/main/FreeDiscordNitroPerksPlugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/
module.exports = (() => {
    const config = {
        "info": {
            "name": "FreeDiscordNitroPerksPlugin",
            "authors": [{
                "name": "Shelia666",
                "discord_id": "478119810924937226",
                "github_username": "Shelia666"
            }],
            "version": "1.0.0",
            "description": "Bedava Discord Nitro Özellikleri | Free Discord Nitro Perks",
            "github": "https://raw.githubusercontent.com/Shelia666",
            "github_raw": "https://raw.githubusercontent.com/Shelia666/FreeDiscordNitroPerksPlugin/main/FreeDiscordNitroPerksPlugin.js"
        },
        "main": "FreeDiscordNitroPerksPlugin.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                DiscordModules,
                DiscordAPI,
                Settings,
                Toasts,
                PluginUtilities
            } = Api;
            return class NitroPerks extends Plugin {
                defaultSettings = {
                    "emojiSize": "40",
                    "screenSharing": false,
                    "emojiBypass": true,
                    "clientsidePfp": false,
                    "pfpUrl": "",
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
                originalNitroStatus = 0;
                clientsidePfp;
                screenShareFix;
                getSettingsPanel() {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
                        new Settings.SettingGroup("Özellikler").append(...[
                            new Settings.Switch("Yüksek Kaliteli Ekran Paylaşımı", "Aktif Et Veya Kapat 1080p/kaynak @ 60fps Ekran Paylaşımı ", this.settings.screenSharing, value => this.settings.screenSharing = value)
                        ]),
                        new Settings.SettingGroup("Emoji").append(
                            new Settings.Switch("Nitro Emoji", "Nitrosuz Emojiyi Aç", this.settings.emojiBypass, value => this.settings.emojiBypass = value),
                            new Settings.Slider("Boyut", "Emoji Pixel Büyüklüğü. 40 Önerilir", 16, 64, this.settings.emojiSize, size=>this.settings.emojiSize = size, {markers:[16,20,32,40,64], stickToMarkers:true})
                        ),
                            new Settings.SettingGroup("Profil Fotoğrafı").append(...[
                                new Settings.Switch("Profil Resmi", "İstemci destekli profil resimlerini etkinleştirin veya devre dışı bırakın.", this.settings.clientsidePfp, value => this.settings.clientsidePfp = value),
                                new Settings.Textbox("URL", "Profil Fotoğrafı Linki.", this.settings.pfpUrl,
                                    image => {
                                        try {
                                            new URL(image)
                                        } catch {
                                            return Toasts.error('Yanlış LİNK!')
                                        }
                                        this.settings.pfpUrl = image
                                    }
                                )
                            ])
                    ])
                }
                
                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    if (!this.settings.screenSharing) {
                        switch (this.originalNitroStatus) {
                            case 1:
                                BdApi.injectCSS("screenShare", `#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(4) {
                                    display: none;
                                  }`)
                                this.screenShareFix = setInterval(()=>{
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(3)").click()
                                    clearInterval(this.screenShareFix)
                                }, 100)
                                break;
                            default: //if user doesn't have nitro?
                                BdApi.injectCSS("screenShare", `#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(4) {
                                    display: none;
                                  }
                                  #app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(3) {
                                    display: none;
                                  }
                                  #app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(2) > div > button:nth-child(3) {
                                    display: none;
                                  }`)
                                this.screenShareFix = setInterval(()=>{
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(2)").click()
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(2) > div > button:nth-child(2)").click()
                                    clearInterval(this.screenShareFix)
                                }, 100)
                            break;
                        }
                    }

                    if (this.settings.screenSharing) BdApi.clearCSS("screenShare")

                    if (this.settings.emojiBypass) {
                        //fix emotes with bad method
                        Patcher.before(DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
                            msg.validNonShortcutEmojis.forEach(emoji => {
                                if (emoji.url.startsWith("/assets/")) return;
                                msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url + `&size=${this.settings.emojiSize} `)
                            })
                        });
                        //for editing message also
                        Patcher.before(DiscordModules.MessageActions, "editMessage", (_,obj) => {
                            let msg = obj[2].content
                            if (msg.search(/\d{18}/g) == -1) return;
                            msg.match(/<a:.+?:\d{18}>|<:.+?:\d{18}>/g).forEach(idfkAnymore=>{
                                obj[2].content = obj[2].content.replace(idfkAnymore, `https://cdn.discordapp.com/emojis/${idfkAnymore.match(/\d{18}/g)[0]}?size=${this.settings.emojiSize}`)
                            })
                        });
                    }

                    if(!this.settings.emojiBypass) Patcher.unpatchAll(DiscordModules.MessageActions)

                    if (this.settings.clientsidePfp && this.settings.pfpUrl) {
                        this.clientsidePfp = setInterval(()=>{
                            document.querySelectorAll(`[src="${DiscordAPI.currentUser.discordObject.avatarURL.replace(".png", ".webp")}"]`).forEach(avatar=>{
                                avatar.src = this.settings.pfpUrl
                            })
                            document.querySelectorAll(`[src="${DiscordAPI.currentUser.discordObject.avatarURL}"]`).forEach(avatar=>{
                                avatar.src = this.settings.pfpUrl
                            })
                            document.querySelectorAll(`.avatarContainer-28iYmV.avatar-3tNQiO.avatarSmall-1PJoGO`).forEach(avatar=>{
                                if (!avatar.style.backgroundImage.includes(DiscordAPI.currentUser.discordObject.avatarURL)) return;
                                avatar.style = `background-image: url("${this.settings.pfpUrl}");`
                            })
                        }, 100)
                    }
                    if (!this.settings.clientsidePfp) this.removeClientsidePfp()
                }
                removeClientsidePfp() {
                    clearInterval(this.clientsidePfp)
                    document.querySelectorAll(`[src="${this.settings.pfpUrl}"]`).forEach(avatar=>{
                        avatar.src = DiscordAPI.currentUser.discordObject.avatarURL
                    })
                    document.querySelectorAll(`[src="${this.settings.pfpUrl}"]`).forEach(avatar=>{
                        avatar.src = DiscordAPI.currentUser.discordObject.avatarURL
                    })
                    document.querySelectorAll(`.avatarContainer-28iYmV.avatar-3tNQiO.avatarSmall-1PJoGO`).forEach(avatar=>{
                        if (!avatar.style.backgroundImage.includes(this.settings.pfpUrl)) return;
                        avatar.style = `background-image: url("${DiscordAPI.currentUser.discordObject.avatarURL}");`
                    })
                }
                onStart() {
                    this.originalNitroStatus = DiscordAPI.currentUser.discordObject.premiumType;
                    this.saveAndUpdate()
                    DiscordAPI.currentUser.discordObject.premiumType = 2
                }

                onStop() {
                    DiscordAPI.currentUser.discordObject.premiumType = this.originalNitroStatus;
                    this.removeClientsidePfp()
                    Patcher.unpatchAll();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
