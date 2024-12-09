#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { DataAPIClient } from "@datastax/astra-db-ts";

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

const MonsterSchema = z.object({
  _id: z.string(),
  index: z.string(),
  name: z.string().describe("The name of the monster"),
  size: z.string(),
  type: z.string(),
  alignment: z.string(),
  hit_points: z.number(),
  hit_dice: z.string(),
  strength: z.number(),
  dexterity: z.number(),
  constitution: z.number(),
  intelligence: z.number(),
  wisdom: z.number(),
  charisma: z.number(),
  languages: z.string(),
  challenge_rating: z.number(),
  proficiency_bonus: z.number(),
  xp: z.number(),
  speed_walk: z.string(),
  proficiency_skill_deception: z.number(),
  proficiency_skill_insight: z.number(),
  proficiency_skill_persuasion: z.number(),
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!);
const monsters = db.collection("monster_list");

const server = new Server(
  {
    name: "monsters-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_monster",
        description: "Get a dungeons and dragons monster by name",
        inputSchema: zodToJsonSchema(MonsterSchema.pick({ name: true })),
      },
      {
        name: "find_similar_monsters",
        description: "Find similar monsters by name",
        inputSchema: zodToJsonSchema(MonsterSchema.pick({ name: true })),
      },
    ],
  };
});

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function getMonster(name: string) {
  const monster = await monsters.findOne({
    name: {
      $eq: capitalizeFirstLetter(name),
    },
  });
  return monster;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_monster": {
      const monster = await getMonster(
        request.params.arguments?.name as string
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(monster, null, 2),
          },
        ],
        isError: false,
      };
    }
    case "find_similar_monsters": {
      const monster = await getMonster(
        request.params.arguments?.name as string
      );
      if (!monster) {
        throw new Error("Monster not found");
      }

      const cursor = monsters.find(
        {
          sort: {
            $vector: monster?.vector,
          },
        },
        {
          limit: 20,
        }
      );
      const monstersList: z.infer<typeof MonsterSchema>[] = [];
      for await (const doc of cursor) {
        monstersList.push(doc as z.infer<typeof MonsterSchema>);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(monstersList, null, 2),
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
