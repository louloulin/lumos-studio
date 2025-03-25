import { T as Tool } from './tools.mjs';
import { createHash } from 'crypto';
import { l as lib } from './_virtual__virtual-zod.mjs';

const parseAnyOf = (schema, refs) => {
    return schema.anyOf.length
        ? schema.anyOf.length === 1
            ? parseSchema(schema.anyOf[0], {
                ...refs,
                path: [...refs.path, "anyOf", 0],
            })
            : `z.union([${schema.anyOf
                .map((schema, i) => parseSchema(schema, { ...refs, path: [...refs.path, "anyOf", i] }))
                .join(", ")}])`
        : `z.any()`;
};

const parseBoolean = (_schema) => {
    return "z.boolean()";
};

const parseDefault = (_schema) => {
    return "z.any()";
};

const parseMultipleType = (schema, refs) => {
    return `z.union([${schema.type
        .map((type) => parseSchema({ ...schema, type }, refs))
        .join(", ")}])`;
};

const parseNot = (schema, refs) => {
    return `z.any().refine((value) => !${parseSchema(schema.not, {
        ...refs,
        path: [...refs.path, "not"],
    })}.safeParse(value).success, "Invalid input: Should NOT be valid against schema")`;
};

const parseNull = (_schema) => {
    return "z.null()";
};

const half = (arr) => {
    return [arr.slice(0, arr.length / 2), arr.slice(arr.length / 2)];
};

const originalIndex = Symbol("Original index");
const ensureOriginalIndex = (arr) => {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (typeof item === "boolean") {
            newArr.push(item ? { [originalIndex]: i } : { [originalIndex]: i, not: {} });
        }
        else if (originalIndex in item) {
            return arr;
        }
        else {
            newArr.push({ ...item, [originalIndex]: i });
        }
    }
    return newArr;
};
function parseAllOf(schema, refs) {
    if (schema.allOf.length === 0) {
        return "z.never()";
    }
    else if (schema.allOf.length === 1) {
        const item = schema.allOf[0];
        return parseSchema(item, {
            ...refs,
            path: [...refs.path, "allOf", item[originalIndex]],
        });
    }
    else {
        const [left, right] = half(ensureOriginalIndex(schema.allOf));
        return `z.intersection(${parseAllOf({ allOf: left }, refs)}, ${parseAllOf({
            allOf: right,
        }, refs)})`;
    }
}

function withMessage(schema, key, get) {
    const value = schema[key];
    let r = "";
    if (value !== undefined) {
        const got = get({ value, json: JSON.stringify(value) });
        if (got) {
            const opener = got[0];
            const prefix = got.length === 3 ? got[1] : "";
            const closer = got.length === 3 ? got[2] : got[1];
            r += opener;
            if (schema.errorMessage?.[key] !== undefined) {
                r += prefix + JSON.stringify(schema.errorMessage[key]);
            }
            r += closer;
        }
    }
    return r;
}

const parseArray = (schema, refs) => {
    if (Array.isArray(schema.items)) {
        return `z.tuple([${schema.items.map((v, i) => parseSchema(v, { ...refs, path: [...refs.path, "items", i] }))}])`;
    }
    let r = !schema.items
        ? "z.array(z.any())"
        : `z.array(${parseSchema(schema.items, {
            ...refs,
            path: [...refs.path, "items"],
        })})`;
    r += withMessage(schema, "minItems", ({ json }) => [
        `.min(${json}`,
        ", ",
        ")",
    ]);
    r += withMessage(schema, "maxItems", ({ json }) => [
        `.max(${json}`,
        ", ",
        ")",
    ]);
    return r;
};

const parseConst = (schema) => {
    return `z.literal(${JSON.stringify(schema.const)})`;
};

const parseEnum = (schema) => {
    if (schema.enum.length === 0) {
        return "z.never()";
    }
    else if (schema.enum.length === 1) {
        // union does not work when there is only one element
        return `z.literal(${JSON.stringify(schema.enum[0])})`;
    }
    else if (schema.enum.every((x) => typeof x === "string")) {
        return `z.enum([${schema.enum.map((x) => JSON.stringify(x))}])`;
    }
    else {
        return `z.union([${schema.enum
            .map((x) => `z.literal(${JSON.stringify(x)})`)
            .join(", ")}])`;
    }
};

