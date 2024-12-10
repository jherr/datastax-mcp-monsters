import { DataAPIClient, VectorDoc } from "@datastax/astra-db-ts";
import fs from "node:fs";

interface Monster extends VectorDoc {
  name: string;
  hit_points: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// TODO: Set these values in the environment
const client = new DataAPIClient("*CLIENT_ID*");
const db = client.db("*API_ENDPOINT*");

try {
  const monsterList = JSON.parse(fs.readFileSync("monsters.json", "utf-8"));

  const collection = await db.createCollection<Monster>("monster_list", {
    vector: {
      dimension: 7,
      metric: "euclidean",
    },
    checkExists: false,
  });

  const monsters = monsterList.map((m) => {
    return {
      ...m,
      $vector: [
        m.hit_points,
        m.strength,
        m.dexterity,
        m.constitution,
        m.intelligence,
        m.wisdom,
        m.charisma,
      ],
    };
  });
  await collection.insertMany(monsters);
} catch (e) {
  console.error(e);
} finally {
  await client.close();
}
