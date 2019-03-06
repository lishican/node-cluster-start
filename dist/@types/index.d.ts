/// <reference types="node" />
import "reflect-metadata";
import { EventEmitter } from "events";
interface Option {
    work: string;
    agent: string;
    number: number;
    restart: number;
}
declare class Manager {
    agent: any;
    setAgent(agent: any): void;
}
declare class BootStrap extends EventEmitter {
    private agent;
    private options;
    manger: Manager;
    private wokerMap;
    constructor(options: Option);
    forkNewWork(exec: any, name: any): void;
    forkWorker(): void;
    forkAgent(): void;
}
export default BootStrap;