const parseIfThenElse = (schema, refs) => {
    const $if = parseSchema(schema.if, { ...refs, path: [...refs.path, "if"] });
    const $then = parseSchema(schema.then, {
        ...refs,
        path: [...refs.path, "then"],
    });
    const $else = parseSchema(schema.else, {
        ...refs,
        path: [...refs.path, "else"],
    });
    return `z.union([${$then}, ${$else}]).superRefine((value,ctx) => {
  const result = ${$if}.safeParse(value).success
    ? ${$then}.safeParse(value)
    : ${$else}.safeParse(value);
  if (!result.success) {
    result.error.errors.forEach((error) => ctx.addIssue(error))
  }
})`;
};

const parseNumber = (schema) => {
    let r = "z.number()";
    if (schema.type === "integer") {
        r += withMessage(schema, "type", () => [".int(", ")"]);
    }
    else {
        r += withMessage(schema, "format", ({ value }) => {
            if (value === "int64") {
                return [".int(", ")"];
            }
        });
    }
    r += withMessage(schema, "multipleOf", ({ value, json }) => {
        if (value === 1) {
            if (r.startsWith("z.number().int(")) {
                return;
            }
            return [".int(", ")"];
        }
        return [`.multipleOf(${json}`, ", ", ")"];
    });
    if (typeof schema.minimum === "number") {
        if (schema.exclusiveMinimum === true) {
            r += withMessage(schema, "minimum", ({ json }) => [
                `.gt(${json}`,
                ", ",
                ")",
            ]);
        }
        else {
            r += withMessage(schema, "minimum", ({ json }) => [
                `.gte(${json}`,
                ", ",
                ")",
            ]);
        }
    }
    else if (typeof schema.exclusiveMinimum === "number") {
        r += withMessage(schema, "exclusiveMinimum", ({ json }) => [
            `.gt(${json}`,
            ", ",
            ")",
        ]);
    }
    if (typeof schema.maximum === "number") {
        if (schema.exclusiveMaximum === true) {
            r += withMessage(schema, "maximum", ({ json }) => [
                `.lt(${json}`,
                ", ",
                ")",
            ]);
        }
        else {
            r += withMessage(schema, "maximum", ({ json }) => [
                `.lte(${json}`,
                ", ",
                ")",
            ]);
        }
    }
    else if (typeof schema.exclusiveMaximum === "number") {
        r += withMessage(schema, "exclusiveMaximum", ({ json }) => [
            `.lt(${json}`,
            ", ",
            ")",
        ]);
    }
    return r;
};

const parseOneOf = (schema, refs) => {
    return schema.oneOf.length
        ? schema.oneOf.length === 1
            ? parseSchema(schema.oneOf[0], {
                ...refs,
                path: [...refs.path, "oneOf", 0],
            })
            : `z.any().superRefine((x, ctx) => {
    const schemas = [${schema.oneOf
                .map((schema, i) => parseSchema(schema, {
                ...refs,
                path: [...refs.path, "oneOf", i],
            }))
                .join(", ")}];
    const errors = schemas.reduce<z.ZodError[]>(
      (errors, schema) =>
        ((result) =>
          result.error ? [...errors, result.error] : errors)(
          schema.safeParse(x),
        ),
      [],
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
  })`
        : "z.any()";
};

const expandJsdocs = (jsdocs) => {
    const lines = jsdocs.split("\n");
    const result = lines.length === 1
        ? lines[0]
        : `\n${lines.map(x => `* ${x}`)
            .join("\n")}\n`;
    return `/**${result}*/\n`;
};
const addJsdocs = (schema, parsed) => {
    const description = schema.description;
    if (!description) {
        return parsed;
    }
    return `\n${expandJsdocs(description)}${parsed}`;
};

