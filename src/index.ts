#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const API_BASE = "https://xmorf.com/api/v1";

function getToken(): string {
  const token = process.env.XMORF_API_TOKEN;
  if (!token) {
    throw new Error(
      "XMORF_API_TOKEN environment variable is required. Get one at https://xmorf.com"
    );
  }
  return token;
}

async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      error: res.statusText,
    }))) as Record<string, string>;
    throw new Error(
      `xmorf API error ${res.status}: ${err.error || res.statusText}`
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

function resolveImage(input: string): string {
  if (input.startsWith("data:")) return input;

  const filePath = resolve(input);
  if (existsSync(filePath)) {
    const buf = readFileSync(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "png";
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  // Assume raw base64
  return input;
}

function saveImage(dataUrl: string, outputPath: string): void {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  writeFileSync(resolve(outputPath), Buffer.from(base64, "base64"));
}

function imageContent(dataUrl: string) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  return { type: "image" as const, data: base64, mimeType };
}

const server = new McpServer({
  name: "mcp-xmorf",
  version: "1.0.0",
});

server.tool(
  "xmorf_list_models",
  "List available xmorf image editing models and their descriptions",
  {},
  async () => {
    const result = await apiRequest("GET", "/edit");
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "xmorf_edit_image",
  "Edit an image using AI with a natural language prompt. Models: standard (general-purpose), enhance (realism), upscale (resolution), shadow (light migration, needs reference), kiss (needs reference), skin (retouching), angles (multi-angle), scene (scene change). Input can be a file path or base64 data URL.",
  {
    image: z
      .string()
      .describe(
        "Image to edit: absolute file path, data URL (data:image/png;base64,...), or raw base64"
      ),
    prompt: z
      .string()
      .describe("Editing instruction in plain English, e.g. 'Remove the background'"),
    model: z
      .enum([
        "standard",
        "enhance",
        "upscale",
        "shadow",
        "kiss",
        "skin",
        "angles",
        "scene",
      ])
      .optional()
      .describe("Editing model (default: standard)"),
    referenceImage: z
      .string()
      .optional()
      .describe(
        "Reference image for shadow/kiss models: file path, data URL, or raw base64"
      ),
    outputPath: z
      .string()
      .optional()
      .describe("Save result to this file path instead of returning base64"),
  },
  async ({ image, prompt, model, referenceImage, outputPath }) => {
    const body: Record<string, string> = {
      image: resolveImage(image),
      prompt,
    };
    if (model) body.model = model;
    if (referenceImage) body.referenceImage = resolveImage(referenceImage);

    const result = await apiRequest("POST", "/edit", body);
    const resultImage = result.image as string | undefined;

    if (!resultImage) {
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (outputPath) {
      saveImage(resultImage, outputPath);
      return {
        content: [
          { type: "text", text: `Edited image saved to ${resolve(outputPath)}` },
        ],
      };
    }

    return { content: [imageContent(resultImage)] };
  }
);

server.tool(
  "xmorf_generate_image",
  "Generate an image from a text description using AI",
  {
    prompt: z
      .string()
      .describe(
        "Text description of the image to generate, e.g. 'A futuristic city at sunset, cyberpunk style'"
      ),
    model: z
      .string()
      .optional()
      .describe("OpenAI model to use (default: dall-e-2)"),
    size: z
      .string()
      .optional()
      .describe("Image dimensions, e.g. 1024x1024 (default: 1024x1024)"),
    outputPath: z
      .string()
      .optional()
      .describe("Save result to this file path instead of returning base64"),
  },
  async ({ prompt, model, size, outputPath }) => {
    const body: Record<string, string> = { prompt };
    if (model) body.model = model;
    if (size) body.size = size;

    const result = await apiRequest("POST", "/generate", body);
    const resultImage = result.image as string | undefined;

    if (!resultImage) {
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (outputPath) {
      saveImage(resultImage, outputPath);
      return {
        content: [
          { type: "text", text: `Generated image saved to ${resolve(outputPath)}` },
        ],
      };
    }

    return { content: [imageContent(resultImage)] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
