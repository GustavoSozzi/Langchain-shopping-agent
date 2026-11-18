import {tool, ToolMessage, type ToolRuntime} from "langchain"
import * as z from "zod";
import { Command } from "@langchain/langgraph";
import { ChefCtxT, ChefStateT } from "../../core/state.js";

export const mark_purchased = tool(
    async({item}, runtime: ToolRuntime<ChefStateT, ChefCtxT>) => {
        const userId = runtime.context.userId;
        return new Command({
            update: {
                itensComprados: [item],
                messages: [
                    new ToolMessage({
                        content:
                        `Item "${item}" adicionado a itens comprados para usuario ${userId}. `,
                        tool_call_id: runtime.toolCallId,
                    })
                ]
            }
        });
    },
    {
        name: "mark_purchased",
        description: "Adiciona um item a lista de itens comprados do usuario",

        schema: z.object({
            item: z.string().describe("item comprado"),
        }),
    },
);