import { T as TABLE_WORKFLOW_SNAPSHOT, c as TABLE_EVALS, b as TABLE_MESSAGES, a as TABLE_THREADS, d as TABLE_TRACES } from './storage.mjs';
import { M as MastraBase } from './trace-api.mjs';
import { T as Telemetry, _ as __decorateElement, a as __runInitializers, b as __decoratorStart, I as InstrumentClass } from './chunk-C6A6W6XS.mjs';
import { c as createLogger, n as noopLogger, L as LogLevel } from './logger.mjs';

// src/storage/base.ts
var MastraStorage = class extends MastraBase {
  /** @deprecated import from { TABLE_WORKFLOW_SNAPSHOT } '@mastra/core/storage' instead */
  static TABLE_WORKFLOW_SNAPSHOT = TABLE_WORKFLOW_SNAPSHOT;
  /** @deprecated import from { TABLE_EVALS } '@mastra/core/storage' instead */
  static TABLE_EVALS = TABLE_EVALS;
  /** @deprecated import from { TABLE_MESSAGES } '@mastra/core/storage' instead */
  static TABLE_MESSAGES = TABLE_MESSAGES;
  /** @deprecated import from { TABLE_THREADS } '@mastra/core/storage' instead */
  static TABLE_THREADS = TABLE_THREADS;
  /** @deprecated import { TABLE_TRACES } from '@mastra/core/storage' instead */
  static TABLE_TRACES = TABLE_TRACES;
  hasInitialized = null;
  shouldCacheInit = true;
  constructor({ name }) {
    super({
      component: "STORAGE",
      name
    });
  }
  async __batchInsert({
    tableName,
    records
  }) {
    await this.init();
    return this.batchInsert({ tableName, records });
  }
  async __getThreadById({ threadId }) {
    await this.init();
    return this.getThreadById({ threadId });
  }
  async __getThreadsByResourceId({ resourceId }) {
    await this.init();
    return this.getThreadsByResourceId({ resourceId });
  }
  async __saveThread({ thread }) {
    await this.init();
    return this.saveThread({ thread });
  }
  async __updateThread({
    id,
    title,
    metadata
  }) {
    await this.init();
    return this.updateThread({ id, title, metadata });
  }
  async __deleteThread({ threadId }) {
    await this.init();
    return this.deleteThread({ threadId });
  }
  async __getMessages({ threadId, selectBy, threadConfig }) {
    await this.init();
    return this.getMessages({ threadId, selectBy, threadConfig });
  }
  async __saveMessages({ messages }) {
    await this.init();
    return this.saveMessages({ messages });
  }
  async __getTraces({
    scope,
    page,
    perPage,
    attributes
  }) {
    await this.init();
    return this.getTraces({ scope, page, perPage, attributes });
  }
  async init() {
    if (this.shouldCacheInit && await this.hasInitialized) {
      return;
    }
    this.hasInitialized = Promise.all([
      this.createTable({
        tableName: TABLE_WORKFLOW_SNAPSHOT,
        schema: {
          workflow_name: {
            type: "text"
          },
          run_id: {
            type: "text"
          },
          snapshot: {
            type: "text"
          },
          createdAt: {
            type: "timestamp"
          },
          updatedAt: {
            type: "timestamp"
          }
        }
      }),
      this.createTable({
        tableName: TABLE_EVALS,
        schema: {
          input: {
            type: "text"
          },
          output: {
            type: "text"
          },
          result: {
            type: "jsonb"
          },
          agent_name: {
            type: "text"
          },
          metric_name: {
            type: "text"
          },
          instructions: {
            type: "text"
          },
          test_info: {
            type: "jsonb",
            nullable: true
          },
          global_run_id: {
            type: "text"
          },
          run_id: {
            type: "text"
          },
          created_at: {
            type: "timestamp"
          }
        }
      }),
      this.createTable({
        tableName: TABLE_THREADS,
        schema: {
          id: { type: "text", nullable: false, primaryKey: true },
          resourceId: { type: "text", nullable: false },
          title: { type: "text", nullable: false },
          metadata: { type: "text", nullable: true },
          createdAt: { type: "timestamp", nullable: false },
          updatedAt: { type: "timestamp", nullable: false }
        }
      }),
      this.createTable({
        tableName: TABLE_MESSAGES,
        schema: {
          id: { type: "text", nullable: false, primaryKey: true },
          thread_id: { type: "text", nullable: false },
          content: { type: "text", nullable: false },
          role: { type: "text", nullable: false },
          type: { type: "text", nullable: false },
          createdAt: { type: "timestamp", nullable: false }
        }
      }),
      this.createTable({
        tableName: TABLE_TRACES,
        schema: {
          id: { type: "text", nullable: false, primaryKey: true },
          parentSpanId: { type: "text", nullable: true },
          name: { type: "text", nullable: false },
          traceId: { type: "text", nullable: false },
          scope: { type: "text", nullable: false },
          kind: { type: "integer", nullable: false },
          attributes: { type: "jsonb", nullable: true },
          status: { type: "jsonb", nullable: true },
          events: { type: "jsonb", nullable: true },
          links: { type: "jsonb", nullable: true },
          other: { type: "text", nullable: true },
          startTime: { type: "bigint", nullable: false },
          endTime: { type: "bigint", nullable: false },
          createdAt: { type: "timestamp", nullable: false }
        }
      })
    ]).then(() => true);
    await this.hasInitialized;
  }
  async persistWorkflowSnapshot({
    workflowName,
    runId,
    snapshot
  }) {
    await this.init();
    const data = {
      workflow_name: workflowName,
      run_id: runId,
      snapshot,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.logger.debug("Persisting workflow snapshot", { workflowName, runId, data });
    await this.insert({
      tableName: TABLE_WORKFLOW_SNAPSHOT,
      record: data
    });
  }
  async loadWorkflowSnapshot({
    workflowName,
    runId
  }) {
    if (!this.hasInitialized) {
      await this.init();
    }
    this.logger.debug("Loading workflow snapshot", { workflowName, runId });
    const d = await this.load({
      tableName: TABLE_WORKFLOW_SNAPSHOT,
      keys: { workflow_name: workflowName, run_id: runId }
    });
    return d ? d.snapshot : null;
  }
  async __getEvalsByAgentName(agentName, type) {
    await this.init();
    return this.getEvalsByAgentName(agentName, type);
  }
};

// src/storage/default-proxy-storage.ts
var DefaultProxyStorage = class extends MastraStorage {
  storage = null;
  storageConfig;
  isInitializingPromise = null;
  constructor({ config }) {
    super({ name: "DefaultStorage" });
    this.storageConfig = config;
  }
  setupStorage() {
    if (!this.isInitializingPromise) {
      this.isInitializingPromise = new Promise((resolve, reject) => {
        import('./index2.mjs').then(({ DefaultStorage }) => {
          this.storage = new DefaultStorage({ config: this.storageConfig });
          resolve();
        }).catch(reject);
      });
    }
    return this.isInitializingPromise;
  }
  async createTable({
    tableName,
    schema
  }) {
    await this.setupStorage();
    return this.storage.createTable({ tableName, schema });
  }
  async clearTable({ tableName }) {
    await this.setupStorage();
    return this.storage.clearTable({ tableName });
  }
  async insert({ tableName, record }) {
    await this.setupStorage();
    return this.storage.insert({ tableName, record });
  }
  async batchInsert({ tableName, records }) {
    await this.setupStorage();
    return this.storage.batchInsert({ tableName, records });
  }
  async load({ tableName, keys }) {
    await this.setupStorage();
    return this.storage.load({ tableName, keys });
  }
  async getThreadById({ threadId }) {
    await this.setupStorage();
    return this.storage.getThreadById({ threadId });
  }
  async getThreadsByResourceId({ resourceId }) {
    await this.setupStorage();
    return this.storage.getThreadsByResourceId({ resourceId });
  }
  async saveThread({ thread }) {
    await this.setupStorage();
    return this.storage.saveThread({ thread });
  }
  async updateThread({
    id,
    title,
    metadata
  }) {
    await this.setupStorage();
    return this.storage.updateThread({ id, title, metadata });
  }
  async deleteThread({ threadId }) {
    await this.setupStorage();
    return this.storage.deleteThread({ threadId });
  }
  async getMessages({ threadId, selectBy }) {
    await this.setupStorage();
    return this.storage.getMessages({ threadId, selectBy });
  }
  async saveMessages({ messages }) {
    await this.setupStorage();
    return this.storage.saveMessages({ messages });
  }
  async getEvalsByAgentName(agentName, type) {
    await this.setupStorage();
    return this.storage.getEvalsByAgentName(agentName, type);
  }
  async getTraces(options) {
    await this.setupStorage();
    return this.storage.getTraces(options);
  }
};

// src/mastra/index.ts
var _Mastra_decorators, _init;
_Mastra_decorators = [InstrumentClass({
  prefix: "mastra",
  excludeMethods: ["getLogger", "getTelemetry"]
})];
var Mastra = class {
  #vectors;
  #agents;
  #logger;
  #workflows;
  #tts;
  #deployer;
  #serverMiddleware = [];
  #telemetry;
  #storage;
  #memory;
  #networks;
  /**
   * @deprecated use getTelemetry() instead
   */
  get telemetry() {
    return this.#telemetry;
  }
  /**
   * @deprecated use getStorage() instead
   */
  get storage() {
    return this.#storage;
  }
  /**
   * @deprecated use getMemory() instead
   */
  get memory() {
    return this.#memory;
  }
  constructor(config) {
    if (config?.serverMiddleware) {
      this.#serverMiddleware = config.serverMiddleware.map(m => ({
        handler: m.handler,
        path: m.path || "/api/*"
      }));
    }
    let logger;
    if (config?.logger === false) {
      logger = noopLogger;
    } else {
      if (config?.logger) {
        logger = config.logger;
      } else {
        const levleOnEnv = process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.INFO;
        logger = createLogger({
          name: "Mastra",
          level: levleOnEnv
        });
      }
    }
    this.#logger = logger;
    let storage = config?.storage;
    if (!storage) {
      storage = new DefaultProxyStorage({
        config: {
          url: process.env.MASTRA_DEFAULT_STORAGE_URL || `:memory:`
        }
      });
    }
    this.#telemetry = Telemetry.init(config?.telemetry);
    if (this.#telemetry) {
      this.#storage = this.#telemetry.traceClass(storage, {
        excludeMethods: ["__setTelemetry", "__getTelemetry"]
      });
      this.#storage.__setTelemetry(this.#telemetry);
    } else {
      this.#storage = storage;
    }
    if (config?.vectors) {
      let vectors = {};
      Object.entries(config.vectors).forEach(([key, vector]) => {
        if (this.#telemetry) {
          vectors[key] = this.#telemetry.traceClass(vector, {
            excludeMethods: ["__setTelemetry", "__getTelemetry"]
          });
          vectors[key].__setTelemetry(this.#telemetry);
        } else {
          vectors[key] = vector;
        }
      });
      this.#vectors = vectors;
    }
    if (config?.vectors) {
      this.#vectors = config.vectors;
    }
    if (config?.memory) {
      this.#memory = config.memory;
      if (this.#telemetry) {
        this.#memory = this.#telemetry.traceClass(config.memory, {
          excludeMethods: ["__setTelemetry", "__getTelemetry"]
        });
        this.#memory.__setTelemetry(this.#telemetry);
      }
    }
    if (config && `memory` in config) {
      this.#logger.warn(`
  Memory should be added to Agents, not to Mastra.

Instead of:
  new Mastra({ memory: new Memory() })

do:
  new Agent({ memory: new Memory() })

This is a warning for now, but will throw an error in the future
`);
    }
    if (config?.tts) {
      this.#tts = config.tts;
      Object.entries(this.#tts).forEach(([key, ttsCl]) => {
        if (this.#tts?.[key]) {
          if (this.#telemetry) {
            this.#tts[key] = this.#telemetry.traceClass(ttsCl, {
              excludeMethods: ["__setTelemetry", "__getTelemetry"]
            });
            this.#tts[key].__setTelemetry(this.#telemetry);
          }
        }
      });
    }
    const agents = {};
    if (config?.agents) {
      Object.entries(config.agents).forEach(([key, agent]) => {
        if (agents[key]) {
          throw new Error(`Agent with name ID:${key} already exists`);
        }
        agent.__registerPrimitives({
          logger: this.getLogger(),
          telemetry: this.#telemetry,
          storage: this.storage,
          memory: this.memory,
          agents,
          tts: this.#tts,
          vectors: this.#vectors
        });
        agent.__registerMastra(this);
        agents[key] = agent;
      });
    }
    this.#agents = agents;
    this.#networks = {};
    if (config?.networks) {
      Object.entries(config.networks).forEach(([key, network]) => {
        network.__registerMastra(this);
        this.#networks[key] = network;
      });
    }
    this.#workflows = {};
    if (config?.workflows) {
      Object.entries(config.workflows).forEach(([key, workflow]) => {
        workflow.__registerMastra(this);
        workflow.__registerPrimitives({
          logger: this.getLogger(),
          telemetry: this.#telemetry,
          storage: this.storage,
          memory: this.memory,
          agents,
          tts: this.#tts,
          vectors: this.#vectors
        });
        this.#workflows[key] = workflow;
      });
    }
    this.setLogger({
      logger
    });
  }
  getAgent(name) {
    const agent = this.#agents?.[name];
    if (!agent) {
      throw new Error(`Agent with name ${String(name)} not found`);
    }
    return this.#agents[name];
  }
  getAgents() {
    return this.#agents;
  }
  getVector(name) {
    const vector = this.#vectors?.[name];
    if (!vector) {
      throw new Error(`Vector with name ${String(name)} not found`);
    }
    return vector;
  }
  getVectors() {
    return this.#vectors;
  }
  getDeployer() {
    return this.#deployer;
  }
  getWorkflow(id, {
    serialized
  } = {}) {
    const workflow = this.#workflows?.[id];
    if (!workflow) {
      throw new Error(`Workflow with ID ${String(id)} not found`);
    }
    if (serialized) {
      return {
        name: workflow.name
      };
    }
    return workflow;
  }
  getWorkflows(props = {}) {
    if (props.serialized) {
      return Object.entries(this.#workflows).reduce((acc, [k, v]) => {
        return {
          ...acc,
          [k]: {
            name: v.name
          }
        };
      }, {});
    }
    return this.#workflows;
  }
  setStorage(storage) {
    this.#storage = storage;
  }
  setLogger({
    logger
  }) {
    this.#logger = logger;
    if (this.#agents) {
      Object.keys(this.#agents).forEach(key => {
        this.#agents?.[key]?.__setLogger(this.#logger);
      });
    }
    if (this.#memory) {
      this.#memory.__setLogger(this.#logger);
    }
    if (this.#deployer) {
      this.#deployer.__setLogger(this.#logger);
    }
    if (this.#tts) {
      Object.keys(this.#tts).forEach(key => {
        this.#tts?.[key]?.__setLogger(this.#logger);
      });
    }
    if (this.#storage) {
      this.#storage.__setLogger(this.#logger);
    }
    if (this.#vectors) {
      Object.keys(this.#vectors).forEach(key => {
        this.#vectors?.[key]?.__setLogger(this.#logger);
      });
    }
  }
  setTelemetry(telemetry) {
    this.#telemetry = Telemetry.init(telemetry);
    if (this.#agents) {
      Object.keys(this.#agents).forEach(key => {
        if (this.#telemetry) {
          this.#agents?.[key]?.__setTelemetry(this.#telemetry);
        }
      });
    }
    if (this.#memory) {
      this.#memory = this.#telemetry.traceClass(this.#memory, {
        excludeMethods: ["__setTelemetry", "__getTelemetry"]
      });
      this.#memory.__setTelemetry(this.#telemetry);
    }
    if (this.#deployer) {
      this.#deployer = this.#telemetry.traceClass(this.#deployer, {
        excludeMethods: ["__setTelemetry", "__getTelemetry"]
      });
      this.#deployer.__setTelemetry(this.#telemetry);
    }
    if (this.#tts) {
      let tts = {};
      Object.entries(this.#tts).forEach(([key, ttsCl]) => {
        if (this.#telemetry) {
          tts[key] = this.#telemetry.traceClass(ttsCl, {
            excludeMethods: ["__setTelemetry", "__getTelemetry"]
          });
          tts[key].__setTelemetry(this.#telemetry);
        }
      });
      this.#tts = tts;
    }
    if (this.#storage) {
      this.#storage = this.#telemetry.traceClass(this.#storage, {
        excludeMethods: ["__setTelemetry", "__getTelemetry"]
      });
      this.#storage.__setTelemetry(this.#telemetry);
    }
    if (this.#vectors) {
      let vectors = {};
      Object.entries(this.#vectors).forEach(([key, vector]) => {
        if (this.#telemetry) {
          vectors[key] = this.#telemetry.traceClass(vector, {
            excludeMethods: ["__setTelemetry", "__getTelemetry"]
          });
          vectors[key].__setTelemetry(this.#telemetry);
        }
      });
      this.#vectors = vectors;
    }
  }
  getTTS() {
    return this.#tts;
  }
  getLogger() {
    return this.#logger;
  }
  getTelemetry() {
    return this.#telemetry;
  }
  getMemory() {
    return this.#memory;
  }
  getStorage() {
    return this.#storage;
  }
  getServerMiddleware() {
    return this.#serverMiddleware;
  }
  getNetworks() {
    return Object.values(this.#networks || {});
  }
  /**
   * Get a specific network by ID
   * @param networkId - The ID of the network to retrieve
   * @returns The network with the specified ID, or undefined if not found
   */
  getNetwork(networkId) {
    const networks = this.getNetworks();
    return networks.find(network => {
      const routingAgent = network.getRoutingAgent();
      return network.formatAgentId(routingAgent.name) === networkId;
    });
  }
  async getLogsByRunId({
    runId,
    transportId
  }) {
    if (!transportId) {
      throw new Error("Transport ID is required");
    }
    return await this.#logger.getLogsByRunId({
      runId,
      transportId
    });
  }
  async getLogs(transportId) {
    if (!transportId) {
      throw new Error("Transport ID is required");
    }
    return await this.#logger.getLogs(transportId);
  }
};
Mastra = /*@__PURE__*/(_ => {
  _init = __decoratorStart(null);
  Mastra = __decorateElement(_init, 0, "Mastra", _Mastra_decorators, Mastra);
  __runInitializers(_init, 1, Mastra);
  return Mastra;
})();

export { MastraStorage as M, Mastra as a };
