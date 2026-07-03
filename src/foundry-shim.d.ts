/**
 * Pragmatic ambient declarations for the Foundry VTT v14 client API surface we
 * use. Real, published v14 typings do not exist yet, so the Foundry globals are
 * typed loosely (mostly `any`); our own system code stays strongly typed on top.
 *
 * Replace with official/community v14 types when they are available.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const Hooks: {
  once(event: string, cb: (...args: any[]) => void): number;
  on(event: string, cb: (...args: any[]) => void): number;
  off(event: string, id: number): void;
  callAll(event: string, ...args: any[]): boolean;
  call(event: string, ...args: any[]): boolean;
};

declare const game: any;
declare const CONFIG: any;
declare const ui: any;
declare const canvas: any;

/** The v14 namespace root: foundry.abstract, foundry.applications, foundry.data, foundry.utils … */
declare const foundry: any;

declare const Actor: any;
declare const Item: any;
declare const ChatMessage: any;
declare const Roll: any;
declare const Dialog: any;
declare const Actors: any;
declare const Items: any;
declare const Handlebars: any;

declare function fromUuid(uuid: string): Promise<any>;
declare function fromUuidSync(uuid: string): any;
declare function renderTemplate(path: string, data: any): Promise<string>;
declare function loadTemplates(paths: string[] | Record<string, string>): Promise<unknown>;

interface Window {
  gluniverse?: Record<string, unknown>;
}
