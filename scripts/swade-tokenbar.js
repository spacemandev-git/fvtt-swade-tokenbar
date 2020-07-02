import { generateBar } from "./dropdown.js";

//Utility Logging Function
export const log = (...args) => console.log("Token Bar (SWADE) | " + args);

Hooks.on("ready", () => {
  //Register Settings
  canvas.tokens.releaseAll(); // reset all selection
});

Hooks.on("controlToken", () => {
  generateBar();
});
