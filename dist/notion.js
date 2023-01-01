"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const yaml_1 = __importDefault(require("yaml"));
const client_1 = require("@notionhq/client");
const notion_to_md_1 = require("notion-to-md");
const utils_1 = require("./utils");
const getDatabaseId = (databaseId) => {
    const isValidId = (str) => /^[\da-f]{32}$/.test(str);
    if (isValidId(databaseId))
        return databaseId;
    try {
        const parsedUrl = new URL(databaseId);
        // @ts-ignore
        const id = parsedUrl.pathname.match(/\b([\da-f]{32})\b/)[1];
        if (isValidId(id))
            return id;
        throw new Error("URL does not contain a valid database id");
    }
    catch (error) {
        throw new Error(`Database is not valid databaseID or Notion URL! ${error}`);
    }
};
const run = async (opts) => {
    const notion = new client_1.Client({ auth: opts.notionToken });
    const n2m = new notion_to_md_1.NotionToMarkdown({ notionClient: notion });
    console.log("Fetching pages...");
    const query = {
        filter: { and: [{ property: "Public", checkbox: { equals: true } }] },
        sorts: [{ property: "Created", direction: "descending" }],
    };
    const databaseQuery = { database_id: getDatabaseId(opts.databaseId), ...query };
    const response = await notion.databases.query(databaseQuery);
    const pages = response.results;
    await (0, utils_1.parallel)(pages, async (page) => {
        var _a, _b, _c, _d, _e;
        const frontmatter = {
            title: page.properties.Name.title[0].plain_text,
            image: 
            // @ts-ignore
            ((_b = (_a = page.cover) === null || _a === void 0 ? void 0 : _a.file) === null || _b === void 0 ? void 0 : _b.url) || ((_d = (_c = page.cover) === null || _c === void 0 ? void 0 : _c.external) === null || _d === void 0 ? void 0 : _d.url) || "https://via.placeholder.com/600x400.png",
            category: (_e = page.properties.Category.select) === null || _e === void 0 ? void 0 : _e.name,
            publishedAt: page.properties.Created.created_time,
        };
        const mdBlocks = await n2m.pageToMarkdown(page.id);
        const content = n2m.toMarkdownString(mdBlocks);
        const file = `---\n${yaml_1.default.stringify(frontmatter)}---\n\n${content}\n`;
        const newPath = (0, utils_1.format)(opts.contentPath, frontmatter.title, (val) => (0, utils_1.safeName)(val));
        console.log(newPath);
        // // save markdown to disk
        // await fs.promises.mkdir(path.dirname(opts.contentPath), { recursive: true });
        // await fs.promises.writeFile(opts.contentPath, file, "utf8");
        // console.log(`Created '${opts.contentPath}' from "${frontmatter.title}" (${page.id})`);
    }, opts.parallelPages);
};
exports.run = run;
