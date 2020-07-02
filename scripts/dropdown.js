import { log } from "./swade-tokenbar.js";

export async function generateBar() {
  log("Generating Bar");
  let oldBar = document.getElementById("token-dropdown-bar");
  if (oldBar) {
    oldBar.remove();
  }

  $(document.body).off("click.showTokenActionBar");
  $(document.body).off("contextmenu.showTokenActionBar");

  const cancel = () => {
    $dispOptions.remove();
    $(document.body).off("click.showTokenActionBar");
  };

  let display, data, targetId;
  try {
    let selectedActor = canvas.tokens.controlled[0].actor;
    display = "flex";
    data = getContent(selectedActor); //getData(selectedActor);
    targetId = selectedActor._id;
  } catch (e) {
    //selected actor not defined
    display = "none";
    data = "";
    targetId = "";
  }

  //save coords and retreive => client/user flag (TokenBar, Coord)
  let navBounds = document.getElementById("navigation").getBoundingClientRect();
  let y = navBounds.bottom + 20;
  let controlBounds = document
    .getElementById("controls")
    .getBoundingClientRect();
  let x = (controlBounds = controlBounds.right + 50);

  const $dispOptions = $(
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

function getContent(actor) {
  let template = `
    <div id="actionDialog">
      <div class="show-action-form">
        <div class="show-action-dropdowns">
          <div class="show-action-dropdown">
            <button value="showActionClose" class="show-action-dropdown-button">[X]</button>
          </div>
        </div>
      </div>
    </div>
  `;
  return template;
}
