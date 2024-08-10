const APPCONFIG = {
  API: "http://127.0.0.1:4000",
};

let getPricesInvterval;

//Execute when the DOM is loaded
document.addEventListener("DOMContentLoaded", (event) => {
  //Detect the network status
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  //Init App
  updateOnlineStatus();
});

//Update Online Status
function updateOnlineStatus() {
  if (navigator.onLine) {
    document.querySelector(".connection-status span").innerHTML =
      "We are online";
    document.querySelector(".connection-status").classList.add("dpnone");
    document.querySelector(".connection-status").classList.remove("offline");

    startFetchingData();
  } else {
    document.querySelector(".connection-status span").innerHTML =
      "No internet connection";
    document.querySelector(".connection-status").classList.remove("dpnone");
    document.querySelector(".connection-status").classList.add("offline");

    stopFetchingData();
  }
}

//Start Fetching Prices
function startFetchingData() {
  NotificationMSG("Actualizando Datos");

  GetPrices();
  GetStoredTokens();
  FormSaveStoredToken();

  getPricesInvterval = setInterval(GetPrices, 5000);
}

//Stop Fetching Prices
function stopFetchingData() {
  NotificationMSG("Stop Fetch & Cleaning Intervals");
  clearInterval(getPricesInvterval);
}

//Get prices list
async function GetPrices() {
  const prices = await FetchData(APPCONFIG.API + "/coin/price/");
  if (!prices) return;

  document.querySelector(".trending-coins").innerHTML = "";

  const ul = document.createElement("ul");

  for (const token of prices) {
    ul.insertAdjacentHTML("beforeend", `<li>${token}</li>`);
  }

  document
    .querySelector(".trending-coins")
    .insertAdjacentElement("afterbegin", ul);
}

//Load Stored Token Components
async function GetStoredTokens() {
  //Query the tokens stored in the dabatase
  const tokens = await ListStoredTokens();
  if (!tokens) return;

  document.querySelector(".stored-coins").innerHTML = "";

  let divStoredToken = document.querySelector(".stored-coins");

  const ul = document.createElement("ul");
  const inlineForm = document.createElement("form");

  const titleNoTokensFinded = document.createElement("h3");
  if (tokens.length == 0) {
    //Add title 'No tokens sabed'
    titleNoTokensFinded.innerText = "No tokends saved, please add a new one";
    document
      .querySelector(".stored-coins")
      .insertAdjacentElement("afterbegin", titleNoTokensFinded);
  } else {
    for (const token of tokens) {
      ul.insertAdjacentHTML(
        "beforeend",
        `<li >${token.tokenName} : ${token.tokenPublicID} | <a class="delete-token" href="" data-tokenid="${token.tokenPublicID}">Delete</a> | <a class="edit-token" href="" data-tokenpublicid="${token.tokenPublicID}" data-tokenid="${token._id}" data-tokenname="${token.tokenName}">Edit</a> </li>`
      );
    }

    document
      .querySelector(".stored-coins")
      .insertAdjacentElement("afterbegin", ul);

    //Add eventlisteners to the delete links
    document
      .querySelectorAll(".delete-token")
      .forEach(async function (deleteLink) {
        deleteLink.addEventListener("click", async function (event) {
          event.preventDefault();

          const result = await DeleteOneToken({
            tokenPublicID: event.target.dataset.tokenid,
          });
          if (!result) return;

          divStoredToken.innerHTML = "";
          divStoredToken = null;
        });
      });
    //Add eventlisteners to the edit links
    document.querySelectorAll(".edit-token").forEach(async function (editLink) {
      editLink.addEventListener("click", async function (event) {
        event.preventDefault();

        if (
          event.target.nextSibling &&
          event.target.nextSibling.tagName === "FORM"
        ) {
        } else {
          if (document.querySelector(".inline-form"))
            document.querySelector(".inline-form").remove();

          const target = event.target;

          inlineForm.classList.add("inline-form");

          //form unputs
          const inputTokenName = document.createElement("input");
          inputTokenName.type = "text";
          inputTokenName.name = "tokenName";
          inputTokenName.value = target.dataset.tokenname;
          inputTokenName.defaultValue = target.dataset.tokenname;

          const inputTokenPublicID = document.createElement("input");
          inputTokenPublicID.type = "text";
          inputTokenPublicID.name = "tokenPublicID";
          inputTokenPublicID.value = target.dataset.tokenpublicid;
          inputTokenPublicID.defaultValue = target.dataset.tokenpublicid;

          const cancelUpdate = document.createElement("input");
          cancelUpdate.type = "button";
          cancelUpdate.value = "Cancel";

          cancelUpdate.addEventListener("click", function (event) {
            event.preventDefault();
            cancelUpdate.parentElement.remove();
          });

          const updateSubmit = document.createElement("input");
          updateSubmit.type = "submit";
          updateSubmit.disabled = true;

          inlineForm.appendChild(inputTokenName);
          inlineForm.appendChild(inputTokenPublicID);
          inlineForm.appendChild(cancelUpdate);
          inlineForm.appendChild(updateSubmit);

          target.insertAdjacentElement("afterEnd", inlineForm);

          inlineForm.addEventListener("input", function (event) {
            if (
              inputTokenName.value == inputTokenName.defaultValue &&
              inputTokenPublicID.value == inputTokenPublicID.defaultValue
            ) {
              updateSubmit.disabled = true;
            } else {
              updateSubmit.disabled = false;
            }
          });

          inlineForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const payload = {
              tokenName: inputTokenName.value,
              tokenPublicID: inputTokenPublicID.value,
              tokenID: target.dataset.tokenid,
            };

            const result = await UpdateOneToken(payload);
            if (!result) return;

            divStoredToken.innerHTML = "";
            divStoredToken = null;
          });
        }
      });
    });
  }
}

