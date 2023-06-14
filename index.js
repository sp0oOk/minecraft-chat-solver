// Scrambler logic forked from https://github.com/pwwolf/unscrambler (thanks!)

'use strict';

// Matches and max length of words to solve
let matches = [];
let maxWorldLength = 10;

// Setup .env file
require("dotenv").config();

// Constants and arrow functions for easier use, seems cuter too :3
const unscrambleRegex = /Reaction » First one to unscramble (.*) wins a reward!/,
    typeFastRegex = /Reaction » First one to type (.*) wins a reward!/,
    kickRegex = /You were kicked from factions: (.*)/,
    delayMin = process.env["DELAY_MIN"] || 1000,
    delayMax = process.env["DELAY_MAX"] || 7500,
    mineflayer = require("mineflayer"),
    bot = mineflayer.createBot({
        host: process.env["HOST"] || "play.steroidmc.net",
        username: process.env["EMAIL"],
        auth: process.env["AUTH"] || "microsoft",
        password: process.env["PASSWORD"],
        version: "1.8.9"
    }),
    tree = require("./data/tree.json"),
    immutable = require("immutable"),
    _ = require('lodash'),
    solve = async (unsolved) => {
        matches = [];
        traverse(tree, Immutable.List(unsolved.split("")));
        matches.sort((a, b) => a.length - b.length);

        let mostLikely = "";

        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            if (match.length > maxWorldLength) break;
            let matchLetters = immutable.List(match.split("")).sort();
            let unsolvedWordLetters = immutable.List(unsolved.split("")).sort();
            if (matchLetters.equals(unsolvedWordLetters)) {
                mostLikely = match;
                break;
            }
        }

        return mostLikely;
    },
    traverse = async (wordTree, letters, word = "") => {
        if (wordTree.word) matches.push(word);
        if (letters.size === 0) return;
        _.keys(wordTree).forEach((letter) => {
            if (letters.includes(letter)) {
                var idx = letters.indexOf(letter);
                var newLetters = letters.delete(idx);
                traverse(wordTree[letter], newLetters, word + letter);
            }
        });
    },
    sleep = async (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    randomDelay = async (min, max) => {
        let delay = Math.floor(Math.random() * (max - min + 1) + min);
        await sleep(delay);
    },
    log = (message, level = "info") => console.log(`[BOT] [${level.toUpperCase()}] ${message}`);

// Support so you can enter commands in the console!
process.stdin.on("data", async (data) => bot.chat(data.toString().trim()));

(async () => {

    // Once bot logs in, add chat patterns and wait a few seconds before warping to a server
    bot.once("login", async () => {
        log("Successfully logged into the server! (" + bot.username + ")");
        bot.chatAddPattern(unscrambleRegex, "unscramble");
        bot.chatAddPattern(typeFastRegex, "type");
        bot.chatAddPattern(kickRegex, "autisticError")
        setTimeout(() => bot.chat(process.env["HUB_COMMAND"]), 1500);
    });

    // Logging & Solving events
    bot.on("message", async (message, pos) => console.log(message.toAnsi()));
    bot.on("unscramble", async scrambled => await randomDelay(delayMin, delayMax).then(async () => bot.chat(await solve(scrambled))));
    bot.on("type", async message => await randomDelay(delayMin, delayMax).then(async () => bot.chat(message)));
    bot.on("autisticError", async _ => await randomDelay(1000, 2500).then(() => bot.chat(process.env["HUB_COMMAND"])));
    bot.on("kicked", async reason => log("Kicked from server for reason: " + reason, "error"));

})();