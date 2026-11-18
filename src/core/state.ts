import * as z from "zod";
import { MessagesValue, ReducedValue, StateSchema } from "@langchain/langgraph";
export const ChefState = new StateSchema({
    // o canal de mensagens do loop — append por id, reducer embutido
    messages: MessagesValue,
    // restrições alimentares acumuladas: concatena sem duplicar
    dietaryFlags: new ReducedValue(z.array(z.string()).default(() => []), {
        reducer: (current, next) => [...new Set([...current, ...next])],
    }),
});

export const StdState = new StateSchema({
    messages: MessagesValue,
    exercicesFlags: new ReducedValue(z.array(z.string()).default(() => []), {
        reducer: (curret, next) => [...new Set([...curret, ...next])],
    })
})
export const ChefContext = z.object({
    userId: z.string(),
    plan: z.enum(["free", "pro"]),
});

export const StdContext = z.object({
    userId: z.string(),
    plan: z.enum(["free", "pro"])
})

// utilizados para tipar o runtime
export type ChefStateT = typeof ChefState.State;
export type ChefCtxT = z.infer<typeof ChefContext>;
export type ExerciceState = typeof StdState.State;
export type StdContext = z.infer<typeof StdContext>;
