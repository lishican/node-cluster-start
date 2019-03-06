import { Worker, worker } from "cluster";

class Manager {
  private workers: Map<string | number, any> = new Map();
  private agent: any = null;
  constructor() {}

  setAgent(agent: any) {
    this.agent = agent;
  }

  deleteAgent() {
    this.agent = null;
  }

  get _agent() {
    return this.agent;
  }

  getWorkerMemoryUsage() {
    let usage = [];
    this.workers.forEach(v => {
      usage.push({
        tag: v._tag,
        pid: v.process.pid,
        id: v.id,
        usage: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)
      });
    });

    return usage;
  }

  setWorkder(pid: number | string, worker: Worker) {
    this.workers.set(pid, worker);
  }
  deleteWorker(pid: number) {
    this.workers.delete(pid);
  }
  listWorkerIds() {
    return Array.from(this.workers.keys());
  }
  getListeningWorkerIds() {
    const keys = [];
    for (const id of this.workers.keys()) {
      if (this.getWorker(id).state === "listening") {
        keys.push(id);
      }
    }
    return keys;
  }
  count() {
    return {
      agent: this.agent && this.agent.status === "started" ? 1 : 0,
      worker: this.listWorkerIds().length
    };
  }

  getWorker(pid: number | string) {
    return this.workers.get(pid);
  }

  findWorlerByTag(tag: string) {
    let match = [];
    this.workers.forEach(v => {
      if (v._tag == tag) {
        match.push(v);
      }
    });

    if (match.length == 0) {
      return null;
    }
    return match;
  }
}

export default Manager;
