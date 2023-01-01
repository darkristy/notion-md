import * as core from "@actions/core";
import * as github from "@actions/github";

import { run } from "./notion";

async function main(): Promise<void> {
  try {
    core.info(`context event: ${github.context.eventName}`);
    core.info(`context action: ${github.context.action}`);
    core.info(`payload action: ${github.context.payload.action}`);

    run({
      notionToken: core.getInput("NOTION_TOKEN", { required: true }),
      databaseId: core.getInput("DATABASE_ID", { required: true }),
      contentPath: core.getInput("CONTENT_PATH"),
      parallelPages: Number(core.getInput("PARALLEL_PAGES")),
    });
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

main();
