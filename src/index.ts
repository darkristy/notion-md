import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    core.info(`context event: ${github.context.eventName}`);
    core.info(`context action: ${github.context.action}`);
    core.info(`payload action: ${github.context.payload.action}`);

    const greeting = core.getInput("GREETING");

    console.log(greeting);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
