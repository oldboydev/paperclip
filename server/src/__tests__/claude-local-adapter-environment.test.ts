import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { testEnvironment, parseClaudeStreamJson } from "@paperclipai/adapter-claude-local/server";

const ORIGINAL_ANTHROPIC = process.env.ANTHROPIC_API_KEY;
const ORIGINAL_BEDROCK = process.env.CLAUDE_CODE_USE_BEDROCK;
const ORIGINAL_BEDROCK_URL = process.env.ANTHROPIC_BEDROCK_BASE_URL;

afterEach(() => {
  if (ORIGINAL_ANTHROPIC === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC;
  }
  if (ORIGINAL_BEDROCK === undefined) {
    delete process.env.CLAUDE_CODE_USE_BEDROCK;
  } else {
    process.env.CLAUDE_CODE_USE_BEDROCK = ORIGINAL_BEDROCK;
  }
  if (ORIGINAL_BEDROCK_URL === undefined) {
    delete process.env.ANTHROPIC_BEDROCK_BASE_URL;
  } else {
    process.env.ANTHROPIC_BEDROCK_BASE_URL = ORIGINAL_BEDROCK_URL;
  }
});

describe("claude_local environment diagnostics", () => {
  it("returns a warning (not an error) when ANTHROPIC_API_KEY is set in host environment", async () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK;
    delete process.env.ANTHROPIC_BEDROCK_BASE_URL;
    process.env.ANTHROPIC_API_KEY = "sk-test-host";

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
      },
    });

    expect(result.status).toBe("warn");
    expect(
      result.checks.some(
        (check) =>
          check.code === "claude_anthropic_api_key_overrides_subscription" &&
          check.level === "warn",
      ),
    ).toBe(true);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
  });

  it("returns a warning (not an error) when ANTHROPIC_API_KEY is set in adapter env", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_CODE_USE_BEDROCK;
    delete process.env.ANTHROPIC_BEDROCK_BASE_URL;

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
        env: {
          ANTHROPIC_API_KEY: "sk-test-config",
        },
      },
    });

    expect(result.status).toBe("warn");
    expect(
      result.checks.some(
        (check) =>
          check.code === "claude_anthropic_api_key_overrides_subscription" &&
          check.level === "warn",
      ),
    ).toBe(true);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
  });

  it("returns bedrock auth info when CLAUDE_CODE_USE_BEDROCK is set in host environment", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
      },
    });

    expect(
      result.checks.some(
        (check) =>
          check.code === "claude_bedrock_auth" && check.level === "info",
      ),
    ).toBe(true);
    expect(
      result.checks.some(
        (check) => check.code === "claude_subscription_mode_possible",
      ),
    ).toBe(false);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
  });

  it("returns bedrock auth info when CLAUDE_CODE_USE_BEDROCK is set in adapter env", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_CODE_USE_BEDROCK;

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
        env: {
          CLAUDE_CODE_USE_BEDROCK: "1",
        },
      },
    });

    expect(
      result.checks.some(
        (check) =>
          check.code === "claude_bedrock_auth" && check.level === "info",
      ),
    ).toBe(true);
    expect(
      result.checks.some(
        (check) => check.code === "claude_subscription_mode_possible",
      ),
    ).toBe(false);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
  });

  it("bedrock auth takes precedence over missing ANTHROPIC_API_KEY", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
      },
    });

    const codes = result.checks.map((c) => c.code);
    expect(codes).toContain("claude_bedrock_auth");
    expect(codes).not.toContain("claude_subscription_mode_possible");
    expect(codes).not.toContain("claude_anthropic_api_key_overrides_subscription");
  });

  it("creates a missing working directory when cwd is absolute", async () => {
    const cwd = path.join(
      os.tmpdir(),
      `paperclip-claude-local-cwd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      "workspace",
    );

    await fs.rm(path.dirname(cwd), { recursive: true, force: true });

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
        cwd,
      },
    });

    expect(result.checks.some((check) => check.code === "claude_cwd_valid")).toBe(true);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
    const stats = await fs.stat(cwd);
    expect(stats.isDirectory()).toBe(true);
    await fs.rm(path.dirname(cwd), { recursive: true, force: true });
  });

  it("defaults remote probes to the environment remote cwd when adapter cwd is unset", async () => {
    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "claude_local",
      config: {
        command: process.execPath,
      },
      executionTarget: {
        kind: "remote",
        transport: "sandbox",
        providerKey: "test-provider",
        remoteCwd: "/srv/paperclip/workspace",
        runner: {
          execute: async () => ({
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: "",
            stderr: "",
            pid: null,
            startedAt: new Date().toISOString(),
          }),
        },
      },
      environmentName: "Linux Box",
    });

    expect(result.checks.some((check) => check.code === "claude_cwd_valid")).toBe(true);
    expect(
      result.checks.some(
        (check) =>
          check.code === "claude_cwd_valid" &&
          check.message === "Working directory is valid: /srv/paperclip/workspace",
      ),
    ).toBe(true);
    expect(result.checks.some((check) => check.code === "claude_cwd_invalid")).toBe(false);
  });
});

describe("parseClaudeStreamJson", () => {
  it("parses output correctly when SessionStart hooks are present", () => {
    const stdout = [
      '{"type":"system","subtype":"hook_started","hook_id":"some-id","hook_name":"SessionStart:startup","hook_event":"SessionStart"}',
      '{"type":"system","subtype":"hook_response","hook_event":"SessionStart","output":"...","stdout":"...","exit_code":0,"outcome":"success"}',
      '{"type":"system","subtype":"init","session_id":"test-session-id","model":"test-model"}',
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello!"}]}}',
      '{"type":"result","subtype":"success","result":"Hello!"}',
    ].join("\n");

    const result = parseClaudeStreamJson(stdout);
    expect(result.sessionId).toBe("test-session-id");
    expect(result.model).toBe("test-model");
    expect(result.summary).toBe("Hello!");
    expect(result.resultJson).not.toBeNull();
    expect(result.resultJson?.subtype).toBe("success");
  });

  it("parses output correctly even if a hook fails", () => {
    const stdout = [
      '{"type":"system","subtype":"hook_started","hook_id":"some-id","hook_name":"SessionStart:startup","hook_event":"SessionStart"}',
      '{"type":"system","subtype":"hook_response","hook_event":"SessionStart","output":"hook failed","stdout":"","exit_code":1,"outcome":"error"}',
      '{"type":"system","subtype":"init","session_id":"test-session-id-2","model":"test-model"}',
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello despite hook failure!"}]}}',
      '{"type":"result","subtype":"success","result":"Hello despite hook failure!"}',
    ].join("\n");

    const result = parseClaudeStreamJson(stdout);
    expect(result.sessionId).toBe("test-session-id-2");
    expect(result.summary).toBe("Hello despite hook failure!");
    expect(result.resultJson).not.toBeNull();
  });
});