//Save a stored token
async function FormSaveStoredToken() {
  if (!document.querySelector(".save-coin").hasChildNodes()) {
    const formAddToken = document.createElement("form");
    const addNewTokenButton = document.createElement("a");

    //Add a form to add new tokens
    formAddToken.id = "add-token";
    formAddToken.classList.add("dpnone");

    const inputTokenName = document.createElement("input");
    inputTokenName.name = "tokenName";
    inputTokenName.placeholder = "Token name";
    inputTokenName.type = "text";
    inputTokenName.required = true;

    formAddToken.insertAdjacentElement("beforeend", inputTokenName);

    const inputTokenPublicID = document.createElement("input");
    inputTokenPublicID.name = "tokenPublicID";
    inputTokenPublicID.placeholder = "Token ID";
    inputTokenPublicID.type = "text";
    inputTokenPublicID.required = true;

    formAddToken.insertAdjacentElement("beforeend", inputTokenPublicID);

    const cancelUpdate = document.createElement("input");
    cancelUpdate.type = "button";
    cancelUpdate.value = "Cancel";

    cancelUpdate.addEventListener("click", function (event) {
      event.preventDefault();
      event.target.parentElement.reset();
      addNewTokenButton.classList.toggle("dpnone");
      formAddToken.classList.toggle("dpnone");
    });

    formAddToken.insertAdjacentElement("beforeend", cancelUpdate);

    const submitInput = document.createElement("input");
    submitInput.type = "submit";
    submitInput.value = "Add token";
    submitInput.disabled = true;

    formAddToken.insertAdjacentElement("beforeend", submitInput);

    //Form Validations
    formAddToken.addEventListener("input", function (event) {
      if (inputTokenName.value && inputTokenPublicID.value) {
        submitInput.disabled = false;
      } else {
        submitInput.disabled = true;
      }
    });

    //Add token form logic
    formAddToken.addEventListener("submit", async function (event) {
      event.preventDefault();
      const { target } = event;
      const payload = {
        tokenName: target.tokenName.value,
        tokenPublicID: target.tokenPublicID.value,
      };

      const result = await SaveOneToken(payload);
      if (!result) return;

      document.querySelector(".save-coin").innerHTML = "";
      FormSaveStoredToken();
    });

    document
      .querySelector(".save-coin")
      .insertAdjacentElement("beforeend", formAddToken);

    //Add button to show the form to add new token
    addNewTokenButton.text = "Add token";
    addNewTokenButton.href = "#";

    addNewTokenButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.target.classList.add("dpnone");
      formAddToken.classList.toggle("dpnone");
      inputTokenName.focus();
    });

    document
      .querySelector(".save-coin")
      .insertAdjacentElement("beforeend", addNewTokenButton);
  }
}

//CRUD Stored tokens
async function ListStoredTokens() {
  const tokens = await FetchData(APPCONFIG.API + "/coin/data/list/");
  if (!tokens) {
    return;
  } else {
    return tokens;
  }
}
async function SaveOneToken(tokenData) {
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" }, //This can be a header object or literal string object {''}
    body: JSON.stringify(tokenData), //Convert the object to JSON to fastify validations
  };

  const result = await FetchData(APPCONFIG.API + "/coin/data/add/", opts);
  if (!result) {
    return;
  }

  NotificationMSG("Token Saved");
  GetPrices();
  GetStoredTokens();

  return result;
}
async function DeleteOneToken(tokenPublicID) {
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" }, //This can be a header object or literal string object {''}
    body: JSON.stringify(tokenPublicID), //Convert the object to JSON to fastify validations
  };

  const result = await FetchData(APPCONFIG.API + "/coin/data/delete/", opts);
  if (!result) {
    return;
  }

  NotificationMSG("Token Deleted");
  GetStoredTokens();
  return result;
}
async function UpdateOneToken(tokenData) {
  const opts = {
    method: "PUT",
    headers: { "Content-Type": "application/json" }, //This can be a header object or literal string object {''}
    body: JSON.stringify(tokenData), //Convert the object to JSON to fastify validations
  };

  const result = await FetchData(APPCONFIG.API + "/coin/data/update/", opts);
  if (!result) {
    return;
  }

  NotificationMSG("Token Updated");
  GetStoredTokens();
  GetPrices();
  return result;
}

//UTILS
//Handle fetchs
async function FetchData(url, opts) {
  try {
    const response = await fetch(url, opts);
    if (!response.ok) {
      throw new Error(`HTTP Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    NotificationMSG(error);
    return null;
  }
}

//Create a notification
function NotificationMSG(msg) {
  Toastify({
    text: msg,
    duration: 3000,
  }).showToast();
}