import { mount, unmount } from "svelte";
import ChatArtConfig from "./ChatArtConfig.svelte";
import { SYSTEM_ID } from "../config.ts";
import { actorChatArt, type ChatArtTransform } from "../dice/chat-art.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

const AppV2 = foundry.applications.api.ApplicationV2;

class ChatArtConfigApp extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "gl-chat-art-config",
    classes: ["gluniverse-wod", "gl-chat-art-config-app"],
    position: { width: 400, height: "auto" as const },
    window: { title: "Chat Card Art Framing", resizable: false },
  };

  _actor: any;
  _svelte: any = null;

  constructor(actor: any, options: Record<string, unknown> = {}) {
    super(options);
    this._actor = actor;
  }

  async _renderHTML(): Promise<null> { return null; }

  _replaceHTML(_result: unknown, content: HTMLElement): void {
    if (this._svelte) return;
    const target = content?.matches?.(".window-content")
      ? content
      : (content?.querySelector?.(".window-content") as HTMLElement) ?? content;
    this._svelte = mount(ChatArtConfig, {
      target,
      props: {
        actor: this._actor,
        initial: actorChatArt(this._actor),
        onsave: (value: ChatArtTransform) => this._save(value),
        oncancel: () => this.close(),
      },
    });
  }

  async _save(value: ChatArtTransform): Promise<void> {
    await this._actor.setFlag(SYSTEM_ID, "chatArt", value);
    await this.close();
  }

  async _onClose(options: unknown): Promise<void> {
    if (this._svelte) {
      unmount(this._svelte);
      this._svelte = null;
    }
    await super._onClose?.(options);
  }
}

export function openChatArtConfig(actor: any): void {
  new ChatArtConfigApp(actor).render(true);
}
