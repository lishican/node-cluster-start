/// <reference types="node" />
import "reflect-metadata";
import { EventEmitter } from "events";
interface Option {
    work: string;
    common?: string;
    agent: string;
    number: number;
    restart: number;
}
declare class BootStrap extends EventEmitter {
    private agent;
    private options;
    private manger;
    private limit;
    private isClosed;
    private isStarting;
    private log;
    constructor(options: Option);
    send(from: string, to: string, msg: string, tag?: string): void;
    sendToCluster(tag: string, msg: any, from: string): void;
    sentToAgent(msg: any, from: string): void;
    killApp(): void;
    onMasterExit(): void;
    onSignal(): void;
    newWorker(execFile: any, name: any): void;
    isCanClustefork(): boolean;
    forkWorkerApp(): void;
    forkAgentApp(): void;
}
export default BootStrap;