function parseObject(objectSchema, refs) {
    let properties = undefined;
    if (objectSchema.properties) {
        if (!Object.keys(objectSchema.properties).length) {
            properties = "z.object({})";
        }
        else {
            properties = "z.object({ ";
            properties += Object.keys(objectSchema.properties)
                .map((key) => {
                const propSchema = objectSchema.properties[key];
                let result = `${JSON.stringify(key)}: ${parseSchema(propSchema, {
                    ...refs,
                    path: [...refs.path, "properties", key],
                })}`;
                if (refs.withJsdocs && typeof propSchema === "object") {
                    result = addJsdocs(propSchema, result);
                }
                const hasDefault = typeof propSchema === "object" && propSchema.default !== undefined;
                const required = Array.isArray(objectSchema.required)
                    ? objectSchema.required.includes(key)
                    : typeof propSchema === "object" && propSchema.required === true;
                const optional = !hasDefault && !required;
                return optional ? `${result}.optional()` : result;
            })
                .join(", ");
            properties += " })";
        }
    }
    const additionalProperties = objectSchema.additionalProperties !== undefined
        ? parseSchema(objectSchema.additionalProperties, {
            ...refs,
            path: [...refs.path, "additionalProperties"],
        })
        : undefined;
    let patternProperties = undefined;
    if (objectSchema.patternProperties) {
        const parsedPatternProperties = Object.fromEntries(Object.entries(objectSchema.patternProperties).map(([key, value]) => {
            return [
                key,
                parseSchema(value, {
                    ...refs,
                    path: [...refs.path, "patternProperties", key],
                }),
            ];
        }, {}));
        patternProperties = "";
        if (properties) {
            if (additionalProperties) {
                patternProperties += `.catchall(z.union([${[
                    ...Object.values(parsedPatternProperties),
                    additionalProperties,
                ].join(", ")}]))`;
            }
            else if (Object.keys(parsedPatternProperties).length > 1) {
                patternProperties += `.catchall(z.union([${Object.values(parsedPatternProperties).join(", ")}]))`;
            }
            else {
                patternProperties += `.catchall(${Object.values(parsedPatternProperties)})`;
            }
        }
        else {
            if (additionalProperties) {
                patternProperties += `z.record(z.union([${[
                    ...Object.values(parsedPatternProperties),
                    additionalProperties,
                ].join(", ")}]))`;
            }
            else if (Object.keys(parsedPatternProperties).length > 1) {
                patternProperties += `z.record(z.union([${Object.values(parsedPatternProperties).join(", ")}]))`;
            }
            else {
                patternProperties += `z.record(${Object.values(parsedPatternProperties)})`;
            }
        }
        patternProperties += ".superRefine((value, ctx) => {\n";
        patternProperties += "for (const key in value) {\n";
        if (additionalProperties) {
            if (objectSchema.properties) {
                patternProperties += `let evaluated = [${Object.keys(objectSchema.properties)
                    .map((key) => JSON.stringify(key))
                    .join(", ")}].includes(key)\n`;
            }
            else {
                patternProperties += `let evaluated = false\n`;
            }
        }
        for (const key in objectSchema.patternProperties) {
            patternProperties +=
                "if (key.match(new RegExp(" + JSON.stringify(key) + "))) {\n";
            if (additionalProperties) {
                patternProperties += "evaluated = true\n";
            }
            patternProperties +=
                "const result = " +
                    parsedPatternProperties[key] +
                    ".safeParse(value[key])\n";
            patternProperties += "if (!result.success) {\n";
            patternProperties += `ctx.addIssue({
          path: [...ctx.path, key],
          code: 'custom',
          message: \`Invalid input: Key matching regex /\${key}/ must match schema\`,
          params: {
            issues: result.error.issues
          }
        })\n`;
            patternProperties += "}\n";
            patternProperties += "}\n";
        }
        if (additionalProperties) {
            patternProperties += "if (!evaluated) {\n";
            patternProperties +=
                "const result = " + additionalProperties + ".safeParse(value[key])\n";
            patternProperties += "if (!result.success) {\n";
            patternProperties += `ctx.addIssue({
          path: [...ctx.path, key],
          code: 'custom',
          message: \`Invalid input: must match catchall schema\`,
          params: {
            issues: result.error.issues
          }
        })\n`;
            patternProperties += "}\n";
            patternProperties += "}\n";
        }
        patternProperties += "}\n";
        patternProperties += "})";
    }
    let output = properties
        ? patternProperties
            ? properties + patternProperties
            : additionalProperties
                ? additionalProperties === "z.never()"
                    ? properties + ".strict()"
                    : properties + `.catchall(${additionalProperties})`
                : properties
        : patternProperties
            ? patternProperties
            : additionalProperties
                ? `z.record(${additionalProperties})`
                : "z.record(z.any())";
    if (its.an.anyOf(objectSchema)) {
        output += `.and(${parseAnyOf({
            anyOf: objectSchema.anyOf.map((x) => typeof x === "object" &&
                !x.type &&
                (x.properties || x.additionalProperties || x.patternProperties)
                ? { ...x, type: "object" }
                : x),
        }, refs)})`;
    }
    if (its.a.oneOf(objectSchema)) {
        output += `.and(${parseOneOf({
            oneOf: objectSchema.oneOf.map((x) => typeof x === "object" &&
                !x.type &&
                (x.properties || x.additionalProperties || x.patternProperties)
                ? { ...x, type: "object" }
                : x),
        }, refs)})`;
    }
    if (its.an.allOf(objectSchema)) {
        output += `.and(${parseAllOf({
            allOf: objectSchema.allOf.map((x) => typeof x === "object" &&
                !x.type &&
                (x.properties || x.additionalProperties || x.patternProperties)
                ? { ...x, type: "object" }
                : x),
        }, refs)})`;
    }
    return output;
}

