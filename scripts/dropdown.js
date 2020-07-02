import { log } from "./swade-tokenbar.js";

export async function generateBar() {
  log("Generating Bar");
  let oldBar = document.getElementById("token-dropdown-bar");
  if (oldBar) {
    oldbar.remove();
  }

  $(document.body).off("click.showTokenActionBar");
  $(document.body).off("contextmenu.showTokenActionBar");

  const cancel = () => {
    $dispOptions.remove();
    $(document.body).off("click.showTokenActionBar");
  };
  //no need to check if tokens > 1, because Hook is only called when token is selected
  let selectedActor = canvas.tokens.controlled[0].actor;
  let display, data, targetId;
  if (selectedActor == null) {
    display = "none";
    data = "";
    targetId = "";
  } else {
    display = "flex";
    data = "<p>Test</p>"; //getData(selectedActor);
    targetId = selectedActor._id;
  }

  //save coords and retreive => client/user flag (TokenBar, Coord)
  let navBounds = document.getElementById("navigation").getBoundingClientRect();
  let y = navBounds.bottom + 20;
  let controlBounds = document
    .getElementById("controls")
    .getBoundingClientRect();
  let x = (controlBounds = controlBounds.right + 50);

  log(data);
  $(
    `<div class="tokenbar" targetID="${targetId}" id="token-dropdown-bar" style="display: ${display}; z-index: 70; position: fixed; top: ${y}px; height: auto; left: ${x}px; background-color: #bbb">${data}</div>`
  ).appendTo(document.body);

  $(document.body).on("click.showTokenActionBar", (evt) => {
    if (evt.target.value == undefined) return;
    log(evt);
    Hooks.once(`updateActor`, (updatedActor) => {
      // If the selected actor is updated (new item, skill, whatever) regenerate the bar
      if (updatedActor.data._id == selectedActor.data._id) {
        generateBar();
      }
    });
    Hooks.once(`updateOwnedItem`, (updatedActor) => {
      //if a given item that the actor owns is updated then regen the bar
      if (updatedActor.data._id == selectedActor.data._id) {
        generateBar();
      }
    });

    if (evt.target.value == "showActionClose") {
      cancel();
      return;
    }
  });
}
