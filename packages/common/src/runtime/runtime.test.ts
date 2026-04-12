import { describe, it, expect } from "vitest";
import { detectRuntime } from "./index";

describe("detectRuntime", () => {
  it("detects Vercel with blob token as serverless with vercel_blob configured", () => {
    const result = detectRuntime({ VERCEL: "1", BLOB_READ_WRITE_TOKEN: "tok" });
    expect(result.environment).toBe("vercel");
    expect(result.runtimeClass).toBe("serverless");
    expect(result.longRunningSupported).toBe(false);
    expect(result.localFilesystemAvailable).toBe(false);
    expect(result.platformStorageProvider).toBe("vercel_blob");
    expect(result.configuredPlatformStorageProvider).toBe("vercel_blob");
    expect(result.overridden).toBe(false);
  });

  it("detects Vercel with explicit s3 but missing keys as unconfigured", () => {
    const result = detectRuntime({ VERCEL: "1", BLOB_STORAGE_PROVIDER: "s3" });
    expect(result.environment).toBe("vercel");
    expect(result.runtimeClass).toBe("serverless");
    expect(result.platformStorageProvider).toBe("s3");
    expect(result.configuredPlatformStorageProvider).toBeNull();
  });

  it("detects Vercel with explicit s3 and valid keys as configured", () => {
    const result = detectRuntime({
      VERCEL: "1",
      BLOB_STORAGE_PROVIDER: "s3",
      AWS_ACCESS_KEY_ID: "x",
      AWS_SECRET_ACCESS_KEY: "x",
      S3_BUCKET: "b",
    });
    expect(result.environment).toBe("vercel");
    expect(result.platformStorageProvider).toBe("s3");
    expect(result.configuredPlatformStorageProvider).toBe("s3");
  });

  it("detects local development as persistent with local storage", () => {
    const result = detectRuntime({ NODE_ENV: "development" });
    expect(result.environment).toBe("development");
    expect(result.runtimeClass).toBe("persistent");
    expect(result.longRunningSupported).toBe(true);
    expect(result.localFilesystemAvailable).toBe(true);
    expect(result.platformStorageProvider).toBe("local");
    expect(result.configuredPlatformStorageProvider).toBe("local");
  });

  it("detects Docker as persistent", () => {
    const result = detectRuntime({
      DOCKER_CONTAINER: "1",
      NODE_ENV: "production",
    });
    expect(result.environment).toBe("docker");
    expect(result.runtimeClass).toBe("persistent");
    expect(result.longRunningSupported).toBe(true);
  });

  it("LOCKER_RUNTIME_ENV override beats detected environment", () => {
    const result = detectRuntime({
      VERCEL: "1",
      LOCKER_RUNTIME_ENV: "docker",
    });
    expect(result.environment).toBe("docker");
    expect(result.overridden).toBe(true);
    expect(result.runtimeClass).toBe("persistent");
    expect(result.longRunningSupported).toBe(true);
  });

  it("unknown production environment defaults to persistent with local storage", () => {
    const result = detectRuntime({ NODE_ENV: "production" });
    expect(result.environment).toBe("unknown");
    expect(result.runtimeClass).toBe("persistent");
    expect(result.platformStorageProvider).toBe("local");
    expect(result.configuredPlatformStorageProvider).toBe("local");
  });

  it("detects R2 as configured when all required vars are present", () => {
    const result = detectRuntime({
      BLOB_STORAGE_PROVIDER: "r2",
      R2_ACCOUNT_ID: "a",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
      R2_BUCKET: "b",
    });
    expect(result.platformStorageProvider).toBe("r2");
    expect(result.configuredPlatformStorageProvider).toBe("r2");
  });

  it("detects R2 as unconfigured when bucket is missing", () => {
    const result = detectRuntime({
      BLOB_STORAGE_PROVIDER: "r2",
      R2_ACCOUNT_ID: "a",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
    });
    expect(result.platformStorageProvider).toBe("r2");
    expect(result.configuredPlatformStorageProvider).toBeNull();
  });
});