const parseString = (schema) => {
    let r = "z.string()";
    r += withMessage(schema, "format", ({ value }) => {
        switch (value) {
            case "email":
                return [".email(", ")"];
            case "ip":
                return [".ip(", ")"];
            case "ipv4":
                return ['.ip({ version: "v4"', ", message: ", " })"];
            case "ipv6":
                return ['.ip({ version: "v6"', ", message: ", " })"];
            case "uri":
                return [".url(", ")"];
            case "uuid":
                return [".uuid(", ")"];
            case "date-time":
                return [".datetime({ offset: true", ", message: ", " })"];
            case "time":
                return [".time(", ")"];
            case "date":
                return [".date(", ")"];
            case "binary":
                return [".base64(", ")"];
            case "duration":
                return [".duration(", ")"];
        }
    });
    r += withMessage(schema, "pattern", ({ json }) => [
        `.regex(new RegExp(${json})`,
        ", ",
        ")",
    ]);
    r += withMessage(schema, "minLength", ({ json }) => [
        `.min(${json}`,
        ", ",
        ")",
    ]);
    r += withMessage(schema, "maxLength", ({ json }) => [
        `.max(${json}`,
        ", ",
        ")",
    ]);
    r += withMessage(schema, "contentEncoding", ({ value }) => {
        if (value === "base64") {
            return [".base64(", ")"];
        }
    });
    const contentMediaType = withMessage(schema, "contentMediaType", ({ value }) => {
        if (value === "application/json") {
            return [
                ".transform((str, ctx) => { try { return JSON.parse(str); } catch (err) { ctx.addIssue({ code: \"custom\", message: \"Invalid JSON\" }); }}",
                ", ",
                ")"
            ];
        }
    });
    if (contentMediaType != "") {
        r += contentMediaType;
        r += withMessage(schema, "contentSchema", ({ value }) => {
            if (value && value instanceof Object) {
                return [
                    `.pipe(${parseSchema(value)}`,
                    ", ",
                    ")"
                ];
            }
        });
    }
    return r;
};

const omit = (obj, ...keys) => Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) {
        acc[key] = obj[key];
    }
    return acc;
}, {});

/**
 * For compatibility with open api 3.0 nullable
 */
const parseNullable = (schema, refs) => {
    return `${parseSchema(omit(schema, "nullable"), refs, true)}.nullable()`;
};

