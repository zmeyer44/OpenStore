import { detectRuntime } from "@locker/common";

export const runtime = Object.freeze(detectRuntime(process.env));
