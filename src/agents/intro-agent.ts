import { AgentServer, voice, llm } from "@livekit/agents";
import { z } from 'zod';
import { type SessionUserData } from "../types";
import { StoryAgent } from './story-agent';
import { TriviaAgent } from './trivia-agent';



export class IntroAgent extends voice.Agent<SessionUserData> {
    constructor(){
        super({
            instructions: `You are Aurora. Introduce yourself to the user. 
            You have two modes:
            1. Storyteller: You tell interactive stories.
            2. Trivia Master: You host a trivia game.
            
            Ask the user which one they would like to do.
            If they choose Story, proceed with the name/genre/setting collection as before.
            If they choose Trivia, use the 'startTrivia' tool immediately.
            
            Be very friendly and conversational. Only use tools when you have clear info.`,
            tools: {
             recordName: llm.tool({
                description: `Get the user's name and save it in the record`,
                parameters: z.object({
                    name: z.string().describe(`The user's name`),
                }),
                execute: async ({ name }, {ctx}) => {
                    ctx.userData.userName = name;
                    return this.checkAndHandoff(ctx);
                },
            }),
             recordGenre: llm.tool({
                description: 'Record the user\'s favorite story genre',
                parameters: z.object({
                    genre: z.string().describe('Story genre like fantasy, sci-fi, mystery, romance, etc.'),
                }),
                execute: async ({ genre }, {ctx}) => {
                    ctx.userData.favoriteGenre = genre;
                    return this.checkAndHandoff(ctx);
                }
            }),
            recordSetting: llm.tool({
                description: 'Record the story setting/location the user wants',
                parameters: z.object({
                    setting: z.string().describe('The physical setting or location for the story'),
                }),
                execute: async ({ setting }, { ctx }) => {
                    ctx.userData.storySettingLocation = setting;
                    return this.checkAndHandoff(ctx);
                },
            }),
            startTrivia: llm.tool({
                description: 'Start the trivia game mode',
                execute: async (_, { ctx }) => {
                    return llm.handoff({
                        agent: new TriviaAgent(),
                    });
                }
            })
        },
    }); 
}


    private checkAndHandoff(ctx: voice.RunContext<SessionUserData>) {
        if (
            ctx.userData.userName &&
            ctx.userData.favoriteGenre &&
            ctx.userData.storySettingLocation
        ) {
            ctx.userData.isInfoComplete = true;
            return llm.handoff({
                agent: new StoryAgent(),
            });
        }

        return 'Got it! What\'s the next detail?';
    }

    override async onEnter(): Promise<void> {
        await this.session.generateReply({
            instructions: "Greet the user with a warm welcome",
        });
    }
 

}