const parseSchema = (schema, refs = { seen: new Map(), path: [] }, blockMeta) => {
    if (typeof schema !== "object")
        return schema ? "z.any()" : "z.never()";
    if (refs.parserOverride) {
        const custom = refs.parserOverride(schema, refs);
        if (typeof custom === "string") {
            return custom;
        }
    }
    let seen = refs.seen.get(schema);
    if (seen) {
        if (seen.r !== undefined) {
            return seen.r;
        }
        if (refs.depth === undefined || seen.n >= refs.depth) {
            return "z.any()";
        }
        seen.n += 1;
    }
    else {
        seen = { r: undefined, n: 0 };
        refs.seen.set(schema, seen);
    }
    let parsed = selectParser(schema, refs);
    if (!blockMeta) {
        if (!refs.withoutDescribes) {
            parsed = addDescribes(schema, parsed);
        }
        if (!refs.withoutDefaults) {
            parsed = addDefaults(schema, parsed);
        }
        parsed = addAnnotations(schema, parsed);
    }
    seen.r = parsed;
    return parsed;
};
const addDescribes = (schema, parsed) => {
    if (schema.description) {
        parsed += `.describe(${JSON.stringify(schema.description)})`;
    }
    return parsed;
};
const addDefaults = (schema, parsed) => {
    if (schema.default !== undefined) {
        parsed += `.default(${JSON.stringify(schema.default)})`;
    }
    return parsed;
};
const addAnnotations = (schema, parsed) => {
    if (schema.readOnly) {
        parsed += ".readonly()";
    }
    return parsed;
};
const selectParser = (schema, refs) => {
    if (its.a.nullable(schema)) {
        return parseNullable(schema, refs);
    }
    else if (its.an.object(schema)) {
        return parseObject(schema, refs);
    }
    else if (its.an.array(schema)) {
        return parseArray(schema, refs);
    }
    else if (its.an.anyOf(schema)) {
        return parseAnyOf(schema, refs);
    }
    else if (its.an.allOf(schema)) {
        return parseAllOf(schema, refs);
    }
    else if (its.a.oneOf(schema)) {
        return parseOneOf(schema, refs);
    }
    else if (its.a.not(schema)) {
        return parseNot(schema, refs);
    }
    else if (its.an.enum(schema)) {
        return parseEnum(schema); //<-- needs to come before primitives
    }
    else if (its.a.const(schema)) {
        return parseConst(schema);
    }
    else if (its.a.multipleType(schema)) {
        return parseMultipleType(schema, refs);
    }
    else if (its.a.primitive(schema, "string")) {
        return parseString(schema);
    }
    else if (its.a.primitive(schema, "number") ||
        its.a.primitive(schema, "integer")) {
        return parseNumber(schema);
    }
    else if (its.a.primitive(schema, "boolean")) {
        return parseBoolean();
    }
    else if (its.a.primitive(schema, "null")) {
        return parseNull();
    }
    else if (its.a.conditional(schema)) {
        return parseIfThenElse(schema, refs);
    }
    else {
        return parseDefault();
    }
};
const its = {
    an: {
        object: (x) => x.type === "object",
        array: (x) => x.type === "array",
        anyOf: (x) => x.anyOf !== undefined,
        allOf: (x) => x.allOf !== undefined,
        enum: (x) => x.enum !== undefined,
    },
    a: {
        nullable: (x) => x.nullable === true,
        multipleType: (x) => Array.isArray(x.type),
        not: (x) => x.not !== undefined,
        const: (x) => x.const !== undefined,
        primitive: (x, p) => x.type === p,
        conditional: (x) => Boolean("if" in x && x.if && "then" in x && "else" in x && x.then && x.else),
        oneOf: (x) => x.oneOf !== undefined,
    },
};

const jsonSchemaToZod = (schema, { module, name, type, noImport, ...rest } = {}) => {
    if (type && (!name || module !== "esm")) {
        throw new Error("Option `type` requires `name` to be set and `module` to be `esm`");
    }
    let result = parseSchema(schema, {
        module,
        name,
        path: [],
        seen: new Map(),
        ...rest,
    });
    const jsdocs = rest.withJsdocs && typeof schema !== "boolean" && schema.description
        ? expandJsdocs(schema.description)
        : "";
    if (module === "cjs") {
        result = `${jsdocs}module.exports = ${name ? `{ ${JSON.stringify(name)}: ${result} }` : result}
`;
        if (!noImport) {
            result = `${jsdocs}const { z } = require("zod")

${result}`;
        }
    }
    else if (module === "esm") {
        result = `${jsdocs}export ${name ? `const ${name} =` : `default`} ${result}
`;
        if (!noImport) {
            result = `import { z } from "zod"

${result}`;
        }
    }
    else if (name) {
        result = `${jsdocs}const ${name} = ${result}`;
    }
    if (type && name) {
        let typeName = typeof type === "string"
            ? type
            : `${name[0].toUpperCase()}${name.substring(1)}`;
        result += `export type ${typeName} = z.infer<typeof ${name}>
`;
    }
    return result;
};

