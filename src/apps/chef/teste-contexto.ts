import { search_recipes } from "./tools.js";
const free = await search_recipes.invoke(
    { ingrediente: "abóbora" },
    { context: { userId: "u-bob", plan: "free" } },
);
console.log("--- Plano free: uma receita ---");
console.log(free);
const pro = await search_recipes.invoke(
    { ingrediente: "abóbora" },
    { context: { userId: "u-alice", plan: "pro" } },
);
console.log("\n--- Plano pro: até cinco ---");
console.log(pro);