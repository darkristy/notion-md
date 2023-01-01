import fs from "fs";
import path from "path";

import yaml from "yaml";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

import { format, parallel, safeName } from "./utils";

type Opts = {
  notionToken: string;
  databaseId: string;
  contentPath: string;
  parallelPages: number;
};

const getDatabaseId = (databaseId: string) => {
  const isValidId = (str: string) => /^[\da-f]{32}$/.test(str);
  if (isValidId(databaseId)) return databaseId;
  try {
    const parsedUrl = new URL(databaseId);
    // @ts-ignore
    const id = parsedUrl.pathname.match(/\b([\da-f]{32})\b/)[1];
    if (isValidId(id)) return id;
    throw new Error("URL does not contain a valid database id");
  } catch (error) {
    throw new Error(`Database is not valid databaseID or Notion URL! ${error}`);
  }
};

export const run = async (opts: Opts) => {
  const notion = new Client({ auth: opts.notionToken });
  const n2m = new NotionToMarkdown({ notionClient: notion });

  console.log("Fetching pages...");

  const query = {
    filter: { and: [{ property: "Public", checkbox: { equals: true } }] },
    sorts: [{ property: "Created", direction: "descending" }],
  };

  const databaseQuery = { database_id: getDatabaseId(opts.databaseId), ...query } as any;
  const response = await notion.databases.query(databaseQuery);
  const pages = response.results;

  await parallel(
    pages,
    async (page: any) => {
      const frontmatter = {
        title: page.properties.Name.title[0].plain_text,
        image:
          // @ts-ignore
          page.cover?.file?.url || page.cover?.external?.url || "https://via.placeholder.com/600x400.png",
        category: page.properties.Category.select?.name,
        publishedAt: page.properties.Created.created_time,
      };

      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const content = n2m.toMarkdownString(mdBlocks);

      const file = `---\n${yaml.stringify(frontmatter)}---\n\n${content}\n`;

      const newPath = format(opts.contentPath, frontmatter.title, (val: any) => safeName(val));

      console.log(newPath);

      // // save markdown to disk
      // await fs.promises.mkdir(path.dirname(opts.contentPath), { recursive: true });
      // await fs.promises.writeFile(opts.contentPath, file, "utf8");

      // console.log(`Created '${opts.contentPath}' from "${frontmatter.title}" (${page.id})`);
    },
    opts.parallelPages
  );
};