var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function resolveSerializedZodOutput(schema) {
  return Function("z", `"use strict";return (${schema});`)(lib.z);
}
function isVercelTool(tool) {
  return !(tool instanceof Tool);
}
function createLogMessageOptions({ agentName, toolName, tool, type }) {
  if (!agentName) {
    return {
      start: `Executing tool ${toolName}`,
      error: `Failed tool execution`
    };
  }
  const prefix = `[Agent:${agentName}]`;
  const vercelPrefix = isVercelTool(tool) ? "Vercel " : "";
  const toolType = type === "toolset" ? "toolset" : "tool";
  return {
    start: `${prefix} - Executing ${vercelPrefix}${toolType} ${toolName}`,
    error: `${prefix} - Failed ${vercelPrefix}${toolType} execution`
  };
}
function createExecute(tool, options, logType) {
  const { logger, mastra: _mastra, memory: _memory, ...rest } = options;
  const { start, error } = createLogMessageOptions({
    agentName: options.agentName,
    toolName: options.name,
    tool,
    type: logType
  });
  const execFunction = async (args, execOptions) => {
    if (isVercelTool(tool)) {
      return tool?.execute?.(args, execOptions) ?? void 0;
    }
    return tool?.execute?.(
      {
        context: args,
        threadId: options.threadId,
        resourceId: options.resourceId,
        mastra: options.mastra,
        memory: options.memory,
        runId: options.runId
      },
      execOptions
    ) ?? void 0;
  };
  return async (args, execOptions) => {
    try {
      logger.debug(start, { ...rest, args });
      return await execFunction(args, execOptions);
    } catch (err) {
      logger.error(error, { ...rest, error: err, args });
      throw err;
    }
  };
}
function isZodType(value) {
  return typeof value === "object" && value !== null && "_def" in value && "parse" in value && typeof value.parse === "function" && "safeParse" in value && typeof value.safeParse === "function";
}
function createDeterministicId(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 8);
}
function setVercelToolProperties(tool) {
  const inputSchema = convertVercelToolParameters(tool);
  const toolId = !("id" in tool) ? tool.description ? `tool-${createDeterministicId(tool.description)}` : `tool-${Math.random().toString(36).substring(2, 9)}` : tool.id;
  return {
    ...tool,
    id: toolId,
    inputSchema
  };
}
function ensureToolProperties(tools) {
  const toolsWithProperties = Object.keys(tools).reduce((acc, key) => {
    const tool = tools?.[key];
    if (tool) {
      if (isVercelTool(tool)) {
        acc[key] = setVercelToolProperties(tool);
      } else {
        acc[key] = tool;
      }
    }
    return acc;
  }, {});
  return toolsWithProperties;
}
function convertVercelToolParameters(tool) {
  const schema = tool.parameters ?? lib.z.object({});
  return isZodType(schema) ? schema : resolveSerializedZodOutput(jsonSchemaToZod(schema));
}
function makeCoreTool(tool, options, logType) {
  const getParameters = () => {
    if (isVercelTool(tool)) {
      return convertVercelToolParameters(tool);
    }
    return tool.inputSchema ?? lib.z.object({});
  };
  const isProviderDefined = "type" in tool && tool.type === "provider-defined" && "id" in tool && typeof tool.id === "string" && tool.id.includes(".");
  if (isProviderDefined) {
    return {
      type: "provider-defined",
      id: tool.id,
      args: "args" in tool ? tool.args : {},
      description: tool.description,
      parameters: getParameters(),
      execute: tool.execute ? createExecute(tool, { ...options, description: tool.description }, logType) : void 0
    };
  }
  return {
    type: "function",
    description: tool.description,
    parameters: getParameters(),
    execute: tool.execute ? createExecute(tool, { ...options, description: tool.description }, logType) : void 0
  };
}
function createMastraProxy({ mastra, logger }) {
  return new Proxy(mastra, {
    get(target, prop) {
      const hasProp = Reflect.has(target, prop);
      if (hasProp) {
        const value = Reflect.get(target, prop);
        const isFunction = typeof value === "function";
        if (isFunction) {
          return value.bind(target);
        }
        return value;
      }
      if (prop === "logger") {
        logger.warn(`Please use 'getLogger' instead, logger is deprecated`);
        return Reflect.apply(target.getLogger, target, []);
      }
      if (prop === "telemetry") {
        logger.warn(`Please use 'getTelemetry' instead, telemetry is deprecated`);
        return Reflect.apply(target.getTelemetry, target, []);
      }
      if (prop === "storage") {
        logger.warn(`Please use 'getStorage' instead, storage is deprecated`);
        return Reflect.get(target, "storage");
      }
      if (prop === "agents") {
        logger.warn(`Please use 'getAgents' instead, agents is deprecated`);
        return Reflect.apply(target.getAgents, target, []);
      }
      if (prop === "tts") {
        logger.warn(`Please use 'getTTS' instead, tts is deprecated`);
        return Reflect.apply(target.getTTS, target, []);
      }
      if (prop === "vectors") {
        logger.warn(`Please use 'getVectors' instead, vectors is deprecated`);
        return Reflect.apply(target.getVectors, target, []);
      }
      if (prop === "memory") {
        logger.warn(`Please use 'getMemory' instead, memory is deprecated`);
        return Reflect.get(target, "memory");
      }
      return Reflect.get(target, prop);
    }
  });
}

export { createMastraProxy as c, delay as d, ensureToolProperties as e, isVercelTool as i, makeCoreTool as m };
