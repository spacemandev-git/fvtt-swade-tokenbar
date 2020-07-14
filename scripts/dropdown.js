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
  let controlBounds = document.getElementById("controls").getBoundingClientRect();
  let x = (controlBounds = controlBounds.right + 50);

  const $dispOptions = $(
    `<div class="tokenbar" targetID="${targetId}" id="token-dropdown-bar" style="display: ${display}; z-index: 70; position: fixed; top: ${y}px; height: auto; left: ${x}px; background-color: #bbb">${data}</div>`
  ).appendTo(document.body);

  $(document.body).on("click.showTokenActionBar", async (evt) => {
    if (evt.target.value == undefined) return;
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
    try {
      await handleEvent(evt, canvas.tokens.controlled[0].actor);
    } catch (e) {
      //fail silently. usually a no actor selected problem
    }
  });
}

async function handleEvent(evt, actor) {
  if (evt.target.value == "" || evt.target.value == undefined || evt.target.value.split(".").length != 2) {
    return;
  }

  let type = evt.target.value.split(".")[0];
  let value = evt.target.value.split(".")[1];
  if (type == "attributes") {
    let rollString = "";
    if (actor.data.data.wildcard) {
      rollString = `{1d${actor.data.data.attributes[value].die.sides}x=, 1d${
        actor.data.data.attributes[value]["wild-die"].sides
      }x=}kh +${actor.calcWoundFatigePenalties()} +${actor.calcStatusPenalties()}`;
    } else {
      rollString = `1d${
        actor.data.data.attributes[value].die.sides
      }x= +${actor.calcWoundFatigePenalties()} +${actor.calcStatusPenalties()}`;
    }
    roll(actor, `${value.toUpperCase()} Roll`, rollString);
  } else if (type == "skill") {
    let skill = actor.items.find((el) => el.data.name == value);
    let rollString = "";
    if (actor.data.data.wildcard) {
      rollString = `{1d${skill.data.data.die.sides}x=, 1d${
        skill.data.data["wild-die"].sides
      }x=}kh +${actor.calcWoundFatigePenalties()} +${actor.calcStatusPenalties()}`;
    } else {
      rollString = `1d${
        skill.data.data.die.sides
      }x= +${actor.calcWoundFatigePenalties()} +${actor.calcStatusPenalties()}`;
    }
    roll(actor, `${value.toUpperCase()} Roll`, rollString);
  } else if (type == "status") {
    if (value == "shaken") {
      await actor.update({ "data.status.isShaken": !actor.data.data.status.isShaken });
    } else if (value == "distracted") {
      await actor.update({ "data.status.isDistracted": !actor.data.data.status.isDistracted });
    } else if (value == "vulnerable") {
      await actor.update({ "data.status.isVulnerable": !actor.data.data.status.isVulnerable });
    }
  } else if (type == "wounds") {
    if (value == "increase") {
      if (actor.data.data.wounds.value + 1 > actor.data.data.wounds.max) {
        ui.notifications.warn("Wounds at Max! Character is Incapaciated");
      } else {
        await actor.update({ "data.wounds.value": actor.data.data.wounds.value + 1 });
      }
    } else if (value == "decrease") {
      if (actor.data.data.wounds.value - 1 < actor.data.data.wounds.min) {
        ui.notifications.warn("Character has no wounds currently!");
      } else {
        await actor.update({ "data.wounds.value": actor.data.data.wounds.value - 1 });
      }
    }
  } else if (type == "fatigue") {
    if (value == "increase") {
      if (actor.data.data.fatigue.value + 1 > actor.data.data.fatigue.max) {
        ui.notifications.warn("Fatigue at Max! Character is Incapaciated");
      } else {
        await actor.update({ "data.fatigue.value": actor.data.data.fatigue.value + 1 });
      }
    } else if (value == "decrease") {
      if (actor.data.data.fatigue.value - 1 < actor.data.data.fatigue.min) {
        ui.notifications.warn("Character has no fatigue currently!");
      } else {
        await actor.update({ "data.fatigue.value": actor.data.data.fatigue.value - 1 });
      }
    }
  } else if (type == "benny") {
    if (value == "spend") {
      actor.spendBenny();
    }
  }
}

function roll(selected, rollDescription, rollString) {
  ChatMessage.create({
    speaker: {
      actor: selected,
      alias: `${selected.name} | ${rollDescription}`,
    },
    roll: new Roll(rollString).roll(),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  });
}

function getContent(actor) {
  let template = `
    <div class="dropdown-list">
      ${getAttributesDropdown()}
      ${getSkillsDropdown(actor)}
      <div class="dropdown-header">
        <button value="showStatusToggle">Status</button>
        <div class="dropdown-content">
          <button value="status.shaken">Toggle ${game.i18n.localize("SWADE.Shaken")}</button>
          <button value="status.distracted">Toggle ${game.i18n.localize("SWADE.Distr")}</button>
          <button value="status.vulnerable">Toggle ${game.i18n.localize("SWADE.Vuln")}</button>
        </div>
      </div>
      <div class="dropdown-header">
        <button value="showWounds">${game.i18n.localize("SWADE.Wounds")}</button>
        <div class="dropdown-content">
          <button value="wounds.increase">+1</button>
          <button value="wounds.decrease">-1</button>
        </div>        
      </div>
      <div class="dropdown-header">
        <button value="showFatigue">${game.i18n.localize("SWADE.Fatigue")}</button>
        <div class="dropdown-content">
          <button value="fatigue.increase">+1</button>
          <button value="fatigue.decrease">-1</button>
        </div>        
      </div>
      ${ifWCSpendBenny(actor)}
      <div class="dropdown-header">
        <button value="showActionClose">[X]</button>
      </div>
    </div>
  `;
  return template;
}

function getAttributesDropdown() {
  let template = `
    <div class="dropdown-header">
      <button value="showAttributes">${game.i18n.localize("SWADE.Attributes")}</button>
      <div class="dropdown-content">
        <button value="attributes.agility">${game.i18n.localize("SWADE.AttrAgi")}</button>
        <button value="attributes.smarts">${game.i18n.localize("SWADE.AttrSma")}</button>
        <button value="attributes.spirit">${game.i18n.localize("SWADE.AttrSpr")}</button>
        <button value="attributes.strength">${game.i18n.localize("SWADE.AttrStr")}</button>
        <button value="attributes.vigor">${game.i18n.localize("SWADE.AttrVig")}</button>
      </div>
    </div>
  `;
  return template;
}

function getSkillsDropdown(actor) {
  let skillsList = actor.items.filter((el) => el.data.type == "skill");
  let skillButtons = ``;
  for (let i = 0; i < skillsList.length; i++) {
    skillButtons += `<button value="skill.${skillsList[i].data.name}">${skillsList[i].data.name}</button>`;
  }

  let template = `
  <div class="dropdown-header">
    <button value="showSkills">${game.i18n.localize("SWADE.Skills")}</button>
    <div class="dropdown-content">
    ${skillButtons}
    </div>
  </div>
  `;
  return template;
}

function ifWCSpendBenny(actor) {
  if (actor.data.data.wildcard) {
    return `
    <div class="dropdown-header">
      <button value="benny.spend">Spend Benny</button>
    </div>
    `;
  } else {
    return "";
  }
}
