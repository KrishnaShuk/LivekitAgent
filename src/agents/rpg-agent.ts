import { llm, voice } from "@livekit/agents";
import type { SessionUserData } from "../types";
import { z } from 'zod';
import { IntroAgent } from "./intro-agent";

export class RPGAgent extends voice.Agent<SessionUserData> {
    constructor() {
        super({
            instructions: `You are a Dungeon Master for a text-based RPG.
            Your goal is to provide an immersive adventure.
            
            1. Describe the current scene vividly.
            2. Allow the user to explore, fight, or interact.
            3. Use tools to manage the game state (HP, Inventory, Location).
            4. If the user fights, use 'performAction' to roll dice and determine the outcome.
            5. If the user finds an item, use 'addToInventory'.
            6. If the user moves, use 'changeLocation'.
            
            Current State:
            - HP: {{ctx.userData.rpgState.hp}}/{{ctx.userData.rpgState.maxHp}}
            - Inventory: {{ctx.userData.rpgState.inventory}}
            - Location: {{ctx.userData.rpgState.location}}
            
            Be creative, fair, and fun!`,
            tools: {
                checkStatus: llm.tool({
                    description: 'Check the player\'s current status (HP, XP, Inventory)',
                    execute: async (_, { ctx }) => {
                        const s = ctx.userData.rpgState!;
                        return `HP: ${s.hp}/${s.maxHp}, XP: ${s.xp}, Level: ${s.level}, Inventory: ${s.inventory.join(', ') || 'Empty'}, Location: ${s.location}`;
                    }
                }),
                performAction: llm.tool({
                    description: 'Perform a risky action like combat or a skill check',
                    parameters: z.object({
                        actionDescription: z.string().describe('Description of the action being attempted'),
                        difficulty: z.number().describe('Difficulty rating (1-20). 10 is average.'),
                        damage: z.number().optional().describe('Potential damage to player if failed (or to enemy if success)'),
                    }),
                    execute: async ({ actionDescription, difficulty, damage }, { ctx }) => {
                        const roll = Math.floor(Math.random() * 20) + 1;
                        const s = ctx.userData.rpgState!;
                        
                        if (roll >= difficulty) {
                            s.xp += 10;
                            return `Action: ${actionDescription}. Roll: ${roll} (Success!). You gained 10 XP.`;
                        } else {
                            const dmg = damage || 5;
                            s.hp -= dmg;
                            return `Action: ${actionDescription}. Roll: ${roll} (Failure). You took ${dmg} damage. Current HP: ${s.hp}`;
                        }
                    }
                }),
                addToInventory: llm.tool({
                    description: 'Add an item to the player\'s inventory',
                    parameters: z.object({
                        item: z.string().describe('Name of the item to add'),
                    }),
                    execute: async ({ item }, { ctx }) => {
                        ctx.userData.rpgState!.inventory.push(item);
                        return `Added ${item} to inventory.`;
                    }
                }),
                changeLocation: llm.tool({
                    description: 'Move the player to a new location',
                    parameters: z.object({
                        newLocation: z.string().describe('Name/Description of the new location'),
                    }),
                    execute: async ({ newLocation }, { ctx }) => {
                        ctx.userData.rpgState!.location = newLocation;
                        return `Moved to: ${newLocation}`;
                    }
                }),
                quitGame: llm.tool({
                    description: 'End the RPG session and return to main menu',
                    execute: async (_, { ctx }) => {
                        return llm.handoff({
                            agent: new IntroAgent(),
                        });
                    }
                })
            }
        });
    }

    override async onEnter(): Promise<void> {
        await this.session.generateReply({
            instructions: "Describe the starting location (a dark forest entrance) and ask the adventurer what they want to do.",
        });
    }
}
