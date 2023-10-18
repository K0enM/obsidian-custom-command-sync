import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { exec, } from 'child_process';

// Remember to rename these classes and interfaces!

interface PluginSettings {
    sync_command: string;
    working_directory: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
    sync_command: '',
    working_directory: ''
}

export default class CustomSyncPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        this.addRibbonIcon('refresh-ccw', 'Obsidian Custom Sync', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            new Notice('Syncing...')
            sync(this.settings.sync_command, this.settings.working_directory);
        });

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'obsidian-custom-command-sync',
            name: 'Sync',
            callback: () => {
                sync(this.settings.sync_command, this.settings.working_directory);
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingTab(this.app, this));

        console.log('obsidian-custom-command-sync loaded')
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SettingTab extends PluginSettingTab {
    plugin: CustomSyncPlugin;

    constructor(app: App, plugin: CustomSyncPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Sync command')
            .setDesc('Custom command to run when you want to sync your vault.')
            .addText(text => text
                .setPlaceholder('Enter sync command')
                .setValue(this.plugin.settings.sync_command)
                .onChange(async (value) => {
                    this.plugin.settings.sync_command = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Working directory')
            .setDesc('Working directory to run sync command in.')
            .addText(text => text
                .setPlaceholder('Enter working directory')
                .setValue(this.plugin.settings.working_directory)
                .onChange(async (value) => {
                    this.plugin.settings.working_directory = value;
                    await this.plugin.saveSettings();
                }));
    }
}

function sync(command: string, working_directory: string): void {
    const process = exec(command,
        {
            cwd: working_directory,
            encoding: 'utf-8'
        }
    );

    process.stdout?.on('data', (data) => {
        console.log('stdout: ' + data.toString())
    })

    process.stderr?.on('data', (data) => {
        console.log('stderr: ' + data.toString())
    })

    process.on('exit', (code) => {
        if (code === 0) {
            new Notice('Done syncing!');
        } else {
            new Notice('Error while syncing!')
        }
    })
}