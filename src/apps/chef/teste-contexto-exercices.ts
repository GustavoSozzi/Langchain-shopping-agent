import { listar_exercicios } from "./tools.js";
const free = await listar_exercicios.invoke(
    { topico: "Tipagem básica de funções" },
    { context: { userId: "u-bob", plan: "free" } },
);
console.log("--- Plano free: uma receita ---");
console.log(free);
const pro = await listar_exercicios.invoke(
    { topico: "Tipagem básica de funções" },
    { context: { userId: "u-alice", plan: "pro" } },
);
console.log("\n--- Plano pro: até cinco ---");
console.log(pro);